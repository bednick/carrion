import Phaser from 'phaser';
import { FONT_FAMILY } from './theme';
import { getItemConfig, getItemBehavior } from '../items/registry';
import { salvageEssence, ESSENCE_TIERS } from '../items/craft';
import { rewardIconKey, essenceIconKey } from './rewards';
import type { ItemInstance, Rarity, EssenceTier } from '../items/types';

export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#ffffff',
  uncommon: '#55ff55',
  rare: '#5555ff',
  epic: '#aa00ff',
  legendary: '#ff8800',
};

interface Line {
  text: string;
  color: string;
  icon?: string; // ключ текстуры иконки ресурса перед текстом (золото/эссенция)
  // Ряд из пар «иконка+число» в одну строку (все тиры эссенции, включая нули).
  segments?: { icon: string; text: string; color: string }[];
  // Ряд иконок предметов зоны: найденные — обычная иконка, не найденные — затемнённая + «?».
  iconRow?: { texture: string; discovered: boolean }[];
  // Строка из разноцветных/полужирных фрагментов подряд (без пробелов между ними —
  // пробелы уже часть текста фрагментов), напр. подсветка слова внутри описания.
  parts?: { text: string; color: string; bold?: boolean }[];
}

/**
 * Контекст показа предмета. `defaultCost` задаёт, какую цену показывать в кратком виде
 * (магазин → 'gold', кузнец → 'essence', иначе → 'none'). Полный вид (зажат Ctrl)
 * всегда показывает слоты и обе цены независимо от контекста.
 */
export interface ItemTooltipCtx {
  defaultCost?: 'gold' | 'essence' | 'none';
}

export class Tooltip {
  private container: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Rectangle;
  private texts: Phaser.GameObjects.Text[] = [];
  private decor: Phaser.GameObjects.Rectangle[] = [];
  private icons: Phaser.GameObjects.Image[] = [];
  private scene: Phaser.Scene;
  private ctrlKey?: Phaser.Input.Keyboard.Key;

  // Текущий показываемый предмет — нужен для живой перерисовки при нажатии/отпускании Ctrl.
  private currentItem: ItemInstance | null = null;
  private currentCtx: ItemTooltipCtx = {};
  private currentX = 0;
  private currentY = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.bg = scene.add.rectangle(0, 0, 200, 100, 0x000000, 0.85).setOrigin(0);
    this.bg.setStrokeStyle(1, 0x888888);
    this.container = scene.add.container(0, 0, [this.bg]);
    this.container.setDepth(400).setVisible(false);

