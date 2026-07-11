import Phaser from 'phaser';
import { MetaStore } from '../core/MetaStore';
import { EventBus } from '../core/EventBus';
import { rewardIconKey, essenceIconKey } from './rewards';
import { ESSENCE_TIERS } from '../items/craft';

const ICON = 29;      // сторона иконки, px
const GAP = 9;        // зазор иконка↔число, px
const CELL_W = 90;    // ширина ячейки (иконка + число), px
const ROW_H = 34;     // высота строки, px
const ORIGIN_X = 10;
const ORIGIN_Y = 38;

// Ячейка ресурса: иконка слева, число справа от неё.
type Cell = { icon: Phaser.GameObjects.Image; text: Phaser.GameObjects.Text };

export class ResourceHUD {
  private goldCell!: Cell;
  private essenceCells: Record<string, Cell> = {};

  constructor(scene: Phaser.Scene) {
    // Раскладка: строка 0 — только золото, строка 1 — все тиры эссенции в ряд.
    const cells: Array<{ iconKey: string; col: number; row: number; store: (c: Cell) => void }> = [
      { iconKey: rewardIconKey('gold'), col: 0, row: 0, store: (c) => (this.goldCell = c) },
      ...ESSENCE_TIERS.map((tier, i) => ({
        iconKey: essenceIconKey(tier),
        col: i,
        row: 1,
        store: (c: Cell) => (this.essenceCells[tier] = c),
      })),
    ];

    cells.forEach((def) => {
      const x = ORIGIN_X + def.col * CELL_W;
      const y = ORIGIN_Y + def.row * ROW_H;
      const icon = scene.add
        .image(x, y, def.iconKey)
        .setOrigin(0, 0)
        .setDisplaySize(ICON, ICON)
        .setDepth(90);
      const text = scene.add
        .text(x + ICON + GAP, y + ICON / 2, '0', {
          fontSize: '22px',
          fontFamily: 'monospace',
          color: '#ffffff',
        })
        .setOrigin(0, 0.5)
        .setDepth(90);
      def.store({ icon, text });
    });

    this.refresh();
    EventBus.on('quest_reward_claimed', this.refresh, this);
  }

  refresh() {
    if (!this.goldCell?.icon?.active) return;
    const { gold, essence } = MetaStore.get();
    this.goldCell.text.setText(`${gold}`);
    for (const tier of ESSENCE_TIERS) {
      this.essenceCells[tier].text.setText(`${essence[tier] ?? 0}`);
    }
  }

  destroy() {
    EventBus.off('quest_reward_claimed', this.refresh, this);
  }
}
