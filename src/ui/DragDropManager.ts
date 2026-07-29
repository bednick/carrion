import Phaser from 'phaser';
import type { SlotType } from '../items/types';
import type { ItemInstance } from '../items/types';
import { getItemBehavior } from '../items/registry';
import { addItemIcon, ItemIconView } from './itemIcon';

/** Цвет подсветки слотов, в которые взятый в руку предмет можно положить. */
const HIGHLIGHT_COLOR = 0xffcc44;
const HIGHLIGHT_FILL_ALPHA = 0.18;
const HIGHLIGHT_STROKE_ALPHA = 0.9;
const HIGHLIGHT_TWEEN_RANGE: [number, number] = [0.95, 0.4];
// Приглушённая версия — для слотов, куда предмет кладётся не по типу (например, вход крафта).
const HIGHLIGHT_FILL_ALPHA_DIM = 0.08;
const HIGHLIGHT_STROKE_ALPHA_DIM = 0.5;
const HIGHLIGHT_TWEEN_RANGE_DIM: [number, number] = [0.6, 0.25];

export interface SlotZone {
  id: string;
  slotType?: SlotType;
  allowOccupied?: boolean;
  /** Целевой слот для «руки» (стойка, кузница). Сундук — не placeable: туда предмет уходит как в мешок. */
  placeable?: boolean;
  /**
   * Слот принимает предмет не по типу, а по другому критерию (например, вход улучшения —
   * по возможности повысить редкость). Если задан и возвращает true для предмета в руке,
   * слот подсвечивается тусклее, чем обычные типизированные слоты.
   */
  alwaysHighlight?: (item: ItemInstance) => boolean;
  rect: Phaser.Geom.Rectangle;
  item: ItemInstance | null;
  /**
   * Принять предмет в слот. Должен уметь принять не только предмет игрока, но и вытесненный
   * при обмене: при drag&drop в занятый слот вытесненный предмет отправляется в слот-источник,
   * а им может быть любой зарегистрированный слот (в т.ч. ячейка сундука).
   */
  onAccept: (item: ItemInstance, fromId: string) => void;
  onRemove: () => ItemInstance | null;
}

/** Результат попытки положить предмет из «руки» в слот. */
export type PlaceResult = 'placed' | 'swapped' | 'rejected';

export class DragDropManager {
  private scene: Phaser.Scene;
  private slots = new Map<string, SlotZone>();

  // Перетаскивание зажатой мышью (drag&drop).
  private dragSprite: ItemIconView | null = null;
  private draggingFrom: string | null = null;
  private draggingItem: ItemInstance | null = null;

  // «Рука»: предмет взят по клику и держится у курсора между кликами.
  private heldItem: ItemInstance | null = null;
  private heldFrom: string | null = null;
  // Рамку редкости несёт плашка иконки (src/ui/itemIcon.ts) — отдельный heldBorder не нужен.
  private heldSprite: ItemIconView | null = null;

  // Подсветка слотов, куда подходит взятый в руку предмет.
  private highlights: Phaser.GameObjects.Rectangle[] = [];

  // Спрайты «руки» и драга живут в экранных координатах, вне контейнера панели, поэтому
  // масштаб увеличенного меню НПС им передаётся снаружи (CampScene.rebuildPanel).
  private iconScale = 1;

