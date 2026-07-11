import Phaser from 'phaser';
import type { Rarity, SlotType } from '../items/types';
import type { ItemInstance } from '../items/types';
import { getItemConfig } from '../items/registry';
import { itemIconKey } from '../items/icons';

const RARITY_COLORS: Record<Rarity, number> = {
  common: 0xffffff,
  uncommon: 0x55ff55,
  rare: 0x5555ff,
  epic: 0xaa00ff,
  legendary: 0xff8800,
};

/** Цвет подсветки слотов, в которые взятый в руку предмет можно положить. */
const HIGHLIGHT_COLOR = 0xffcc44;

export interface SlotZone {
  id: string;
  slotType?: SlotType;
  allowOccupied?: boolean;
  /** Целевой слот для «руки» (стойка, кузница). Сундук — не placeable: туда предмет уходит как в мешок. */
  placeable?: boolean;
  rect: Phaser.Geom.Rectangle;
  item: ItemInstance | null;
  onAccept: (item: ItemInstance, fromId: string) => void;
  onRemove: () => ItemInstance | null;
}

/** Результат попытки положить предмет из «руки» в слот. */
export type PlaceResult = 'placed' | 'swapped' | 'rejected';

export class DragDropManager {
  private scene: Phaser.Scene;
  private slots = new Map<string, SlotZone>();

  // Перетаскивание зажатой мышью (drag&drop).
  private dragSprite: Phaser.GameObjects.Image | null = null;
  private draggingFrom: string | null = null;
  private draggingItem: ItemInstance | null = null;

  // «Рука»: предмет взят по клику и держится у курсора между кликами.
  private heldItem: ItemInstance | null = null;
  private heldFrom: string | null = null;
  private heldSprite: Phaser.GameObjects.Image | null = null;
  private heldBorder: Phaser.GameObjects.Rectangle | null = null;

  // Подсветка слотов, куда подходит взятый в руку предмет.
  private highlights: Phaser.GameObjects.Rectangle[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    scene.input.on('pointermove', this.onPointerMove, this);
    scene.input.on('pointerup', this.onPointerUp, this);
  }

  registerSlot(zone: SlotZone) {
    this.slots.set(zone.id, zone);
    if (this.heldItem) this.updateHighlights();
  }

  unregisterSlot(id: string) {
    this.slots.delete(id);
    if (this.heldItem) this.updateHighlights();
  }

  /** Сбросить реестр слотов, сохранив состояние «руки» (нужно при перестроении панели). */
  clearSlots() {
    this.slots.clear();
    if (this.heldItem) this.updateHighlights();
  }

  startDrag(fromSlotId: string, pointerX: number, pointerY: number) {
    if (this.heldItem) return; // пока предмет в руке — drag не начинаем
    const slot = this.slots.get(fromSlotId);
    if (!slot || !slot.item) return;

    this.draggingFrom = fromSlotId;
    this.draggingItem = slot.item;

    this.dragSprite = this.scene.add
      .image(pointerX, pointerY, itemIconKey(slot.item.item_id))
      .setDisplaySize(44, 44)
      .setDepth(200)
      .setAlpha(0.85)
      .setOrigin(0.5);
  }

  private onPointerMove(ptr: Phaser.Input.Pointer) {
    this.dragSprite?.setPosition(ptr.x, ptr.y);
    this.heldSprite?.setPosition(ptr.x, ptr.y);
    this.heldBorder?.setPosition(ptr.x, ptr.y);
  }

  private onPointerUp(ptr: Phaser.Input.Pointer) {
    if (!this.draggingItem || !this.draggingFrom) return;

    for (const [id, slot] of this.slots) {
      if (id === this.draggingFrom) continue;
      if (!Phaser.Geom.Rectangle.Contains(slot.rect, ptr.x, ptr.y)) continue;

      if (this.canAccept(slot, this.draggingItem)) {
        const fromSlot = this.slots.get(this.draggingFrom);
        if (fromSlot) fromSlot.onRemove();
        slot.onAccept(this.draggingItem, this.draggingFrom);
      }
      break;
    }

    this.clearDrag();
  }

  isDragging(): boolean {
    return this.draggingItem !== null;
  }

  // ─── «Рука» (click-to-pick / click-to-place) ─────────────────────────

  isHolding(): boolean {
    return this.heldItem !== null;
  }

  /** Взять предмет из слота в руку. Возвращает true, если получилось. */
  pickUp(slotId: string): boolean {
    if (this.heldItem) return false;
    const slot = this.slots.get(slotId);
    if (!slot || !slot.item) return false;

    const item = slot.onRemove();
    if (!item) return false;

    this.holdItem(item, slotId);
    return true;
  }

  /**
   * Взять в руку предмет, не привязанный к зарегистрированному слоту (например, с ленты лута).
   * Вызывающий сам удаляет предмет из источника. Возврат «на место» обработает вызывающий
   * (heldFrom не совпадёт ни с одним placeable-слотом → сработает сброс в сумку).
   */
  holdItem(item: ItemInstance, fromId: string): boolean {
    if (this.heldItem) return false;
    this.heldItem = item;
    this.heldFrom = fromId;
    const p = this.scene.input.activePointer;
    this.heldBorder = this.scene.add
      .rectangle(p.x, p.y, 48, 48)
      .setStrokeStyle(2, RARITY_COLORS[item.rarity])
      .setDepth(299)
      .setOrigin(0.5);
    this.heldSprite = this.scene.add
      .image(p.x, p.y, itemIconKey(item.item_id))
      .setDisplaySize(44, 44)
      .setDepth(300)
      .setAlpha(0.95)
      .setOrigin(0.5);
    this.updateHighlights();
    return true;
  }

