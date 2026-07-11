import Phaser from 'phaser';
import { PreloadScene } from './scenes/PreloadScene';
import { CampScene } from './scenes/CampScene';
import { ExpeditionScene } from './scenes/ExpeditionScene';
import { MetaStore } from './core/MetaStore';
import { loadFonts } from './ui/theme';

MetaStore.init();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 1280,
  height: 800,
  backgroundColor: '#1a1a2e',
  // Пиксель-арт: NEAREST-сэмплинг + округление позиций — убирает мерцание/мельтешение
  // при скролле фонов и масштабировании спрайтов.
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [PreloadScene, CampScene, ExpeditionScene],
};

loadFonts().then(() => {
  const game = new Phaser.Game(config);
  // pixelArt:true ставит на весь canvas CSS image-rendering:pixelated (нужно, чтобы спрайты
  // не блюрились при масштабировании внутри игры). Побочный эффект: Scale.FIT на экранах с
  // нецелым коэффициентом растяжения тем же nearest-neighbor ресемплит уже отрисованный текст,
  // и буквы одного слова визуально «плывут» по размеру. Возвращаем плавную интерполяцию для
  // финального CSS-масштаба канвы — сэмплинг текстур спрайтов внутри игры (antialiasGL) не трогаем.
  Phaser.Display.Canvas.CanvasInterpolation.setBicubic(game.canvas);
});