  /** Итог завершённого drag&drop — сцена показывает сообщение при отказе. */
  onDropResult?: (result: PlaceResult) => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    scene.input.on('pointermove', this.onPointerMove, this);
    scene.input.on('pointerup', this.onPointerUp, this);
  }

  /** Масштаб иконки предмета в руке/драге — под размер ячеек текущей панели. */
  setIconScale(s: number) {
    this.iconScale = s;
    this.dragSprite?.setPlateSize(48 * s);
    this.heldSprite?.setPlateSize(48 * s);
  }

  registerSlot(zone: SlotZone) {
    this.slots.set(zone.id, zone);
    if (this.activeItem()) this.updateHighlights();
  }

  unregisterSlot(id: string) {
    this.slots.delete(id);
    if (this.activeItem()) this.updateHighlights();
  }

  /** Сбросить реестр слотов, сохранив состояние «руки» (нужно при перестроении панели). */
  clearSlots() {
    this.slots.clear();
    if (this.activeItem()) this.updateHighlights();
  }

  /** Предмет «в работе» — в руке или под курсором в драге. Для него считается подсветка. */
  private activeItem(): ItemInstance | null {
    return this.heldItem ?? this.draggingItem;
  }

  startDrag(fromSlotId: string, pointerX: number, pointerY: number) {
    if (this.heldItem) return; // пока предмет в руке — drag не начинаем
    const slot = this.slots.get(fromSlotId);
    if (!slot || !slot.item) return;

    this.draggingFrom = fromSlotId;
    this.draggingItem = slot.item;

    // Глубина как у «руки» (300) — иначе заливка подсветки (250) легла бы поверх иконки.
    this.dragSprite = addItemIcon(this.scene, pointerX, pointerY, {
      itemId: slot.item.item_id,
      rarity: slot.item.rarity,
      size: 48 * this.iconScale,
    }).setDepth(300).setAlpha(0.85);

    this.updateHighlights();
  }

  private onPointerMove(ptr: Phaser.Input.Pointer) {
    this.dragSprite?.setPosition(ptr.x, ptr.y);
    this.heldSprite?.setPosition(ptr.x, ptr.y);
  }

  /**
   * Завершение драга. Правила совпадают с «рукой» (placeAt):
   * - пустой подходящий слот → положить;
   * - занятый подходящий слот → обмен, вытесненный предмет уезжает в слот-источник;
   * - не подходит / мимо всех зон → 'rejected', предмет остаётся в источнике.
   */
  private onPointerUp(ptr: Phaser.Input.Pointer) {
    if (!this.draggingItem || !this.draggingFrom) return;
    const item = this.draggingItem;
    const fromId = this.draggingFrom;
    this.clearDrag(); // до onAccept: тот планирует перестроение панели

    const { target, overSlot } = this.findDropTarget(ptr.x, ptr.y, fromId, item);
    if (!target) {
      // Бросок в пустоту — молча оставляем предмет в источнике; сообщение только если
      // под курсором был слот и он отказал.
      if (overSlot) this.onDropResult?.('rejected');
      return;
    }

    const source = this.slots.get(fromId);
    // Порядок важен: сначала освободить цель, потом источник, и только затем класть —
    // MetaStore.setArmorStandSlot перезаписывает слот вслепую.
    const displaced = target.item !== null ? target.onRemove() : null;
    source?.onRemove();
    target.onAccept(item, fromId);
    if (displaced) source?.onAccept(displaced, target.id);

    this.onDropResult?.(displaced ? 'swapped' : 'placed');
  }

  /**
   * Слот под курсором, готовый принять предмет: сначала целевые (placeable), потом остальные.
   * Приоритет placeable нужен, чтобы крупный слот-приёмник (панель сундука) не перехватывал
   * дроп в лежащую внутри него ячейку только из-за более раннего порядка регистрации.
   */
  private findDropTarget(
    x: number, y: number, fromId: string, item: ItemInstance,
  ): { target?: SlotZone; overSlot: boolean } {
    const hits: SlotZone[] = [];
    for (const [id, slot] of this.slots) {
      if (id === fromId) continue;
      if (!Phaser.Geom.Rectangle.Contains(slot.rect, x, y)) continue;
      if (slot.placeable && this.canAccept(slot, item)) return { target: slot, overSlot: true };
      hits.push(slot);
    }
    return { target: hits.find(s => this.canAccept(s, item)), overSlot: hits.length > 0 };
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
   * Взять в руку предмет, не привязанный к зарегистрированному слоту (например, из сундука).
   * Вызывающий сам удаляет предмет из источника. Возврат «на место» обработает вызывающий
   * (heldFrom не совпадёт ни с одним placeable-слотом → сработает сброс в сумку).
   */
  holdItem(item: ItemInstance, fromId: string): boolean {
    if (this.heldItem) return false;
    this.heldItem = item;
    this.heldFrom = fromId;
    const p = this.scene.input.activePointer;
    this.heldSprite = addItemIcon(this.scene, p.x, p.y, {
      itemId: item.item_id,
      rarity: item.rarity,
      size: 48 * this.iconScale,
    }).setDepth(300).setAlpha(0.95);
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
      || getItemBehavior(this.heldItem.item_id).slots.includes(slot.slotType);
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
      this.heldSprite.setItem(swapped.item_id, swapped.rarity);
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
    // Типизированный слот (экипировка/стойка): решает только совместимость предмета.
    // Занятый — не отказ, а обмен местами (см. onPointerUp).
    if (slot.slotType) return getItemBehavior(item.item_id).slots.includes(slot.slotType);
    // Нетипизированный слот принимает любой предмет; занятый — только если это целевой
    // слот руки/драга (обмен) или он явно разрешает подмену.
    return slot.item === null || slot.placeable === true || !!slot.allowOccupied;
  }

  // ─── Подсветка подходящих слотов ─────────────────────────────────────

  /** Перерисовать подсветку слотов, в которые подходит взятый в руку (или тащимый) предмет. */
  private updateHighlights() {
    this.clearHighlights();
    const active = this.activeItem();
    if (!active) return;

    const beh = getItemBehavior(active.item_id);
    for (const slot of this.slots.values()) {
      // «Область использования» = типизированный слот (экипировка/стойка), подходящий предмету,
      // либо слот, принимающий любой предмет (вход улучшения) — тот подсвечивается тусклее.
      const typedMatch = !!slot.slotType && beh.slots.includes(slot.slotType);
      if (!typedMatch && !slot.alwaysHighlight?.(active)) continue;

      const fillAlpha = typedMatch ? HIGHLIGHT_FILL_ALPHA : HIGHLIGHT_FILL_ALPHA_DIM;
      const strokeAlpha = typedMatch ? HIGHLIGHT_STROKE_ALPHA : HIGHLIGHT_STROKE_ALPHA_DIM;
      const [from, to] = typedMatch ? HIGHLIGHT_TWEEN_RANGE : HIGHLIGHT_TWEEN_RANGE_DIM;

      const r = slot.rect;
      const rect = this.scene.add
        .rectangle(r.centerX, r.centerY, r.width, r.height, HIGHLIGHT_COLOR, fillAlpha)
        .setStrokeStyle(2, HIGHLIGHT_COLOR, strokeAlpha)
        .setDepth(250)
        .setOrigin(0.5);
      this.scene.tweens.add({
        targets: rect,
        alpha: { from, to },
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
    this.heldItem = null;
    this.heldFrom = null;
  }

  private clearDrag() {
    this.clearHighlights();
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
