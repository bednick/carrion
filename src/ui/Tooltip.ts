import Phaser from 'phaser';
import { FONT_FAMILY } from './theme';
import { getItemBehavior } from '../items/registry';
import { salvageEssence, ESSENCE_TIERS, itemSellPrice } from '../items/craft';
import { rewardIconKey, essenceIconKey } from './rewards';
import type { ItemInstance, Rarity, EssenceTier } from '../items/types';

// Метрики тултипа (x1.6 от исходных — читаемость).
const FONT_SIZE = 21;
const PAD = 13;          // внутренний отступ бокса и стартовый x/y строк
const LINE_GAP = 3;      // вертикальный зазор между строками
const SECTION_GAP = 13;  // место под разделитель между секциями
const ICON = 24;         // иконка ресурса перед строкой / в segments
const ICON_GAP = 6;
const ROW_ICON = 32;     // иконка предмета в iconRow
const ROW_GAP = 8;
const ROW_FRAME_PAD = 6; // рамка вокруг иконки iconRow
const SEG_GAP = 19;

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

  /** Тултип моба: имя (цвет по tier) + бейдж босса в одной секции, характеристики — во второй
   *  (тот же стиль, что у тултипа предмета — см. `buildItemSections`). */
  showMob(data: { name: string; nameColor: string; isBoss?: boolean; stats: { text: string; color: string }[] }, x: number, y: number) {
    this.currentItem = null;
    const identity: Line[] = [{ text: data.name, color: data.nameColor }];
    if (data.isBoss) identity.push({ text: 'БОСС', color: RARITY_COLORS.legendary });
    this.render([identity, data.stats], x, y);
  }

  /** Секции: [идентичность, характеристики, цены]. Пустые секции отбрасываются при рендере. */
  private buildItemSections(item: ItemInstance, ctx: ItemTooltipCtx): Line[][] {
    const beh = getItemBehavior(item.item_id);
    const full = !!this.ctrlKey?.isDown;

    const identity: Line[] = [{ text: beh.name, color: RARITY_COLORS[item.rarity] }];
    // Слоты несёт цвет имени и рамка слота — раскрываем только под Ctrl.
    if (full) identity.push({ text: `Слоты: ${beh.slots.join(', ')}`, color: '#aaaaaa' });

    // Боевые статы — единый источник правды в behavior.ts (docs/combat-events.md §5).
    const stats: Line[] = beh.stats ? beh.stats(item.rarity) : [];

    const goldLines: Line[] = [{ text: `${itemSellPrice(item)}`, color: '#ffcc00', icon: rewardIconKey('gold') }];
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

    const sections = groups.filter(g => g.length > 0);

    let maxW = 0;
    let totalH = 0;
    const dividerYs: number[] = [];

    sections.forEach((group, gi) => {
      if (gi > 0) {
        dividerYs.push(PAD + totalH + SECTION_GAP / 2);
        totalH += SECTION_GAP;
      }
      for (const line of group) {
        // Ряд иконок предметов зоны: найден → обычная иконка, не найден → затемнённая + «?».
        if (line.iconRow) {
          let sx = PAD;
          for (const cell of line.iconRow) {
            const cx = sx + ROW_ICON / 2, cy = PAD + totalH + ROW_ICON / 2;
            const frame = this.scene.add.rectangle(cx, cy, ROW_ICON + ROW_FRAME_PAD, ROW_ICON + ROW_FRAME_PAD)
              .setStrokeStyle(1, 0xffffff, 0.8);
            this.decor.push(frame);
            const img = this.scene.add.image(cx, cy, cell.texture)
              .setDisplaySize(ROW_ICON, ROW_ICON);
            if (!cell.discovered) img.setTint(0x555566).setAlpha(0.6);
            this.icons.push(img);
            if (!cell.discovered) {
              const q = this.scene.add.text(cx, cy, '?', {
                fontSize: `${FONT_SIZE}px`, fontFamily: FONT_FAMILY, fontStyle: 'bold', color: '#ffffff',
              }).setOrigin(0.5);
              this.texts.push(q);
            }
            sx += ROW_ICON + ROW_FRAME_PAD + ROW_GAP;
          }
          maxW = Math.max(maxW, sx - ROW_GAP - PAD);
          totalH += ROW_ICON + ROW_FRAME_PAD + LINE_GAP;
          continue;
        }

        // Ряд «иконка+число … иконка+число» в одну строку.
        if (line.segments) {
          let sx = PAD;
          let lineH = 0;
          for (const seg of line.segments) {
            const t = this.scene.add.text(sx + ICON + ICON_GAP, PAD + totalH, seg.text, {
              fontSize: `${FONT_SIZE}px`, fontFamily: FONT_FAMILY, color: seg.color,
            });
            this.texts.push(t);
            const img = this.scene.add.image(sx, PAD + totalH + t.height / 2, seg.icon)
              .setDisplaySize(ICON, ICON).setOrigin(0, 0.5);
            this.icons.push(img);
            lineH = Math.max(lineH, t.height);
            sx += ICON + ICON_GAP + t.width + SEG_GAP;
          }
          maxW = Math.max(maxW, sx - SEG_GAP - PAD);
          totalH += lineH + LINE_GAP;
          continue;
        }

        // Строка из разноцветных/полужирных фрагментов подряд (подсветка слова в описании).
        if (line.parts) {
          let sx = PAD;
          let lineH = 0;
          for (const part of line.parts) {
            const t = this.scene.add.text(sx, PAD + totalH, part.text, {
              fontSize: `${FONT_SIZE}px`, fontFamily: FONT_FAMILY, color: part.color,
              fontStyle: part.bold ? 'bold' : undefined,
            });
            this.texts.push(t);
            lineH = Math.max(lineH, t.height);
            sx += t.width;
          }
          maxW = Math.max(maxW, sx - PAD);
          totalH += lineH + LINE_GAP;
          continue;
        }

        const tx = line.icon ? PAD + ICON + ICON_GAP : PAD;
        const t = this.scene.add.text(tx, PAD + totalH, line.text, {
          fontSize: `${FONT_SIZE}px`,
          fontFamily: FONT_FAMILY,
          color: line.color,
        });
        this.texts.push(t);
        if (line.icon) {
          const img = this.scene.add.image(PAD, PAD + totalH + t.height / 2, line.icon)
            .setDisplaySize(ICON, ICON).setOrigin(0, 0.5);
          this.icons.push(img);
        }
        maxW = Math.max(maxW, (tx - PAD) + t.width);
        totalH += t.height + LINE_GAP;
      }
    });

    this.bg.setSize(maxW + PAD * 2, totalH + PAD * 2);

    for (const dy of dividerYs) {
      const ln = this.scene.add.rectangle(PAD, dy, maxW, 1, 0x888888, 0.5).setOrigin(0, 0.5);
      this.decor.push(ln);
    }

    this.container.removeAll(false);
    this.container.add([this.bg, ...this.decor, ...this.icons, ...this.texts]);

    const cx = Math.max(PAD, Math.min(x, this.scene.scale.width - maxW - PAD * 3));
    const cy = Math.max(PAD, Math.min(y, this.scene.scale.height - totalH - PAD * 3));
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
