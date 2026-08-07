import Phaser from 'phaser';
import { FONT_FAMILY } from './theme';
import { getItemBehavior } from '../items/registry';
import { RARITY_HEX } from '../items/rarity';
import { NEUTRAL_PLATE_KEY } from './itemIcon';
import type { ItemInstance, SlotType } from '../items/types';

// Метрики тултипа (x1.6 от исходных — читаемость).
const FONT_SIZE = 21;
const PAD = 13;          // внутренний отступ бокса и стартовый x/y строк
const LINE_GAP = 3;      // вертикальный зазор между строками
const SECTION_GAP = 13;  // место под разделитель между секциями
const ICON = 24;         // иконка ресурса перед строкой
const ICON_GAP = 6;
const ROW_ICON = 32;     // иконка предмета в iconRow
const ROW_GAP = 8;
const ROW_FRAME_PAD = 6; // рамка вокруг иконки iconRow

interface Line {
  text: string;
  color: string;
  icon?: string; // ключ текстуры иконки ресурса перед текстом (золото/эссенция)
  // Ряд иконок предметов зоны: найденные — обычная иконка, не найденные — затемнённая + «?».
  iconRow?: { texture: string; discovered: boolean }[];
  // Строка из разноцветных/полужирных фрагментов подряд (без пробелов между ними —
  // пробелы уже часть текста фрагментов), напр. подсветка слова внутри описания.
  parts?: { text: string; color: string; bold?: boolean }[];
}

export class Tooltip {
  private container: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Rectangle;
  private texts: Phaser.GameObjects.Text[] = [];
  private decor: Phaser.GameObjects.Rectangle[] = [];
  private icons: Phaser.GameObjects.Image[] = [];
  private scene: Phaser.Scene;
  private ctrlKey?: Phaser.Input.Keyboard.Key;

  // Кто попросил текущий показ. Тултип один на сцену, а источников много (ячейки рюкзака,
  // слоты, спрайты мобов) — без владельца исчезнувший источник гасил бы чужой тултип (см. hideFor).
  private owner: unknown = null;

  // Текущий показываемый предмет — нужен для живой перерисовки при нажатии/отпускании Ctrl.
  private currentItem: ItemInstance | null = null;
  private currentSlot: SlotType | undefined = undefined;
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

  // `slot` — куда предмет сейчас надет (передаётся из петель по экипировке); undefined для
  // рюкзака/сундука, где актуального слота нет — тогда показываются базовые (hand_right) статы.
  showItem(item: ItemInstance, x: number, y: number, owner?: unknown, slot?: SlotType) {
    this.owner = owner ?? null;
    this.currentItem = item;
    this.currentSlot = slot;
    this.currentX = x;
    this.currentY = y;
    this.render(this.buildItemSections(item, slot), x, y);
  }

  showText(lines: string[], x: number, y: number, owner?: unknown) {
    this.owner = owner ?? null;
    this.currentItem = null;
    this.currentSlot = undefined;
    this.render([lines.map(t => ({ text: t, color: '#ffffff' }))], x, y);
  }

  /** Как showText, но с цветом (и опц. иконкой ресурса / рядом иконок предметов) на строку; белый по умолчанию. */
  showLines(lines: { text: string; color?: string; icon?: string; iconRow?: Line['iconRow']; parts?: Line['parts'] }[], x: number, y: number, owner?: unknown) {
    this.owner = owner ?? null;
    this.currentItem = null;
    this.currentSlot = undefined;
    this.render([lines.map(l => ({ text: l.text, color: l.color ?? '#ffffff', icon: l.icon, iconRow: l.iconRow, parts: l.parts }))], x, y);
  }

  /** Тултип моба: имя (цвет по tier) + бейдж босса в одной секции, характеристики — во второй
   *  (тот же стиль, что у тултипа предмета — см. `buildItemSections`). */
  showMob(data: { name: string; nameColor: string; isBoss?: boolean; stats: { text: string; color: string }[] }, x: number, y: number, owner?: unknown) {
    this.owner = owner ?? null;
    this.currentItem = null;
    this.currentSlot = undefined;
    const identity: Line[] = [{ text: data.name, color: data.nameColor }];
    this.render([identity, data.stats], x, y);
  }

  /** Секции: [идентичность, характеристики]. Пустые секции отбрасываются при рендере. */
  private buildItemSections(item: ItemInstance, slot?: SlotType): Line[][] {
    const beh = getItemBehavior(item.item_id);
    const full = !!this.ctrlKey?.isDown;

    const identity: Line[] = [{ text: beh.name, color: RARITY_HEX[item.rarity] }];
    // Слоты несёт цвет имени и рамка слота — раскрываем только под Ctrl.
    if (full) identity.push({ text: `Слоты: ${beh.slots.join(', ')}`, color: '#aaaaaa' });

    // Боевые статы — единый источник правды в behavior.ts (docs/combat-events.md §5).
    const stats: Line[] = beh.stats ? beh.stats(item.rarity, slot) : [];

    return [identity, stats];
  }

  private refreshIfVisible() {
    if (!this.container.visible || !this.currentItem) return;
    this.render(this.buildItemSections(this.currentItem, this.currentSlot), this.currentX, this.currentY);
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
            // Плашка вместо прежней белой рамки: редкость здесь неизвестна (у зоны есть только
            // item_id), поэтому нейтральный вариант — см. src/ui/itemIcon.ts.
            const plate = this.scene.add.image(cx, cy, NEUTRAL_PLATE_KEY)
              .setDisplaySize(ROW_ICON + ROW_FRAME_PAD, ROW_ICON + ROW_FRAME_PAD);
            if (!cell.discovered) plate.setAlpha(0.6);
            this.icons.push(plate);
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
    this.owner = null;
    this.currentItem = null;
    this.container.setVisible(false);
    this.clearDynamic();
  }

  /**
   * Гасит тултип, только если его показал именно этот объект. Для случаев, когда источник
   * исчезает без pointerout (смерть моба, пересборка панели) и не должен сносить чужой показ.
   */
  hideFor(owner: unknown) {
    if (this.owner !== owner) return;
    this.hide();
  }

  destroy() {
    this.ctrlKey?.off('down', this.refreshIfVisible, this);
    this.ctrlKey?.off('up', this.refreshIfVisible, this);
    this.container.destroy();
  }
}
