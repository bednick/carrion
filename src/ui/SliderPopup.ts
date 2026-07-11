import Phaser from 'phaser';
import { FONT_FAMILY } from './theme';

export interface SliderPopupOpts {
  label: string;
  value: number;                 // стартовое значение 0..1
  onChange: (v: number) => void; // вызывается при перетаскивании
  onClose?: () => void;
}

const W = 154;
const H = 60;
const TRACK_W = 120;

/**
 * Маленькое всплывающее окно с горизонтальным ползунком (0..1). Клик мимо — закрывает.
 * Полноэкранный оверлей под окном ловит внешние клики; при topOnly (дефолт Phaser)
 * клики по самому окну до оверлея не доходят.
 */
export class SliderPopup {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private overlay: Phaser.GameObjects.Rectangle;
  private fill: Phaser.GameObjects.Rectangle;
  private handle: Phaser.GameObjects.Rectangle;
  private trackLeft = -TRACK_W / 2;
  private dragging = false;
  private value: number;
  private opts: SliderPopupOpts;
  private moveHandler: (p: Phaser.Input.Pointer) => void;
  private upHandler: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number, opts: SliderPopupOpts) {
    this.scene = scene;
    this.opts = opts;
    this.value = Phaser.Math.Clamp(opts.value, 0, 1);

    this.overlay = scene.add.rectangle(640, 400, 1280, 800, 0x000000, 0).setDepth(60).setInteractive();
    this.overlay.on('pointerdown', () => this.close());

    // Держим окно в пределах экрана.
    const cx = Phaser.Math.Clamp(x, W / 2 + 6, 1280 - W / 2 - 6);
    const cy = Phaser.Math.Clamp(y, H / 2 + 6, 800 - H / 2 - 6);
    this.container = scene.add.container(cx, cy).setDepth(61);

    const panel = scene.add.rectangle(0, 0, W, H, 0x1e1e2e, 0.97).setStrokeStyle(2, 0x555577).setInteractive();
    const label = scene.add.text(0, -H / 2 + 7, opts.label, {
      fontSize: '12px', fontFamily: FONT_FAMILY, color: '#ddddee',
    }).setOrigin(0.5, 0);

    const trackY = 9;
    const track = scene.add.rectangle(0, trackY, TRACK_W, 4, 0x333344).setOrigin(0.5);
    this.fill = scene.add.rectangle(this.trackLeft, trackY, 0, 4, 0x66ccff).setOrigin(0, 0.5);
    this.handle = scene.add.rectangle(this.trackLeft, trackY, 9, 16, 0x66ccff).setOrigin(0.5);
    const hit = scene.add.rectangle(0, trackY, TRACK_W + 16, 24, 0xffffff, 0).setInteractive({ useHandCursor: true });

    this.container.add([panel, label, track, this.fill, this.handle, hit]);

    hit.on('pointerdown', (p: Phaser.Input.Pointer) => { this.dragging = true; this.setFromPointer(p.x); });
    this.moveHandler = (p) => { if (this.dragging) this.setFromPointer(p.x); };
    this.upHandler = () => { this.dragging = false; };
    scene.input.on('pointermove', this.moveHandler);
    scene.input.on('pointerup', this.upHandler);

    this.refresh();
  }

  private setFromPointer(worldX: number): void {
    const localX = worldX - this.container.x;
    this.value = Phaser.Math.Clamp((localX - this.trackLeft) / TRACK_W, 0, 1);
    this.opts.onChange(this.value);
    this.refresh();
  }

  private refresh(): void {
    this.fill.width = this.value * TRACK_W;
    this.handle.x = this.trackLeft + this.value * TRACK_W;
  }

  close(): void {
    this.scene.input.off('pointermove', this.moveHandler);
    this.scene.input.off('pointerup', this.upHandler);
    this.overlay.destroy();
    this.container.destroy();
    this.opts.onClose?.();
  }
}
