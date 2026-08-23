import Phaser from 'phaser';
import { EventBus } from './EventBus';
import {
  soundVariants, soundAssetKey, musicVariants, musicAssetKey,
  SOUND_MIX, MUSIC_MIX,
  type SoundKey, type MusicKey, type SoundCategory,
} from './SoundRegistry';

const LS_VOLUME = 'carrion.sound.volume';
const LS_MUTED = 'carrion.sound.muted';
const LS_CATEGORY = 'carrion.sound.cat.';
// Легаси-ключ от времён, когда громкость флейты жила отдельным слоем (мигрируется в 'music').
const LS_LEGACY_FLUTE = 'carrion.sound.layer.amb_flute';

// Схлопывание одинаковых звуков, прилетевших «всплеском» (каскады урона, ×4-скорость).
// Один и тот же ключ не звучит чаще, чем раз в THROTTLE_MS — иначе на быстрых боях каша.
const THROTTLE_MS = 60;

const DEFAULT_VOLUME = 0.5;
const DEFAULT_CATEGORIES: Record<SoundCategory, number> = {
  ambient: DEFAULT_VOLUME,
  music: DEFAULT_VOLUME,
  sfx: DEFAULT_VOLUME,
};

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

/**
 * Тонкий слой над аудио-движком Phaser. Игровая логика про звук не знает:
 * - UI/глобальные звуки вешаются на EventBus здесь же (как Floater слушает 'floater');
 * - боевые звуки сцена проигрывает напрямую через SoundManager.play(...) в своих колбэках.
 *
 * Громкость трёхэтажная: мастер (движок) × категория (ползунок игрока) × base (микс из
 * SoundRegistry). Всё персистится в localStorage. Об изменениях громкости/мьюта уходит
 * EventBus-событие 'sound_settings_changed' — на него подписан UI настроек, чтобы
 * не разъезжаться с глобальной клавишей M.
 */
class SoundManagerImpl {
  private sound?: Phaser.Sound.BaseSoundManager;
  private lastPlayed = new Map<SoundKey, number>();
  private layers = new Map<MusicKey, Phaser.Sound.BaseSound>();
  private volume = DEFAULT_VOLUME;
  private categories: Record<SoundCategory, number> = { ...DEFAULT_CATEGORIES };
  private muted = false;
  private wired = false;

  /** Вызывается один раз после загрузки аудио (PreloadScene.create). */
  init(game: Phaser.Game): void {
    this.sound = game.sound;

    const rawVol = parseFloat(localStorage.getItem(LS_VOLUME) ?? '');
    this.volume = Number.isFinite(rawVol) ? clamp01(rawVol) : DEFAULT_VOLUME;
    this.muted = localStorage.getItem(LS_MUTED) === '1';

    // Старая громкость флейты становится стартовым значением категории «музыка».
    const legacyFlute = localStorage.getItem(LS_LEGACY_FLUTE);
    if (legacyFlute !== null) {
      if (localStorage.getItem(LS_CATEGORY + 'music') === null) {
        localStorage.setItem(LS_CATEGORY + 'music', legacyFlute);
      }
      localStorage.removeItem(LS_LEGACY_FLUTE);
    }

    for (const cat of Object.keys(this.categories) as SoundCategory[]) {
      const raw = parseFloat(localStorage.getItem(LS_CATEGORY + cat) ?? '');
      this.categories[cat] = Number.isFinite(raw) ? clamp01(raw) : DEFAULT_CATEGORIES[cat];
    }

    this.sound.volume = this.volume;
    this.sound.mute = this.muted;

    if (!this.wired) {
      this.wireEventBus();
      // Глобальный тумблер звука по клавише M (через window — переживает смену сцен).
      window.addEventListener('keydown', (e) => {
        if (e.key === 'm' || e.key === 'M') this.toggleMute();
      });
      this.wired = true;
    }
  }

  private wireEventBus(): void {
    EventBus.on('item_in_backpack', () => this.play('loot_pickup'));
    EventBus.on('item_crafted', () => this.play('craft'));
    EventBus.on('item_equipped', () => this.play('equip'));
    EventBus.on('item_placed_smith', () => this.play('anvil'));
    EventBus.on('item_stored', () => this.play('chest_add'));
    EventBus.on('boss_killed', () => this.play('boss_victory'));
  }

