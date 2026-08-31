import Phaser from 'phaser';
import { FONT_FAMILY, FONT_OPTIONS, getFontId, setFontId } from './theme';
import { CX, GAME_W, GAME_H } from './layout';

const W = 220;
const ROW_H = 28;
const PAD_TOP = 34;
const H = PAD_TOP + FONT_OPTIONS.length * ROW_H + 10;

/**
 * Дев-инструмент: попап со списком всех доступных шрифтов, каждая строка отрисована СВОИМ шрифтом —
 * сразу видно, как он выглядит, без блуждания по кликам циклической кнопки. Клик по строке меняет
 * FONT_FAMILY и рестартует сцену (Text не подписан на изменение шрифта, см. FONT_FAMILY в theme.ts).
 * Клик мимо/ESC — закрывает без изменений. Только для CampScene, только за import.meta.env.DEV
 * (см. кнопку в CampScene.buildHUD()).
 */
export class FontPickerPopup {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private overlay: Phaser.GameObjects.Rectangle;
  private escHandler: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    this.overlay = scene.add.rectangle(CX, GAME_H / 2, GAME_W, GAME_H, 0x000000, 0).setDepth(60).setInteractive();
    this.overlay.on('pointerdown', () => this.close());

    const cx = Phaser.Math.Clamp(x, W / 2 + 6, GAME_W - W / 2 - 6);
    const cy = Phaser.Math.Clamp(y, H / 2 + 6, GAME_H - H / 2 - 6);
    this.container = scene.add.container(cx, cy).setDepth(61);

    const panel = scene.add.rectangle(0, 0, W, H, 0x1e1e2e, 0.97).setStrokeStyle(2, 0x555577).setInteractive();
    const title = scene.add.text(0, -H / 2 + 7, 'Fonts', {
      fontSize: '12px', fontFamily: FONT_FAMILY, color: '#ddddee',
    }).setOrigin(0.5, 0);
    this.container.add([panel, title]);

    const activeId = getFontId();
    const top = -H / 2 + PAD_TOP;
    FONT_OPTIONS.forEach((option, i) => {
      const rowY = top + i * ROW_H + ROW_H / 2;
      const isActive = option.id === activeId;
      const rowBg = scene.add.rectangle(0, rowY, W - 12, ROW_H - 4, isActive ? 0x33335a : 0x28283c)
        .setInteractive({ useHandCursor: true });
      const rowText = scene.add.text(0, rowY, option.id, {
        fontSize: '14px', fontFamily: option.family, color: isActive ? '#66ccff' : '#ddddee',
      }).setOrigin(0.5);
      this.container.add([rowBg, rowText]);

      rowBg.on('pointerover', () => { if (!isActive) rowBg.setFillStyle(0x38384f); });
      rowBg.on('pointerout', () => rowBg.setFillStyle(isActive ? 0x33335a : 0x28283c));
      rowBg.on('pointerdown', () => {
        setFontId(option.id);
        document.fonts.load(`16px ${FONT_FAMILY}`).finally(() => scene.scene.restart());
      });
    });

    this.escHandler = () => this.close();
    scene.input.keyboard?.on('keydown-ESC', this.escHandler);
  }

  close(): void {
    this.scene.input.keyboard?.off('keydown-ESC', this.escHandler);
    this.overlay.destroy();
    this.container.destroy();
  }
}
