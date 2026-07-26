import Phaser from 'phaser';
import { ITEM_ICON_URLS, itemIconKey } from '../items/icons';
import { SLOT_SILHOUETTE_URLS, slotSilhouetteKey, ZONE_DECOR_URLS, zoneDecorKey, UPGRADE_ICON_URLS, upgradeIconKey } from '../ui/silhouettes';
import { REWARD_ICON_URLS, rewardIconKey } from '../ui/rewards';
import { ZONE_BG_VARIANTS, zoneBgKey, type BgLayer, ZONE_BG_OBJECTS, zoneObjKey, type ScatterLayer } from '../zones/registry';
import { ALL_MOB_IDS } from '../mobs/registry';
import { SOUND_FILES, MUSIC_FILES, soundVariants, soundAssetKey, musicVariants, musicAssetKey, type SoundKey, type MusicKey } from '../core/SoundRegistry';
import { SoundManager } from '../core/SoundManager';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    for (const [item_id, url] of Object.entries(ITEM_ICON_URLS)) {
      this.load.svg(itemIconKey(item_id), url, { width: 40, height: 40 });
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
    this.load.svg(zoneDecorKey('warrior'), ZONE_DECOR_URLS.warrior, { width: 362, height: 400 });
    this.load.svg(zoneDecorKey('backpack'), ZONE_DECOR_URLS.backpack, { width: 292, height: 400 });
    this.load.svg(zoneDecorKey('anvil'), ZONE_DECOR_URLS.anvil, { width: 432, height: 360 });
    this.load.svg(zoneDecorKey('belt'), ZONE_DECOR_URLS.belt, { width: 360, height: 104 });
    this.load.svg('hammer', 'hammer.svg', { width: 32, height: 32 });
    this.load.image('map-texture', 'backgrounds/map-texture.png');
    this.load.image('bg-camp', 'backgrounds/camp.png');
    this.load.image('camp-fire', 'sprites/camp/campfire.2.png');
    this.load.image('npc-smith', 'sprites/npc/smith.png');
    this.load.image('npc-dealer', 'sprites/npc/dealer.png');
    this.load.image('npc-flutist', 'sprites/npc/flutist.png');
    this.load.image('chest-stand', 'sprites/npc/chest-stand.png');
    this.load.image('char-strongman', 'sprites/characters/strongman/camp.png');
    // Боевые листы грузим как изображения — нарезаются по числу кадров в сцене
    // (frameWidth = width / count), чтобы переэкспорт из Aseprite не ломал нарезку.
    this.load.image('char-strongman-idle',   'sprites/characters/strongman/idle.png');
    this.load.image('char-strongman-walk',   'sprites/characters/strongman/walk.png');
    this.load.image('char-strongman-attack', 'sprites/characters/strongman/attack.png');
    this.load.image('char-strongman-hit',    'sprites/characters/strongman/hit.png');
    this.load.image('char-strongman-death',  'sprites/characters/strongman/dead.png');

    // Спрайты-заглушки мобов (одиночный base.png на моба)
    for (const id of ALL_MOB_IDS) {
      this.load.image(`mob-${id}`, `sprites/mobs/${id}/base.png`);
    }

    for (const [folder, layers] of Object.entries(ZONE_BG_VARIANTS)) {
      for (const [layer, count] of Object.entries(layers)) {
        for (let n = 1; n <= (count ?? 0); n++) {
          this.load.image(zoneBgKey(folder, layer as BgLayer, n), `backgrounds/zones/${folder}/${layer}.${n}.png`);
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
          this.load.image(key, `backgrounds/objects/${layer}/${slug}.png`);
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
    const smoothKeys = [
      ...Object.keys(ITEM_ICON_URLS).map(itemIconKey),
      ...Object.keys(SLOT_SILHOUETTE_URLS).map(slotSilhouetteKey),
      ...Object.keys(REWARD_ICON_URLS).map(rewardIconKey),
      ...Object.keys(UPGRADE_ICON_URLS).map(id => upgradeIconKey(id as 'plus' | 'question_mark')),
      zoneDecorKey('warrior'), zoneDecorKey('backpack'), zoneDecorKey('anvil'), zoneDecorKey('belt'),
      'hammer',
    ];
    for (const key of smoothKeys) {
      this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
    }

    SoundManager.init(this.game);
    this.scene.start('CampScene');
  }
}