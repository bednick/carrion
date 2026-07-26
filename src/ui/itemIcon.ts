import Phaser from 'phaser';
import type { Rarity } from '../items/types';
import { itemIconKey } from '../items/icons';

/**
 * Единый источник правды по цвету редкости для геометрии Phaser (число, не строка).
 * Строковый аналог для текста живёт в `Tooltip.ts` — это разные сущности, не дублирование.
 */
export const RARITY_COLORS: Record<Rarity, number> = {
  common: 0xffffff,
  uncommon: 0x55ff55,
  rare: 0x5555ff,
  epic: 0xaa00ff,
  legendary: 0xff8800,
};

/** Плашка без редкости: пустой слот экипировки, ряд иконок зоны в тултипе. */
const NEUTRAL_COLOR = 0x333344;
/** Плашка без редкости — для мест, где известен только `item_id` (ряд лута зоны в тултипе). */
export const NEUTRAL_PLATE_KEY = 'item_plate_neutral';
const NEUTRAL_KEY = NEUTRAL_PLATE_KEY;

// Сторона canvas-текстуры плашки. Больше, чем любой реальный размер на экране (72px у карточки
// находки), чтобы градиент не мылился при апскейле.
const PLATE_SIZE = 128;
const PLATE_BASE_FILL = '#14161c'; // тот же тон, что был зашит фоном в старых SVG-иконках

function plateKey(rarity?: Rarity): string {
  return rarity ? `item_plate_${rarity}` : NEUTRAL_KEY;
}

function hexRgb(color: number): string {
  return `${(color >> 16) & 0xff}, ${(color >> 8) & 0xff}, ${color & 0xff}`;
}

function drawPlate(scene: Phaser.Scene, key: string, color: number, tinted: boolean) {
  if (scene.textures.exists(key)) return;

  const tex = scene.textures.createCanvas(key, PLATE_SIZE, PLATE_SIZE);
  const ctx = tex?.getContext();
  if (!tex || !ctx) return;

  const S = PLATE_SIZE;
  const lw = S * 0.035;
  const r = S * 0.09;
  const inset = lw / 2;

  ctx.beginPath();
  // roundRect есть во всех целевых браузерах (Chrome 99+/Firefox 112+); отдельный полифилл
  // ради одной текстуры не заводим.
  ctx.roundRect(inset, inset, S - lw, S - lw, r);
  ctx.closePath();

  ctx.fillStyle = PLATE_BASE_FILL;
  ctx.fill();

  // Подсветка к центру — цветом редкости (у нейтральной плашки её нет, иначе пустой слот
  // начинает читаться как предмет).
  if (tinted) {
    const glow = ctx.createRadialGradient(S / 2, S * 0.45, 0, S / 2, S * 0.45, S * 0.55);
    glow.addColorStop(0, `rgba(${hexRgb(color)}, 0.22)`);
    glow.addColorStop(1, `rgba(${hexRgb(color)}, 0)`);
    ctx.fillStyle = glow;
    ctx.fill();
  }

  // Виньетка к краям — иконка отделяется от рамки, силуэт предмета читается контрастнее.
  const vignette = ctx.createRadialGradient(S / 2, S / 2, S * 0.35, S / 2, S / 2, S * 0.72);
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
  ctx.fillStyle = vignette;
  ctx.fill();

  ctx.lineWidth = lw;
  ctx.strokeStyle = `rgba(${hexRgb(color)}, 0.9)`;
  ctx.stroke();

  tex.refresh();
  // Глобальный pixelArt:true (main.ts) даёт NEAREST — на растянутом градиенте это полосит.
  // Плашке нужен LINEAR; сама PNG-иконка предмета остаётся на NEAREST (пиксель-арт).
  tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
}

/**
 * Генерирует текстуры плашек (по одной на редкость + нейтральная). Идемпотентно и глобально:
 * текстуры живут в `game.textures`, достаточно одного вызова в PreloadScene.
 */
