import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOBS_DIR = path.join(__dirname, 'src/mobs');

// Dev-only API для tools/mob-ui-tuner.html: пишет подобранный `ui` (scale/move/alpha) сразу
// в src/mobs/{id}/config.json, чтобы не редактировать JSON руками. В prod-сборку не попадает
// (apply: 'serve').
function saveMobUiPlugin(): Plugin {
  return {
    name: 'save-mob-ui',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__save-mob-ui', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end();
          return;
        }
        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', () => {
          try {
            const { mobId, ui } = JSON.parse(body);
            if (typeof mobId !== 'string' || !/^[a-z][a-z0-9_]*$/.test(mobId)) {
              throw new Error('bad mobId');
            }
            const file = path.join(MOBS_DIR, mobId, 'config.json');
            if (!fs.existsSync(file)) throw new Error('unknown mob');
            const cfg = JSON.parse(fs.readFileSync(file, 'utf-8'));
            if (ui && Object.keys(ui).length > 0) cfg.ui = ui;
            else delete cfg.ui;
            fs.writeFileSync(file, JSON.stringify(cfg, null, 2) + '\n');
            res.statusCode = 200;
            res.end('ok');
          } catch (e) {
            res.statusCode = 400;
            res.end(String(e instanceof Error ? e.message : e));
          }
        });
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [saveMobUiPlugin()],
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
  server: {
    watch: {
      // usePolling: вотчер опрашивает файлы через stat вместо нативных хэндлов (fs.watch).
      // На Windows это: (1) не падает с EBUSY, когда внешний редактор (Aseprite) держит файл
      // залоченным; (2) подхватывает добавленные в public/ ассеты вживую. Иначе при игноре
      // public/ новые картинки не отдавались дев-сервером (Phaser получал index.html).
      usePolling: true,
      interval: 300,
      ignored: ['**/docs/**'],
    },
  },
});
