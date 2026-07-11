import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
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
