import Phaser from 'phaser';
import { FONT_FAMILY } from './theme';
import { MetaStore } from '../core/MetaStore';
import { EventBus } from '../core/EventBus';
import { rewardIconKey, essenceIconKey } from './rewards';
import { ESSENCE_TIERS, ESSENCE_NAMES } from '../items/craft';
import type { EssenceTier, Rarity } from '../items/types';
import { Tooltip, RARITY_COLORS } from './Tooltip';

const ICON = 29;      // сторона иконки, px
const GAP = 9;        // зазор иконка↔число, px
const CELL_W = 90;    // ширина ячейки (иконка + число), px
const ROW_H = 34;     // высота строки, px
const ORIGIN_X = 10;
const ORIGIN_Y = 38;

// Родительный падеж редкости, к которой ведёт улучшение на эссенции тира — для тултипа
// («до необычного уровня»); согласуется с сущ. «уровень» (муж. род).
const RARITY_GENITIVE: Record<EssenceTier, string> = {
  uncommon: 'необычного', rare: 'редкого', epic: 'эпического',
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Тултип не переносит текст сам — режем описание на строки по словам (≤ maxChars символов).
function wrapText(text: string, maxChars = 42): string[] {
  const lines: string[] = [];
  let cur = '';
  for (const w of text.split(' ')) {
    if (cur && cur.length + 1 + w.length > maxChars) { lines.push(cur); cur = w; }
    else cur = cur ? `${cur} ${w}` : w;
  }
  if (cur) lines.push(cur);
  return lines;
}

type DescLine = { text: string; color: string; parts?: { text: string; color: string; bold?: boolean }[] };

/**
 * Оборачивает описание в строки и подсвечивает заданные слова (цветом редкости и/или жирным) —
 * подсветка ищется по каждой обёрнутой строке отдельно, поэтому слово не должно переноситься.
 */
function buildDescLines(desc: string, baseColor: string, highlights: { word: string; color?: string; bold?: boolean }[]): DescLine[] {
  return wrapText(desc).map((line): DescLine => {
    for (const h of highlights) {
      const idx = line.indexOf(h.word);
      if (idx < 0) continue;
      const parts: { text: string; color: string; bold?: boolean }[] = [];
      if (idx > 0) parts.push({ text: line.slice(0, idx), color: baseColor });
      parts.push({ text: h.word, color: h.color ?? baseColor, bold: h.bold });
      const rest = line.slice(idx + h.word.length);
      if (rest) parts.push({ text: rest, color: baseColor });
      return { text: '', color: baseColor, parts };
    }
    return { text: line, color: baseColor };
  });
}

// Ячейка ресурса: иконка слева, число справа от неё.
type Cell = { icon: Phaser.GameObjects.Image; text: Phaser.GameObjects.Text };

export class ResourceHUD {
  private goldCell!: Cell;
  private essenceCells: Record<string, Cell> = {};

  constructor(scene: Phaser.Scene, tooltip?: Tooltip) {
    const DESC_COLOR = '#aaaaaa';
    // Раскладка: строка 0 — только золото, строка 1 — все тиры эссенции в ряд.
    const cells: Array<{
      iconKey: string; col: number; row: number; store: (c: Cell) => void;
      title: string; titleColor: string; descLines: DescLine[];
    }> = [
      {
        iconKey: rewardIconKey('gold'), col: 0, row: 0, store: (c) => (this.goldCell = c),
        title: 'Золото', titleColor: '#ffcc00',
        descLines: buildDescLines(
          'Позволяет оплачивать услуги Кузнеца и приобретать товары у Скупщика',
          DESC_COLOR,
          [{ word: 'Кузнеца', bold: true }, { word: 'Скупщика', bold: true }],
        ),
      },
      ...ESSENCE_TIERS.map((tier, i) => ({
        iconKey: essenceIconKey(tier),
        col: i,
        row: 1,
        store: (c: Cell) => (this.essenceCells[tier] = c),
        title: `${capitalize(ESSENCE_NAMES[tier])} эссенция`, titleColor: '#cbe6ff',
        descLines: buildDescLines(
          `Позволяет улучшить предмет до ${RARITY_GENITIVE[tier]} уровня редкости`,
          DESC_COLOR,
          [{ word: RARITY_GENITIVE[tier], color: RARITY_COLORS[tier as Rarity] }],
        ),
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
          fontFamily: FONT_FAMILY,
          color: '#ffffff',
        })
        .setOrigin(0, 0.5)
        .setDepth(90);
      def.store({ icon, text });

      if (tooltip) {
        // Зона наведения — вся ячейка (иконка + число), не только сама иконка.
        const hitW = CELL_W - 4;
        const hitH = ICON + 8;
        const hit = scene.add
          .rectangle(x + hitW / 2, y + ICON / 2, hitW, hitH, 0x000000, 0)
          .setDepth(90)
          .setInteractive({ useHandCursor: false });
        hit.on('pointerover', () => {
          tooltip.showLines(
            [{ text: def.title, color: def.titleColor }, ...def.descLines],
            x, y + ICON + 6,
          );
        });
        hit.on('pointerout', () => tooltip.hide());
      }
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
