import Phaser from 'phaser';
import { ITEM_ICON_URLS, itemIconKey } from '../items/icons';
import { SLOT_SILHOUETTE_URLS, slotSilhouetteKey, ZONE_DECOR_URLS, zoneDecorKey, UPGRADE_ICON_URLS, upgradeIconKey } from '../ui/silhouettes';
import { REWARD_ICON_URLS, rewardIconKey } from '../ui/rewards';
import { MOB_MECHANIC_ICON_URLS, mobMechanicIconKey, type MechanicId } from '../ui/mobMechanics';
import { ensureItemPlates } from '../ui/itemIcon';
import { ZONE_BG_VARIANTS, zoneBgKey, type BgLayer, ZONE_BG_OBJECTS, zoneObjKey, type ScatterLayer } from '../zones/registry';
import { ALL_MOB_IDS } from '../mobs/registry';
import { SOUND_FILES, MUSIC_FILES, soundVariants, soundAssetKey, musicVariants, musicAssetKey, type SoundKey, type MusicKey } from '../core/SoundRegistry';
import { SoundManager } from '../core/SoundManager';
import { CX, GAME_H } from '../ui/layout';
import { FONT_FAMILY } from '../ui/theme';
import { t } from '../i18n/t';

function isSvgUrl(url: string): boolean {
  return url.split('?')[0].endsWith('.svg');
}

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  /**
   * Экран без этого индикатора выглядит зависшим на медленном канале — это первая загрузка
   * (иконки/фоны/звуки, ассеты ещё не в кэше браузера), может занимать заметное время.
   */
  private buildLoadingBar() {
    const barW = 400;
    const barH = 18;
    const x = CX - barW / 2;
    const y = GAME_H / 2 - barH / 2;

    const label = this.add.text(CX, y - 34, t('preload_loading'), {
      fontFamily: FONT_FAMILY,
      fontSize: '20px',
      color: '#e8d9b0',
    }).setOrigin(0.5);

    const track = this.add.rectangle(CX, y + barH / 2, barW, barH, 0x1a1a2a, 0.9)
      .setStrokeStyle(2, 0x554422);

    const fill = this.add.rectangle(x + 2, y + barH / 2, 0, barH - 4, 0xffcc33, 1)
      .setOrigin(0, 0.5);

    const percent = this.add.text(CX, y + barH + 22, '0%', {
      fontFamily: FONT_FAMILY,
      fontSize: '16px',
      color: '#999999',
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      fill.width = (barW - 4) * value;
      percent.setText(`${Math.round(value * 100)}%`);
    });

    this.load.on('complete', () => {
      label.destroy();
      track.destroy();
      fill.destroy();
      percent.destroy();
    });
  }

  preload() {
    this.buildLoadingBar();

    // Иконки предметов постепенно переезжают с SVG на растровый пиксель-арт (icon.png) —
    // грузим по расширению URL. assetsInlineLimit:0 в vite.config.ts гарантирует, что оба
    // формата приходят настоящим путём с расширением, а не data-URI.
    for (const [item_id, url] of Object.entries(ITEM_ICON_URLS)) {
      if (isSvgUrl(url)) this.load.svg(itemIconKey(item_id), url, { width: 40, height: 40 });
      else this.load.image(itemIconKey(item_id), url);
    }
    for (const [slotId, url] of Object.entries(SLOT_SILHOUETTE_URLS)) {
      this.load.svg(slotSilhouetteKey(slotId), url, { width: 40, height: 40 });
    }
    for (const [id, url] of Object.entries(UPGRADE_ICON_URLS)) {
      this.load.svg(upgradeIconKey(id as 'plus' | 'question_mark'), url, { width: 32, height: 32 });
    }
    for (const [id, url] of Object.entries(REWARD_ICON_URLS)) {
      this.load.svg(rewardIconKey(id), url, { width: 72, height: 72 });
    }
    for (const [id, url] of Object.entries(MOB_MECHANIC_ICON_URLS)) {
      this.load.svg(mobMechanicIconKey(id as MechanicId), url, { width: 40, height: 40 });
    }
    this.load.svg(zoneDecorKey('warrior'), ZONE_DECOR_URLS.warrior, { width: 362, height: 400 });
    this.load.svg(zoneDecorKey('backpack'), ZONE_DECOR_URLS.backpack, { width: 292, height: 400 });
    this.load.svg(zoneDecorKey('anvil'), ZONE_DECOR_URLS.anvil, { width: 432, height: 360 });
    this.load.svg(zoneDecorKey('belt'), ZONE_DECOR_URLS.belt, { width: 360, height: 104 });
    this.load.svg('hammer', 'hammer.svg', { width: 32, height: 32 });
    this.load.image('map-texture', 'backgrounds/map-texture.webp');
    this.load.image('bg-camp', 'backgrounds/camp.webp');
    this.load.image('camp-fire', 'sprites/camp/campfire.2.webp');
    this.load.image('npc-smith', 'sprites/npc/smith.webp');
    this.load.image('npc-dealer', 'sprites/npc/dealer.webp');
    this.load.image('npc-flutist', 'sprites/npc/flutist.webp');
    this.load.image('chest-stand', 'sprites/npc/chest-stand.webp');
    this.load.image('char-strongman', 'sprites/characters/strongman/camp.webp');
    // Боевые листы грузим как изображения — нарезаются по числу кадров в сцене
    // (frameWidth = width / count), чтобы переэкспорт из Aseprite не ломал нарезку.
    this.load.image('char-strongman-idle',   'sprites/characters/strongman/idle.webp');
    this.load.image('char-strongman-walk',   'sprites/characters/strongman/walk.webp');
    this.load.image('char-strongman-attack', 'sprites/characters/strongman/attack.webp');
    this.load.image('char-strongman-hit',    'sprites/characters/strongman/hit.webp');
    this.load.image('char-strongman-death',  'sprites/characters/strongman/dead.webp');

    // Спрайты-заглушки мобов (одиночный base.webp на моба)
    for (const id of ALL_MOB_IDS) {
      this.load.image(`mob-${id}`, `sprites/mobs/${id}/base.webp`);
    }

    for (const [folder, layers] of Object.entries(ZONE_BG_VARIANTS)) {
      for (const [layer, count] of Object.entries(layers)) {
        for (let n = 1; n <= (count ?? 0); n++) {
          this.load.image(zoneBgKey(folder, layer as BgLayer, n), `backgrounds/zones/${folder}/${layer}.${n}.webp`);
        }
      }
    }

    // Общий плоский пул объектов mid/fore — каждый slug грузится один раз, даже если его
    // использует несколько зон (ZONE_BG_OBJECTS).
    const loadedObjKeys = new Set<string>();
    for (const layers of Object.values(ZONE_BG_OBJECTS)) {
      for (const [layer, slugs] of Object.entries(layers)) {
        for (const slug of slugs ?? []) {
          const key = zoneObjKey(layer as ScatterLayer, slug);
          if (loadedObjKeys.has(key)) continue;
          loadedObjKeys.add(key);
          this.load.image(key, `backgrounds/objects/${layer}/${slug}.webp`);
        }
      }
    }

    for (const key of Object.keys(SOUND_FILES) as SoundKey[]) {
      soundVariants(key).forEach((url, i) => this.load.audio(soundAssetKey(key, i), url));
    }
    for (const key of Object.keys(MUSIC_FILES) as MusicKey[]) {
      musicVariants(key).forEach((url, i) => this.load.audio(musicAssetKey(key, i), url));
    }
  }

  create() {
    // SVG-иконки — векторная линия, не пиксель-арт: под глобальным NEAREST (pixelArt:true в main.ts,
    // нужен для чётких спрайтов персонажей/мобов) их диагонали превращаются в лесенку без анти-алиасинга.
    // Переключаем фильтрацию конкретно для этих текстур на LINEAR.
    // PNG-иконки предметов — наоборот, пиксель-арт: оставляем им глобальный NEAREST.
    const smoothKeys = [
      ...Object.entries(ITEM_ICON_URLS).filter(([, url]) => isSvgUrl(url)).map(([id]) => itemIconKey(id)),
      ...Object.keys(SLOT_SILHOUETTE_URLS).map(slotSilhouetteKey),
      ...Object.keys(REWARD_ICON_URLS).map(rewardIconKey),
      ...Object.keys(UPGRADE_ICON_URLS).map(id => upgradeIconKey(id as 'plus' | 'question_mark')),
      ...Object.keys(MOB_MECHANIC_ICON_URLS).map(id => mobMechanicIconKey(id as MechanicId)),
      zoneDecorKey('warrior'), zoneDecorKey('backpack'), zoneDecorKey('anvil'), zoneDecorKey('belt'),
      'hammer',
    ];
    for (const key of smoothKeys) {
      this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
    }

    // Программный фон под иконками предметов (src/ui/itemIcon.ts): PNG-иконки прозрачные, плашку
    // рисуем сами. Текстуры глобальны для game.textures — достаточно одного вызова здесь.
    ensureItemPlates(this);

    SoundManager.init(this.game);
    this.scene.start('CampScene');
  }
}