    // Ctrl раскрывает полное описание на лету, пока курсор висит над предметом.
    // enableCapture=false — не перехватываем Ctrl у браузера.
    this.ctrlKey = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL, false);
    this.ctrlKey?.on('down', this.refreshIfVisible, this);
    this.ctrlKey?.on('up', this.refreshIfVisible, this);
  }

  showItem(item: ItemInstance, x: number, y: number, ctx: ItemTooltipCtx = {}) {
    this.currentItem = item;
    this.currentCtx = ctx;
    this.currentX = x;
    this.currentY = y;
    this.render(this.buildItemSections(item, ctx), x, y);
  }

  showText(lines: string[], x: number, y: number) {
    this.currentItem = null;
    this.render([lines.map(t => ({ text: t, color: '#ffffff' }))], x, y);
  }

  /** Как showText, но с цветом (и опц. иконкой ресурса / рядом иконок предметов) на строку; белый по умолчанию. */
  showLines(lines: { text: string; color?: string; icon?: string; iconRow?: Line['iconRow']; parts?: Line['parts'] }[], x: number, y: number) {
    this.currentItem = null;
    this.render([lines.map(l => ({ text: l.text, color: l.color ?? '#ffffff', icon: l.icon, iconRow: l.iconRow, parts: l.parts }))], x, y);
  }

  /** Секции: [идентичность, характеристики, цены]. Пустые секции отбрасываются при рендере. */
  private buildItemSections(item: ItemInstance, ctx: ItemTooltipCtx): Line[][] {
    const cfg = getItemConfig(item.item_id);
    const full = !!this.ctrlKey?.isDown;

    const identity: Line[] = [{ text: cfg.name, color: RARITY_COLORS[item.rarity] }];
    // Слоты несёт цвет имени и рамка слота — раскрываем только под Ctrl.
    if (full) identity.push({ text: `Слоты: ${cfg.slots.join(', ')}`, color: '#aaaaaa' });

    // Боевые статы — единый источник правды в behavior.ts (docs/combat-events.md §5).
    const beh = getItemBehavior(item.item_id);
    const stats: Line[] = beh.stats ? beh.stats(item.rarity) : [];

    const goldLines: Line[] = [{ text: `${cfg.base_value}`, color: '#ffcc00', icon: rewardIconKey('gold') }];
    // Разбор даёт пул эссенции: все тиры в одну строку (иконка тира + количество, включая 0).
    const pool = salvageEssence(item);
    const essenceLines: Line[] = [{
      text: '', color: '#cbe6ff',
      segments: ESSENCE_TIERS.map((tier) => ({
        icon: essenceIconKey(tier as EssenceTier), text: `${pool[tier as EssenceTier] ?? 0}`, color: '#cbe6ff',
      })),
    }];
    const prices: Line[] = [];
    if (full) prices.push(...goldLines, ...essenceLines);
    else if (ctx.defaultCost === 'gold') prices.push(...goldLines);
    else if (ctx.defaultCost === 'essence') prices.push(...essenceLines);

    return [identity, stats, prices];
  }

  private refreshIfVisible() {
    if (!this.container.visible || !this.currentItem) return;
    this.render(this.buildItemSections(this.currentItem, this.currentCtx), this.currentX, this.currentY);
  }

  /** Рендерит секции сверху вниз, разделяя их тонкой горизонтальной линией. */
  private render(groups: Line[][], x: number, y: number) {
    this.clearDynamic();

    const SECTION_GAP = 8; // вертикальное место под разделитель между секциями
    const sections = groups.filter(g => g.length > 0);

    let maxW = 0;
    let totalH = 0;
    const dividerYs: number[] = [];

    sections.forEach((group, gi) => {
      if (gi > 0) {
        dividerYs.push(8 + totalH + SECTION_GAP / 2);
        totalH += SECTION_GAP;
      }
      for (const line of group) {
        const ICON = 15, ICON_GAP = 4;

        // Ряд иконок предметов зоны: найден → обычная иконка, не найден → затемнённая + «?».
        if (line.iconRow) {
          const ROW_ICON = 20, ROW_GAP = 5;
          let sx = 8;
          for (const cell of line.iconRow) {
            const cx = sx + ROW_ICON / 2, cy = 8 + totalH + ROW_ICON / 2;
            const frame = this.scene.add.rectangle(cx, cy, ROW_ICON + 4, ROW_ICON + 4)
              .setStrokeStyle(1, 0xffffff, 0.8);
            this.decor.push(frame);
            const img = this.scene.add.image(cx, cy, cell.texture)
              .setDisplaySize(ROW_ICON, ROW_ICON);
            if (!cell.discovered) img.setTint(0x555566).setAlpha(0.6);
            this.icons.push(img);
            if (!cell.discovered) {
              const q = this.scene.add.text(cx, cy, '?', {
                fontSize: '13px', fontFamily: FONT_FAMILY, fontStyle: 'bold', color: '#ffffff',
              }).setOrigin(0.5);
              this.texts.push(q);
            }
            sx += ROW_ICON + 4 + ROW_GAP;
          }
          maxW = Math.max(maxW, sx - ROW_GAP - 8);
          totalH += ROW_ICON + 6;
          continue;
        }

        // Ряд «иконка+число … иконка+число» в одну строку.
        if (line.segments) {
          const SEG_GAP = 12;
          let sx = 8;
          let lineH = 0;
          for (const seg of line.segments) {
            const t = this.scene.add.text(sx + ICON + ICON_GAP, 8 + totalH, seg.text, {
              fontSize: '13px', fontFamily: FONT_FAMILY, color: seg.color,
            });
            this.texts.push(t);
            const img = this.scene.add.image(sx, 8 + totalH + t.height / 2, seg.icon)
              .setDisplaySize(ICON, ICON).setOrigin(0, 0.5);
            this.icons.push(img);
            lineH = Math.max(lineH, t.height);
            sx += ICON + ICON_GAP + t.width + SEG_GAP;
          }
          maxW = Math.max(maxW, sx - SEG_GAP - 8);
          totalH += lineH + 2;
          continue;
        }

        // Строка из разноцветных/полужирных фрагментов подряд (подсветка слова в описании).
        if (line.parts) {
          let sx = 8;
          let lineH = 0;
          for (const part of line.parts) {
            const t = this.scene.add.text(sx, 8 + totalH, part.text, {
              fontSize: '13px', fontFamily: FONT_FAMILY, color: part.color,
              fontStyle: part.bold ? 'bold' : undefined,
            });
            this.texts.push(t);
            lineH = Math.max(lineH, t.height);
            sx += t.width;
          }
          maxW = Math.max(maxW, sx - 8);
          totalH += lineH + 2;
          continue;
        }

        const tx = line.icon ? 8 + ICON + ICON_GAP : 8;
        const t = this.scene.add.text(tx, 8 + totalH, line.text, {
          fontSize: '13px',
          fontFamily: FONT_FAMILY,
          color: line.color,
        });
        this.texts.push(t);
        if (line.icon) {
          const img = this.scene.add.image(8, 8 + totalH + t.height / 2, line.icon)
            .setDisplaySize(ICON, ICON).setOrigin(0, 0.5);
          this.icons.push(img);
        }
        maxW = Math.max(maxW, (tx - 8) + t.width);
        totalH += t.height + 2;
      }
    });

    this.bg.setSize(maxW + 16, totalH + 16);

    for (const dy of dividerYs) {
      const ln = this.scene.add.rectangle(8, dy, maxW, 1, 0x888888, 0.5).setOrigin(0, 0.5);
      this.decor.push(ln);
    }

    this.container.removeAll(false);
    this.container.add([this.bg, ...this.decor, ...this.icons, ...this.texts]);

    const cx = Math.max(8, Math.min(x, this.scene.scale.width - maxW - 24));
    const cy = Math.max(8, Math.min(y, this.scene.scale.height - totalH - 24));
    this.container.setPosition(cx, cy).setVisible(true);
  }

  private clearDynamic() {
    this.texts.forEach(t => t.destroy());
    this.texts = [];
    this.decor.forEach(d => d.destroy());
    this.decor = [];
    this.icons.forEach(i => i.destroy());
    this.icons = [];
  }

  hide() {
    this.currentItem = null;
    this.container.setVisible(false);
    this.clearDynamic();
  }

  destroy() {
    this.ctrlKey?.off('down', this.refreshIfVisible, this);
    this.ctrlKey?.off('up', this.refreshIfVisible, this);
    this.container.destroy();
  }
}