  /** Громкость разового звука: категория «эффекты» × базовый микс ключа. */
  private sfxVolume(key: SoundKey): number {
    return clamp01(this.categories.sfx * SOUND_MIX[key]);
  }

  /** Громкость зацикленного слоя: его категория × базовый микс слоя. */
  private layerVolume(key: MusicKey): number {
    const mix = MUSIC_MIX[key];
    return clamp01(this.categories[mix.category] * mix.base);
  }

  play(key: SoundKey): void {
    if (!this.sound || this.muted) return;

    const now = performance.now();
    const last = this.lastPlayed.get(key) ?? -Infinity;
    if (now - last < THROTTLE_MS) return;
    this.lastPlayed.set(key, now);

    // Если у ключа несколько вариантов — каждый раз случайный, чтобы повторы не приедались.
    const count = soundVariants(key).length;
    const index = count > 1 ? Math.floor(Math.random() * count) : 0;
    this.sound.play(soundAssetKey(key, index), { volume: this.sfxVolume(key) });
  }

  /**
   * Задаёт активный набор зацикленных слоёв (костёр, флейта, …). Играются параллельно,
   * громкость каждого считается из MUSIC_MIX и категории (мастер и мьют применяются
   * движком поверх). Слои, которых нет в новом наборе, останавливаются.
   */
  playMusicLayers(keys: MusicKey[]): void {
    const sound = this.sound;
    if (!sound) return;

    // Автоплей до пользовательского жеста заблокирован — стартуем после разблокировки.
    if (sound.locked) {
      sound.once(Phaser.Sound.Events.UNLOCKED, () => this.playMusicLayers(keys));
      return;
    }

    for (const [key, snd] of this.layers) {
      if (!keys.includes(key)) {
        snd.stop();
        snd.destroy();
        this.layers.delete(key);
      }
    }

    for (const key of keys) {
      const existing = this.layers.get(key);
      if (existing) {
        (existing as Phaser.Sound.WebAudioSound).setVolume(this.layerVolume(key));
        continue;
      }
      // Несколько вариантов слоя → случайный при каждом старте. Слой в Map ключуется
      // логическим ключом, поэтому stop/setVolume работают как прежде.
      const count = musicVariants(key).length;
      const index = count > 1 ? Math.floor(Math.random() * count) : 0;
      const assetKey = musicAssetKey(key, index);
      if (!sound.game.cache.audio.exists(assetKey)) continue;
      const snd = sound.add(assetKey, { loop: true, volume: this.layerVolume(key) });
      snd.play();
      this.layers.set(key, snd);
    }
  }

  stopMusic(): void {
    for (const [, snd] of this.layers) {
      snd.stop();
      snd.destroy();
    }
    this.layers.clear();
  }

  getCategoryVolume(cat: SoundCategory): number {
    return this.categories[cat];
  }

  /** Меняет громкость категории: пересчитывает играющие слои на лету и запоминает её. */
  setCategoryVolume(cat: SoundCategory, v: number): void {
    this.categories[cat] = clamp01(v);
    localStorage.setItem(LS_CATEGORY + cat, String(this.categories[cat]));
    for (const [key, snd] of this.layers) {
      if (MUSIC_MIX[key].category === cat) {
        (snd as Phaser.Sound.WebAudioSound).setVolume(this.layerVolume(key));
      }
    }
    EventBus.emit('sound_settings_changed');
  }

  setVolume(v: number): void {
    this.volume = clamp01(v);
    if (this.sound) this.sound.volume = this.volume;
    localStorage.setItem(LS_VOLUME, String(this.volume));
    EventBus.emit('sound_settings_changed');
  }

  getVolume(): number {
    return this.volume;
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.sound) this.sound.mute = m;
    localStorage.setItem(LS_MUTED, m ? '1' : '0');
    EventBus.emit('sound_settings_changed');
  }

  isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }
}

export const SoundManager = new SoundManagerImpl();