export function ensureItemPlates(scene: Phaser.Scene) {
  for (const [rarity, color] of Object.entries(RARITY_COLORS) as [Rarity, number][]) {
    drawPlate(scene, plateKey(rarity), color, true);
  }
  drawPlate(scene, NEUTRAL_KEY, NEUTRAL_COLOR, false);
}

export interface ItemIconOpts {
  /** id предмета; без него рисуется пустой слот (плашка + опц. силуэт). */
  itemId?: string;
  /** Редкость — цвет плашки и рамки. Без неё плашка нейтральная. */
  rarity?: Rarity;
  /** Ключ текстуры силуэта для пустого слота (`slotSilhouetteKey`). */
  silhouette?: string;
  /** Сторона плашки в пикселях (обычно = стороне ячейки). */
  size: number;
  /** Доля иконки от плашки. */
  iconRatio?: number;
  /** Прозрачность самой иконки (не плашки). */
  iconAlpha?: number;
}

const DEFAULT_ICON_RATIO = 0.78;
// Подсветку делаем отдельным светлым слоем, а не tint'ом плашки: tint в Phaser умножающий —
// любой цвет темнее белого только затемнит фон, а нужно наоборот.
const HOVER_COLOR = 0xffffff;
const HOVER_ALPHA = 0.14;

/**
 * Иконка предмета вместе с программным фоном: плашка (градиент + рамка по редкости) и поверх неё
 * сама PNG-иконка. Один GameObject — кладётся в те же массивы/поля, что и прежний `add.image`.
 */
export class ItemIconView extends Phaser.GameObjects.Container {
  readonly plate: Phaser.GameObjects.Image;
  readonly icon: Phaser.GameObjects.Image | null;
  private readonly hover: Phaser.GameObjects.Rectangle;
  private size: number;
  private readonly iconRatio: number;

  constructor(scene: Phaser.Scene, x: number, y: number, opts: ItemIconOpts) {
    super(scene, x, y);
    this.size = opts.size;
    this.iconRatio = opts.iconRatio ?? DEFAULT_ICON_RATIO;

    this.plate = scene.add
      .image(0, 0, plateKey(opts.rarity))
      .setDisplaySize(this.size, this.size);
    this.add(this.plate);

    this.hover = scene.add
      .rectangle(0, 0, this.size, this.size, HOVER_COLOR, HOVER_ALPHA)
      .setVisible(false);
    this.add(this.hover);

    const texture = opts.itemId ? itemIconKey(opts.itemId) : opts.silhouette;
    if (texture) {
      const inner = this.size * this.iconRatio;
      this.icon = scene.add
        .image(0, 0, texture)
        .setDisplaySize(inner, inner)
        .setAlpha(opts.iconAlpha ?? 1);
      this.add(this.icon);
    } else {
      this.icon = null;
    }

    scene.add.existing(this);
  }

  /** Подсветка на наведение — заменяет прежний `bg.setFillStyle()` ячейки (он теперь под плашкой). */
  setHover(on: boolean): this {
    this.hover.setVisible(on);
    return this;
  }

  /** Пересобрать размер (панель НПС меняет масштаб иконки в «руке» на лету). */
  setPlateSize(size: number): this {
    this.size = size;
    this.plate.setDisplaySize(size, size);
    this.hover.setSize(size, size);
    this.icon?.setDisplaySize(size * this.iconRatio, size * this.iconRatio);
    return this;
  }

  /** Сменить предмет на месте (swap в «руке» DragDropManager). */
  setItem(itemId: string, rarity?: Rarity): this {
    this.plate.setTexture(plateKey(rarity)).setDisplaySize(this.size, this.size);
    if (this.icon) {
      const inner = this.size * this.iconRatio;
      this.icon.setTexture(itemIconKey(itemId)).setDisplaySize(inner, inner);
    }
    return this;
  }
}

export function addItemIcon(scene: Phaser.Scene, x: number, y: number, opts: ItemIconOpts): ItemIconView {
  return new ItemIconView(scene, x, y, opts);
}
