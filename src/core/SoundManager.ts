import Phaser from 'phaser';
import { EventBus } from './EventBus';
import { soundVariants, soundAssetKey, musicVariants, musicAssetKey, type SoundKey, type MusicKey } from './SoundRegistry';

export interface MusicLayer {
  key: MusicKey;
  volume: number;
}

const LS_VOLUME = 'carrion.sound.volume';
const LS_MUTED = 'carrion.sound.muted';

// Схлопывание одинаковых звуков, прилетевших «всплеском» (каскады урона, ×4-скорость).
// Один и тот же ключ не звучит чаще, чем раз в THROTTLE_MS — иначе на быстрых боях каша.
const THROTTLE_MS = 60;

const DEFAULT_VOLUME = 0.6;

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

/**
 * Тонкий слой над аудио-движком Phaser. Игровая логика про звук не знает:
 * - UI/глобальные звуки вешаются на EventBus здесь же (как Floater слушает 'floater');
 * - боевые звуки сцена проигрывает напрямую через SoundManager.play(...) в своих колбэках.
 * Громкость/мьют персистятся в localStorage.
 */
class SoundManagerImpl {
  private sound?: Phaser.Sound.BaseSoundManager;
  private lastPlayed = new Map<SoundKey, number>();
  private layers = new Map<MusicKey, Phaser.Sound.BaseSound>();
  private volume = DEFAULT_VOLUME;
  private muted = false;
  private wired = false;

  /** Вызывается один раз после загрузки аудио (PreloadScene.create). */
  init(game: Phaser.Game): void {
    this.sound = game.sound;

    const rawVol = parseFloat(localStorage.getItem(LS_VOLUME) ?? '');
    this.volume = Number.isFinite(rawVol) ? clamp01(rawVol) : DEFAULT_VOLUME;
    this.muted = localStorage.getItem(LS_MUTED) === '1';

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
    EventBus.on('item_disassembled', () => this.play('disassemble'));
    EventBus.on('item_crafted', () => this.play('craft'));
    EventBus.on('item_sold', () => this.play('sell'));
    EventBus.on('item_equipped', () => this.play('equip'));
    EventBus.on('item_placed_smith', () => this.play('anvil'));
    EventBus.on('item_stored', () => this.play('chest_add'));
    EventBus.on('boss_killed', () => this.play('boss_victory'));
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
    this.sound.play(soundAssetKey(key, index));
  }

  /**
   * Задаёт активный набор зацикленных слоёв (костёр, флейта, …). Играются параллельно,
   * каждый со своей громкостью (мастер-громкость и мьют применяются движком поверх).
   * Слои, которых нет в новом наборе, останавливаются; общие — обновляют громкость.
   */
  playMusicLayers(specs: MusicLayer[]): void {
    const sound = this.sound;
    if (!sound) return;

    // Автоплей до пользовательского жеста заблокирован — стартуем после разблокировки.
    if (sound.locked) {
      sound.once(Phaser.Sound.Events.UNLOCKED, () => this.playMusicLayers(specs));
      return;
    }

    for (const [key, snd] of this.layers) {
      if (!specs.some((s) => s.key === key)) {
        snd.stop();
        snd.destroy();
        this.layers.delete(key);
      }
    }

    for (const spec of specs) {
      const existing = this.layers.get(spec.key);
      if (existing) {
        (existing as Phaser.Sound.WebAudioSound).setVolume(spec.volume);
        continue;
      }
      // Несколько вариантов слоя → случайный при каждом старте. Слой в Map ключуется
      // логическим ключом (spec.key), поэтому stop/setVolume работают как прежде.
      const count = musicVariants(spec.key).length;
      const index = count > 1 ? Math.floor(Math.random() * count) : 0;
      const assetKey = musicAssetKey(spec.key, index);
      if (!sound.game.cache.audio.exists(assetKey)) continue;
      const snd = sound.add(assetKey, { loop: true, volume: spec.volume });
      snd.play();
      this.layers.set(spec.key, snd);
    }
  }

  stopMusic(): void {
    for (const [, snd] of this.layers) {
      snd.stop();
      snd.destroy();
    }
    this.layers.clear();
  }

  /** Сохранённая громкость слоя (или fallback, если игрок ещё не трогал). */
  getLayerVolume(key: MusicKey, fallback: number): number {
    const raw = parseFloat(localStorage.getItem(`carrion.sound.layer.${key}`) ?? '');
    return Number.isFinite(raw) ? clamp01(raw) : fallback;
  }

  /** Меняет громкость слоя на лету (если играет) и запоминает её. */
  setLayerVolume(key: MusicKey, v: number): void {
    const vol = clamp01(v);
    localStorage.setItem(`carrion.sound.layer.${key}`, String(vol));
    const snd = this.layers.get(key);
    if (snd) (snd as Phaser.Sound.WebAudioSound).setVolume(vol);
  }

  setVolume(v: number): void {
    this.volume = clamp01(v);
    if (this.sound) this.sound.volume = this.volume;
    localStorage.setItem(LS_VOLUME, String(this.volume));
  }

  getVolume(): number {
    return this.volume;
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.sound) this.sound.mute = m;
    localStorage.setItem(LS_MUTED, m ? '1' : '0');
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
