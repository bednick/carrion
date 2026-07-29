import Phaser from 'phaser';
import type { ItemInstance } from '../core/MetaStore';
import { getItemBehavior } from '../items/registry';
import { addItemIcon, RARITY_COLORS } from './itemIcon';
import { RARITY_COLORS as RARITY_TEXT_COLORS } from './Tooltip';
import { newBadge } from './newBadge';
import { FONT_FAMILY } from './theme';

/** Якорь стека: центр по X, нижний край стека по Y, ширина карточки. Живые координаты. */
export type LootPopupAnchor = () => { x: number; y: number; width: number };

const CARD_H = 44;
const GAP = 6;
const MAX_CARDS = 3;
// Время жизни карточки: появление → удержание → угасание.
const APPEAR_MS = 140;
const HOLD_MS = 2500;
const FADE_MS = 250;
// Вытесненная новыми находками карточка уходит быстрее, чем по своему таймеру.
const EVICT_MS = 150;

interface Entry {
  c: Phaser.GameObjects.Container;
  fade: Phaser.Tweens.Tween | null;
  moveTween: Phaser.Tweens.Tween | null;
  gone: boolean;
}

/**
 * Неблокирующие попапы находок в походе: карточка «иконка + название» всплывает над сеткой
 * рюкзака (там же, куда предмет реально падает) и гаснет сама. Поход при этом не останавливается.
 *
 * Вся анимация — на твинах, не на this.time/delayedCall: часы сцены экспедиции стоят на паузе
 * (ExpeditionScene.pause), а попап обязан доиграть и убраться, иначе застрянет на экране.
 */
export class LootPopupStack {
  private entries: Entry[] = [];

  constructor(private scene: Phaser.Scene, private anchor: LootPopupAnchor) {}

  /** Показать находку. isNew — предмет ещё ни разу не выносили из похода (значок «NEW»). */
  push(item: ItemInstance, isNew: boolean) {
    const { x, width } = this.anchor();
    const W = Math.max(120, width);

    const c = this.scene.add.container(x, 0).setDepth(95).setAlpha(0).setScale(0.92);

    const bg = this.scene.add.rectangle(0, 0, W, CARD_H, 0x1a1a2a, 0.95)
      .setStrokeStyle(2, RARITY_COLORS[item.rarity]);
    c.add(bg);

    const iconSize = CARD_H - 10;
    const iconX = -W / 2 + 6 + iconSize / 2;
    c.add(addItemIcon(this.scene, iconX, 0, {
      itemId: item.item_id, rarity: item.rarity, size: iconSize,
    }));

    const textX = iconX + iconSize / 2 + 8;
    c.add(this.scene.add.text(textX, 0, getItemBehavior(item.item_id).name, {
      fontSize: '13px', fontFamily: FONT_FAMILY, color: RARITY_TEXT_COLORS[item.rarity],
      wordWrap: { width: W - (textX + W / 2) - 10 },
    }).setOrigin(0, 0.5));

    // Значок последним — поверх иконки и названия.
    if (isNew) c.add(newBadge(this.scene, W / 2 - 10, -CARD_H / 2 + 4));

    const entry: Entry = { c, fade: null, moveTween: null, gone: false };
    this.entries.push(entry);

    // Новая карточка встаёт у якоря, прежние уезжают вверх.
    c.y = this.slotY(0) + 10;
    this.relayout();
    this.scene.tweens.add({ targets: c, alpha: 1, scale: 1, duration: APPEAR_MS, ease: 'Back.easeOut' });
    entry.fade = this.scene.tweens.add({
      targets: c, alpha: 0, delay: HOLD_MS, duration: FADE_MS,
      onComplete: () => this.remove(entry),
    });

    // Стек ограничен: лишние гасим досрочно, не дожидаясь их таймера.
    const excess = this.entries.length - MAX_CARDS;
    for (let i = 0; i < excess; i++) this.evict(this.entries[i]);
  }

  /** Y карточки на позиции i снизу (0 — самая свежая, у якоря). */
  private slotY(i: number): number {
    return this.anchor().y - CARD_H / 2 - i * (CARD_H + GAP);
  }

  /** Раскладывает живые карточки столбиком снизу вверх: свежая у якоря, старые выше. */
  private relayout() {
    const alive = this.entries.filter(e => !e.gone);
    alive.forEach((e, idx) => {
      const target = this.slotY(alive.length - 1 - idx);
      if (Math.abs(e.c.y - target) < 0.5) return;
      e.moveTween?.stop();
      e.moveTween = this.scene.tweens.add({
        targets: e.c, y: target, duration: APPEAR_MS, ease: 'Quad.easeOut',
      });
    });
  }

  private evict(entry: Entry) {
    if (entry.gone) return;
    entry.fade?.stop();
    entry.fade = this.scene.tweens.add({
      targets: entry.c, alpha: 0, duration: EVICT_MS,
      onComplete: () => this.remove(entry),
    });
  }

  private remove(entry: Entry) {
    if (entry.gone) return;
    entry.gone = true;
    entry.moveTween?.stop();
    entry.c.destroy();
    this.entries = this.entries.filter(e => e !== entry);
    this.relayout();
  }

  destroy() {
    for (const e of this.entries) {
      e.fade?.stop();
      e.moveTween?.stop();
      e.c.destroy();
    }
    this.entries = [];
  }
}
