import Phaser from 'phaser';
import { ITEM_ICON_URLS, itemIconKey } from '../items/icons';
import { SLOT_SILHOUETTE_URLS, slotSilhouetteKey, ZONE_DECOR_URLS, zoneDecorKey } from '../ui/silhouettes';
import { REWARD_ICON_URLS, rewardIconKey } from '../ui/rewards';
import { ZONE_BG_VARIANTS, zoneBgKey, type BgLayer } from '../zones/registry';
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
    for (const [id, url] of Object.entries(REWARD_ICON_URLS)) {
      this.load.svg(rewardIconKey(id), url, { width: 72, height: 72 });
    }
    this.load.svg(zoneDecorKey('warrior'), ZONE_DECOR_URLS.warrior, { width: 322, height: 386 });
    this.load.svg(zoneDecorKey('backpack'), ZONE_DECOR_URLS.backpack, { width: 364, height: 400 });
    this.load.svg(zoneDecorKey('anvil'), ZONE_DECOR_URLS.anvil, { width: 432, height: 360 });
    this.load.svg(zoneDecorKey('belt'), ZONE_DECOR_URLS.belt, { width: 360, height: 104 });
    this.load.svg('hammer', '/hammer.svg', { width: 32, height: 32 });
    this.load.image('map-texture', '/backgrounds/map-texture.png');
    this.load.image('bg-camp', '/backgrounds/camp.2.png');
    this.load.image('camp-fire', '/sprites/camp/campfire.2.png');
    this.load.image('npc-smith', '/sprites/npc/smith.png');
    this.load.image('npc-dealer', '/sprites/npc/dealer.png');
    this.load.image('npc-flutist', '/sprites/npc/flutist.png');
    this.load.image('chest-stand', '/sprites/npc/chest-stand.png');
    this.load.image('char-strongman', '/sprites/characters/strongman/camp.png');
    // Боевые листы грузим как изображения — нарезаются по числу кадров в сцене
    // (frameWidth = width / count), чтобы переэкспорт из Aseprite не ломал нарезку.
    this.load.image('char-strongman-idle',   '/sprites/characters/strongman/idle.png');
    this.load.image('char-strongman-walk',   '/sprites/characters/strongman/walk.png');
    this.load.image('char-strongman-attack', '/sprites/characters/strongman/attack.png');
    this.load.image('char-strongman-hit',    '/sprites/characters/strongman/hit.png');
    this.load.image('char-strongman-death',  '/sprites/characters/strongman/dead.png');

    // Спрайты-заглушки мобов (одиночный base.png на моба)
    for (const id of ALL_MOB_IDS) {
      this.load.image(`mob-${id}`, `/sprites/mobs/${id}/base.png`);
    }

    for (const [folder, layers] of Object.entries(ZONE_BG_VARIANTS)) {
      for (const [layer, count] of Object.entries(layers)) {
        for (let n = 1; n <= (count ?? 0); n++) {
          this.load.image(zoneBgKey(folder, layer as BgLayer, n), `/backgrounds/zones/${folder}/${layer}.${n}.png`);
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
    SoundManager.init(this.game);
    this.scene.start('CampScene');
  }
}