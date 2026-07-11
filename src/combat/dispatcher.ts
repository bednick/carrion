import type { GameEvent, Origin, EventResult } from './events';
import type { SlotType, ItemInstance } from '../items/types';
import type { CombatView, HandlerContext } from '../items/behavior';
import { getItemBehavior } from '../items/registry';

/**
 * Фиксированный порядок обработчиков-предметов. Персонаж (наивысший приоритет) пока не имеет
 * хуков — при появлении встанет перед этим списком.
 */
export const HANDLER_ORDER: SlotType[] = [
  'hand_right', 'hand_left', 'head', 'body_upper', 'body_lower', 'legs',
];

/** Предохранитель от каскада/петель на одно исходное событие. */
export const MAX_CASCADE = 64;

/** Навешивает технический источник (и причину) на событие. Делает только диспетчер. */
export function stampOrigin(e: GameEvent, origin: Origin, cause?: GameEvent): GameEvent {
  return { ...e, origin, cause: cause ?? e.cause };
}

export interface DispatchCtx {
  view: CombatView;
  rng: () => number;
}

/**
 * Защитный хук врага. Враг — обработчик наравне с предметами (docs/combat-events.md §1.4), но не
 * носит предметов: его защита — данные из конфига моба. Бежит ПЕРВЫМ в проходе (до слотов героя),
 * чтобы уклонение сняло удар до он-хит эффектов героя (лайфстил не прокает на уклонённый удар),
 * а брона отдала им реально прошедший урон. Возвращает `null`, если событие не про защиту врага.
 * `origin` — источник спавнов (шипы/уклонение), диспетчер штампует его на порождённые события.
 */
export type EnemyDefenseHook = (
  e: GameEvent,
  ctx: DispatchCtx,
) => { result: EventResult; origin: Origin } | null;

/**
 * Один полный проход события по обработчикам в порядке `HANDLER_ORDER`.
 * - `replace` продолжает текущее событие к следующему обработчику (без перезапуска);
 * - `spawn` уходит в `queue` на свежий проход, диспетчер штампует ему origin = слот обработчика.
 * Возвращает терминальные события (дошедшие до конца) — их применяет движок.
 */
export function runPass(
  event: GameEvent,
  equipment: Partial<Record<SlotType, ItemInstance>>,
  ctx: DispatchCtx,
  queue: GameEvent[],
  enemyDefense?: EnemyDefenseHook,
): GameEvent[] {
  let current: GameEvent[] = [event];

  // Враг-обработчик: защита моба-цели резолвится до слотов героя.
  if (enemyDefense) {
    const next: GameEvent[] = [];
    for (const e of current) {
      const hit = enemyDefense(e, ctx);
      if (!hit) { next.push(e); continue; }
      const replace = hit.result.replace ?? [e];
      for (const r of replace) next.push(r);
      if (hit.result.spawn) for (const s of hit.result.spawn) queue.push(stampOrigin(s, hit.origin, e));
    }
    current = next;
  }

  for (const slot of HANDLER_ORDER) {
    const inst = equipment[slot];
    if (!inst) continue;
    const beh = getItemBehavior(inst.item_id);
    if (!beh.on) continue;

    const next: GameEvent[] = [];
    for (const e of current) {
      const handler = beh.on[e.type] as
        | ((e: GameEvent, c: HandlerContext) => import('./events').EventResult)
        | undefined;
      if (!handler) { next.push(e); continue; }

      const hctx: HandlerContext = { rarity: inst.rarity, slot, view: ctx.view, rng: ctx.rng };
      const res = handler(e, hctx) ?? {};
      const replace = res.replace ?? [e];
      for (const r of replace) next.push(r);
      if (res.spawn) for (const s of res.spawn) queue.push(stampOrigin(s, { from: 'item', slot }, e));
    }
    current = next;
  }

  return current;
}
