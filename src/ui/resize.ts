import Phaser from 'phaser';
import { recomputeLayout, GAME_W, GAME_H } from './layout';

/** Сцена, умеющая пересобрать себя под новую ширину холста. */
interface Relayoutable {
  relayoutOnResize(): void;
}

function isRelayoutable(scene: Phaser.Scene): scene is Phaser.Scene & Relayoutable {
  return typeof (scene as Partial<Relayoutable>).relayoutOnResize === 'function';
}

const DEBOUNCE_MS = 250;

/**
 * Держит аспект логического холста равным аспекту окна — иначе Scale.FIT оставляет полосы.
 * Самый частый случай: F11. В окне браузерный хром съедает высоту, аспект вьюпорта шире; в
 * полноэкранном режиме хром исчезает и посчитанный на старте холст оказывается шире экрана —
 * появляется леттербокс сверху/снизу.
 *
 * Раскладка сцен не пересчитывается на месте, а пересобирается рестартом — каждая сцена делает это
 * сама в relayoutOnResize (CampScene целиком строится из MetaStore, ExpeditionScene переносит
 * состояние похода). Сцены без этого метода (PreloadScene) не трогаем: раскладки у них нет, а
 * рестарт посреди загрузки ассетов только навредил бы.
 */
export function installResizeHandler(game: Phaser.Game): void {
  let timer: number | undefined;

  window.addEventListener('resize', () => {
    // F11 присылает несколько событий подряд, перетаскивание границы окна — десятки: ждём тишины.
    window.clearTimeout(timer);
    timer = window.setTimeout(() => apply(game), DEBOUNCE_MS);
  });
}

function apply(game: Phaser.Game): void {
  if (!recomputeLayout()) return;

  game.scale.setGameSize(GAME_W, GAME_H);
  // setGameSize переписывает атрибуты и инлайновые стили канвы — возвращаем плавную интерполяцию
  // финального CSS-масштаба (зачем она нужна — см. комментарий в src/main.ts).
  Phaser.Display.Canvas.CanvasInterpolation.setBicubic(game.canvas);

  for (const scene of game.scene.getScenes(true)) {
    if (isRelayoutable(scene)) scene.relayoutOnResize();
  }
}
