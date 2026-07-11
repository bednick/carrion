import Phaser from 'phaser';
import { MetaStore } from '../core/MetaStore';
import { QUEST_DEFS } from '../quests/definitions';

const X = 10;
const Y_START = 112; // ниже таблицы ресурсов ResourceHUD (2 строки)
const ROW_H = 28;
const MAX_QUESTS = 5;

export class QuestTracker {
  private container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0).setDepth(90);
    this.rebuild();
  }

  rebuild() {
    this.container.removeAll(true);
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
    const bg = scene.add.rectangle(X, Y_START - 4, 420, h, 0x000000, 0.18).setOrigin(0, 0);
    this.container.add(bg);

    rows.forEach(({ text, color, bold }, i) => {
      const t = scene.add.text(X + 6, Y_START + i * ROW_H, text, {
        fontSize: '22px',
        fontFamily: 'monospace',
        color,
        fontStyle: bold ? 'bold' : 'normal',
      }).setOrigin(0, 0);
      this.container.add(t);
    });
  }

  destroy() {
    this.container.destroy();
  }
}
