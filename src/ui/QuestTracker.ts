import Phaser from 'phaser';
import { MetaStore } from '../core/MetaStore';
import { QUEST_DEFS } from '../quests/definitions';
import { FONT_FAMILY } from './theme';

const X = 10;
const Y_START = 112; // ниже таблицы ресурсов ResourceHUD (2 строки)
const ROW_H = 28;
const MAX_QUESTS = 5;
const BOX_WIDTH = 420;
const PADDING_X = 6;
const TEXT_MAX_WIDTH = BOX_WIDTH - PADDING_X * 2;
const FONT_SIZE = 20; // было 22px, -~10%

export class QuestTracker {
  private container: Phaser.GameObjects.Container;
  private tooltip: Phaser.GameObjects.Container;
  private tooltipBg: Phaser.GameObjects.Rectangle;
  private tooltipText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0).setDepth(90);
    this.tooltipBg = scene.add.rectangle(0, 0, 10, 10, 0x000000, 0.85).setOrigin(0, 0);
    this.tooltipText = scene.add.text(6, 4, '', {
      fontSize: `${FONT_SIZE}px`,
      fontFamily: FONT_FAMILY,
      color: '#ffffff',
    }).setOrigin(0, 0);
    this.tooltip = scene.add.container(0, 0, [this.tooltipBg, this.tooltipText]).setDepth(200).setVisible(false);
    this.rebuild();
  }

  /** Обрезает текст до maxWidth (в px для данного style), добавляя «…» на конце, если не влезает. */
  private truncate(scene: Phaser.Scene, text: string, style: Phaser.Types.GameObjects.Text.TextStyle, maxWidth: number): string {
    const measurer = scene.add.text(0, 0, text, style).setVisible(false);
    let result = text;
    if (measurer.width > maxWidth) {
      let lo = 0;
      let hi = text.length;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        measurer.setText(text.slice(0, mid) + '…');
        if (measurer.width <= maxWidth) lo = mid;
        else hi = mid - 1;
      }
      result = text.slice(0, lo) + '…';
    }
    measurer.destroy();
    return result;
  }

  private showTooltip(fullText: string, x: number, y: number) {
    this.tooltipText.setText(fullText);
    const w = this.tooltipText.width + 12;
    const h = this.tooltipText.height + 8;
    this.tooltipBg.setSize(w, h);
    this.tooltip.setPosition(x, y - h);
    this.tooltip.setVisible(true);
  }

  rebuild() {
    this.container.removeAll(true);
    this.tooltip.setVisible(false);
    const scene = this.container.scene;
    const meta = MetaStore.get();
    const pending = meta.quests.pending_reward;
    const active = meta.quests.active;

    const rows: { text: string; color: string; bold: boolean }[] = [];

    if (pending.length > 0) {
      rows.push({
        text: `★ Заберите награду у Скупщика (${pending.length})`,
        color: '#ffdd44',
        bold: true,
      });
    }

    const slots = MAX_QUESTS - rows.length;
    for (const q of active.slice(0, slots)) {
      const def = QUEST_DEFS[q.id];
      if (!def) continue;
      const done = q.progress >= q.target;
      rows.push({
        text: `${def.title}  ${q.progress}/${q.target}`,
        color: done ? '#88ff88' : '#888888',
        bold: false,
      });
    }

    if (rows.length === 0) return;

    const h = rows.length * ROW_H + 8;
    const bg = scene.add.rectangle(X, Y_START - 4, BOX_WIDTH, h, 0x000000, 0.18).setOrigin(0, 0);
    this.container.add(bg);

    rows.forEach(({ text, color, bold }, i) => {
      const style: Phaser.Types.GameObjects.Text.TextStyle = {
        fontSize: `${FONT_SIZE}px`,
        fontFamily: FONT_FAMILY,
        color,
        fontStyle: bold ? 'bold' : 'normal',
      };
      const truncated = this.truncate(scene, text, style, TEXT_MAX_WIDTH);
      const t = scene.add.text(X + PADDING_X, Y_START + i * ROW_H, truncated, style).setOrigin(0, 0);
      this.container.add(t);

      if (truncated !== text) {
        t.setInteractive();
        t.on('pointerover', () => this.showTooltip(text, t.x, t.y));
        t.on('pointerout', () => this.tooltip.setVisible(false));
      }
    });
  }

  destroy() {
    this.container.destroy();
    this.tooltip.destroy();
  }
}
