import Phaser from 'phaser';
import { SoundManager } from '../core/SoundManager';

// Геометрия: виджет прижат к правому верхнему углу логического пространства 1280×800.
const TRACK_LEFT = 1160;
const TRACK_W = 84;
const TRACK_RIGHT = TRACK_LEFT + TRACK_W;
const CY = 17;
const SPEAKER_CX = 1258;

const COLOR_ON = 0x66ccff;
const COLOR_OFF = 0x555555;

/**
 * Кнопка-регулятор громкости в правом верхнем углу: иконка-динамик (клик — мьют)
 * и слайдер. Завязан на SoundManager (он же персистит громкость/мьют в localStorage).
 * Создаётся в каждой сцене заново; слушатели висят на scene.input и умирают вместе со сценой.
 */
export class VolumeControl {
  private fill: Phaser.GameObjects.Rectangle;
  private handle: Phaser.GameObjects.Rectangle;
  private icon: Phaser.GameObjects.Text;
  private dragging = false;

  constructor(scene: Phaser.Scene) {
    scene.add.rectangle(1211, CY, 130, 24, 0x000000, 0.55).setOrigin(0.5).setDepth(100);

    // Динамик-кнопка (мьют). Цвет отражает состояние.
    this.icon = scene.add.text(SPEAKER_CX, CY, '♪', {
      fontSize: '15px', fontFamily: 'monospace', color: '#66ccff',
    }).setOrigin(0.5).setDepth(101).setInteractive({ useHandCursor: true });
    this.icon.on('pointerdown', () => {
      const muted = SoundManager.toggleMute();
      if (!muted) SoundManager.play('loot_pickup');
      this.refresh();
    });

    // Дорожка слайдера.
    scene.add.rectangle(TRACK_LEFT, CY, TRACK_W, 4, 0x333344).setOrigin(0, 0.5).setDepth(100);
    this.fill = scene.add.rectangle(TRACK_LEFT, CY, 0, 4, COLOR_ON).setOrigin(0, 0.5).setDepth(101);
    this.handle = scene.add.rectangle(TRACK_LEFT, CY, 8, 14, COLOR_ON).setOrigin(0.5).setDepth(102);

    // Зона захвата (чуть шире дорожки для удобства).
    const hit = scene.add.rectangle((TRACK_LEFT + TRACK_RIGHT) / 2, CY, TRACK_W + 12, 20, 0xffffff, 0)
      .setDepth(102).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', (ptr: Phaser.Input.Pointer) => { this.dragging = true; this.setFromPointer(ptr.x); });
    scene.input.on('pointermove', (ptr: Phaser.Input.Pointer) => { if (this.dragging) this.setFromPointer(ptr.x); });
    scene.input.on('pointerup', () => {
      if (!this.dragging) return;
      this.dragging = false;
      SoundManager.play('loot_pickup'); // короткий сэмпл для оценки громкости на слух
    });

    this.refresh();
  }

  private setFromPointer(px: number): void {
    const v = Phaser.Math.Clamp((px - TRACK_LEFT) / TRACK_W, 0, 1);
    SoundManager.setVolume(v);
    if (v > 0 && SoundManager.isMuted()) SoundManager.setMuted(false);
    this.refresh();
  }

  private refresh(): void {
    const muted = SoundManager.isMuted();
    const v = SoundManager.getVolume();
    const shown = muted ? 0 : v;
    const color = muted || v === 0 ? COLOR_OFF : COLOR_ON;

    this.fill.width = shown * TRACK_W;
    this.fill.setFillStyle(color);
    this.handle.x = TRACK_LEFT + shown * TRACK_W;
    this.handle.setFillStyle(color);
    this.icon.setText(muted ? '×' : '♪');
    this.icon.setColor(muted ? '#555555' : '#66ccff');
  }
}
