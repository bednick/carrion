import Phaser from 'phaser';
import { SoundManager } from '../core/SoundManager';
import { FONT_FAMILY } from './theme';
import { rightX } from './layout';

// Геометрия: виджет прижат к правому верхнему углу экрана. Отступы от правого края — константы, но сам
// правый край (GAME_W) меняется при ресайзе окна, поэтому x-координаты считаются в конструкторе, а не на
// уровне модуля (иначе после пересчёта layout виджет остался бы на старом месте). См. src/ui/layout.ts.
const TRACK_W = 84;
const CY = 17;

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
  private readonly trackLeft: number;

  constructor(scene: Phaser.Scene) {
    const trackLeft = rightX(120);
    const trackRight = trackLeft + TRACK_W;
    this.trackLeft = trackLeft;

    scene.add.rectangle(rightX(69), CY, 130, 24, 0x000000, 0.55).setOrigin(0.5).setDepth(100);

    // Динамик-кнопка (мьют). Цвет отражает состояние.
    this.icon = scene.add.text(rightX(22), CY, '♪', {
      fontSize: '16px', fontFamily: FONT_FAMILY, color: '#66ccff',
    }).setOrigin(0.5).setDepth(101).setInteractive({ useHandCursor: true });
    this.icon.on('pointerdown', () => {
      const muted = SoundManager.toggleMute();
      if (!muted) SoundManager.play('loot_pickup');
      this.refresh();
    });

    // Дорожка слайдера.
    scene.add.rectangle(trackLeft, CY, TRACK_W, 4, 0x333344).setOrigin(0, 0.5).setDepth(100);
    this.fill = scene.add.rectangle(trackLeft, CY, 0, 4, COLOR_ON).setOrigin(0, 0.5).setDepth(101);
    this.handle = scene.add.rectangle(trackLeft, CY, 8, 14, COLOR_ON).setOrigin(0.5).setDepth(102);

    // Зона захвата (чуть шире дорожки для удобства).
    const hit = scene.add.rectangle((trackLeft + trackRight) / 2, CY, TRACK_W + 12, 20, 0xffffff, 0)
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
    const v = Phaser.Math.Clamp((px - this.trackLeft) / TRACK_W, 0, 1);
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
    this.handle.x = this.trackLeft + shown * TRACK_W;
    this.handle.setFillStyle(color);
    this.icon.setText(muted ? '×' : '♪');
    this.icon.setColor(muted ? '#555555' : '#66ccff');
  }
}
