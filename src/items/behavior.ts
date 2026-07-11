import type { Rarity, SlotType, ItemInstance } from './types';
import type { EventType, EventOf, EventResult } from '../combat/events';

/** Снимок боя «только для чтения», доступный хукам для условных синергий. */
export interface CombatView {
  heroHp: number;
  heroMaxHp: number;
  enemies: { id: string; hp: number; maxHp: number; slot: number; isBoss?: boolean }[];
  equipment: Partial<Record<SlotType, ItemInstance>>;
}

export interface HandlerContext {
  rarity: Rarity; // редкость обрабатывающего предмета
  slot: SlotType; // слот, в котором надет предмет
  view: CombatView;
  rng: () => number;
}

/** Набор хуков предмета: по одному (опциональному) на тип события, с точной типизацией нагрузки. */
export type EventHandlers = {
  [T in EventType]?: (e: EventOf<T>, ctx: HandlerContext) => EventResult;
};

export interface StatLine {
  text: string;
  color: string;
}

/**
 * Вклад предмета в мета-петлю (вне боя). Суммируется по всей экипировке и читается в нужных точках
 * (лут-ролл, шанс побега, длина забега…). Пока реализован `magicFind`.
 */
export interface MetaModifiers {
  magicFind?: number;   // шанс улучшить редкость каждого выпавшего предмета на тир (геометрически, до кап предмета)
  fightDelta?: number;  // ± число рядовых боёв в забеге; фиксируется при старте экспедиции
  // escapeBonus/secureSlots убраны вместе с побегом/схроном (см. docs/roadmap.md).
}

/**
 * Поведение предмета. Всё опционально — отсутствие поля = «ничего не делает».
 * - `attackInterval` — делает предмет оружием: движок строит по нему поток стамины (секунды).
 * - `on` — хуки-трансформеры событий.
 * - `stats` — строки для тултипа (единый источник правды по статам).
 */
export interface ItemBehavior {
  attackInterval?: (rarity: Rarity) => number;
  on?: EventHandlers;
  stats?: (rarity: Rarity) => StatLine[];
  meta?: (rarity: Rarity) => MetaModifiers;
}