  /**
   * Положить предмет из руки в слот.
   * - тот же слот-источник → вернуть на место;
   * - пустой подходящий слот → положить;
   * - занятый подходящий слот → поменять местами (предыдущий предмет берётся в руку);
   * - не подходит по типу → 'rejected', предмет остаётся в руке.
   */
  placeAt(slotId: string): PlaceResult {
    if (!this.heldItem) return 'rejected';
    const slot = this.slots.get(slotId);
    if (!slot) return 'rejected';

    // Возврат в слот-источник разрешён всегда (предмет оттуда и пришёл), но только если
    // слот свободен. После swap heldFrom указывает на занятый слот — тогда нужен повторный
    // swap, а не перезапись (иначе предмет в слоте пропадает).
    const sameSource = slotId === this.heldFrom;
    const compatible = sameSource
      || !slot.slotType
      || getItemConfig(this.heldItem.item_id).slots.includes(slot.slotType);
    if (!compatible) return 'rejected';

    if (slot.item === null) {
      slot.onAccept(this.heldItem, this.heldFrom ?? '');
      this.clearHand();
      return 'placed';
    }

    // Занятый совместимый слот → swap.
    const swapped = slot.onRemove();
    slot.onAccept(this.heldItem, this.heldFrom ?? '');
    this.heldItem = swapped;
    this.heldFrom = slotId;
    if (swapped && this.heldSprite) {
      this.heldSprite.setTexture(itemIconKey(swapped.item_id));
      this.heldBorder?.setStrokeStyle(2, RARITY_COLORS[swapped.rarity]);
      this.updateHighlights(); // тип предмета в руке сменился — пересветить подходящие слоты
    } else {
      this.clearHand();
    }
    return 'swapped';
  }

  /** Снять предмет с руки и вернуть его (для сброса в сундук). */
  dropHeld(): ItemInstance | null {
    const it = this.heldItem;
    this.clearHand();
    return it;
  }

  /** Найти placeable-слот под точкой (только целевые слоты для руки). */
  findPlaceableAt(x: number, y: number): SlotZone | undefined {
    for (const slot of this.slots.values()) {
      if (slot.placeable && Phaser.Geom.Rectangle.Contains(slot.rect, x, y)) return slot;
    }
    return undefined;
  }

  getSlot(id: string): SlotZone | undefined {
    return this.slots.get(id);
  }

  findSlotAt(x: number, y: number): SlotZone | undefined {
    for (const slot of this.slots.values()) {
      if (Phaser.Geom.Rectangle.Contains(slot.rect, x, y)) return slot;
    }
    return undefined;
  }

  private canAccept(slot: SlotZone, item: ItemInstance): boolean {
    if (slot.item !== null && !slot.allowOccupied) return false;
    if (!slot.slotType) return true;
    const cfg = getItemConfig(item.item_id);
    return cfg.slots.includes(slot.slotType);
  }

  // ─── Подсветка подходящих слотов ─────────────────────────────────────

  /** Перерисовать подсветку слотов, в которые подходит взятый в руку предмет. */
  private updateHighlights() {
    this.clearHighlights();
    if (!this.heldItem) return;

    const cfg = getItemConfig(this.heldItem.item_id);
    for (const slot of this.slots.values()) {
      // «Область использования» = типизированный слот (экипировка/стойка),
      // подходящий предмету. Универсальные зоны (сундук, продажа) не подсвечиваем.
      if (!slot.slotType || !cfg.slots.includes(slot.slotType)) continue;

      const r = slot.rect;
      const rect = this.scene.add
        .rectangle(r.centerX, r.centerY, r.width, r.height, HIGHLIGHT_COLOR, 0.18)
        .setStrokeStyle(2, HIGHLIGHT_COLOR, 0.9)
        .setDepth(250)
        .setOrigin(0.5);
      this.scene.tweens.add({
        targets: rect,
        alpha: { from: 0.95, to: 0.4 },
        duration: 650,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.highlights.push(rect);
    }
  }

  private clearHighlights() {
    for (const h of this.highlights) {
      this.scene.tweens.killTweensOf(h);
      h.destroy();
    }
    this.highlights = [];
  }

  private clearHand() {
    this.clearHighlights();
    this.heldSprite?.destroy();
    this.heldSprite = null;
    this.heldBorder?.destroy();
    this.heldBorder = null;
    this.heldItem = null;
    this.heldFrom = null;
  }

  private clearDrag() {
    this.dragSprite?.destroy();
    this.dragSprite = null;
    this.draggingFrom = null;
    this.draggingItem = null;
  }

  destroy() {
    this.clearDrag();
    this.clearHand();
    this.scene.input.off('pointermove', this.onPointerMove, this);
    this.scene.input.off('pointerup', this.onPointerUp, this);
  }
}
