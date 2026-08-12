import type { Rarity, SlotType, ItemInstance } from '../items/types';
import type { EventType, EventOf, GameEvent } from './events';
import type { CombatView } from '../items/behavior';
import { getItemBehavior } from '../items/registry';

/** Приватный кусок per-fight стейт-бэга, доступный конкретному триггеру (см. `TriggerStateBag`). */
export interface TriggerContext {
  rarity: Rarity;
  slot: SlotType;
  view: CombatView;
  rng: () => number;
  state: Record<string, unknown>;
}

export interface TriggerResult {
  spawn?: GameEvent[];
}

/**
 * Декларативное правило «на событие [+ условие] → действие», заменяет старые `on`-хуки.
 * В отличие от них триггер НЕ может `replace` числовые поля события — читает уже резолвленные
 * данные (митигация/крит/блок теперь код стадий в `resolution.ts`, не то, что предметы мутируют
 * по очереди) и может только `spawn`-ить новые события. Порядок триггеров друг относительно друга
 * не влияет на числовой исход — каждый видит один и тот же (не изменённый соседями) `e`.
 */
export interface TriggerDef<T extends EventType = EventType> {
  /** Локальный id, стабильный для тултипов/отладки — ключ стейт-бэга вместе со слотом. */
  id: string;
  event: T;
  condition?: (e: EventOf<T>, ctx: TriggerContext) => boolean;
  action: (e: EventOf<T>, ctx: TriggerContext) => TriggerResult;
  /** Сид стейта при сборке героя (свежий на каждый `buildInitialHero`). */
  initState?: (rarity: Rarity) => Record<string, unknown>;
}

/** Per-fight стейт-бэг: слот → { id триггера → приватное состояние }. Слот — уже существующий,
 *  коллизионно-безопасный идентификатор «этого надетого экземпляра», отдельная identity не нужна. */
export type TriggerStateBag = Partial<Record<SlotType, Record<string, unknown>>>;

/**
 * Строит per-fight стейт-бэг из `initState()` всех `triggers()` надетой экипировки. Свежий на
 * каждый `buildInitialHero` — это и есть скоуп «за бой». Лимиты предметов, живущие весь забег
 * (неуязвимость, аварийный хил, лечения за убийство/удар), сюда НЕ входят: у них свой бэг
 * `RunStateBag` с другим владельцем и другим сбросом — см. `runState.ts`.
 */
export function buildTriggerState(equipment: Partial<Record<SlotType, ItemInstance>>): TriggerStateBag {
  const state: TriggerStateBag = {};
  for (const slot of Object.keys(equipment) as SlotType[]) {
    const inst = equipment[slot];
    if (!inst) continue;
    const beh = getItemBehavior(inst.item_id);
    const bag: Record<string, unknown> = {};

    for (const t of beh.triggers?.(inst.rarity) ?? []) {
      if (t.initState) bag[t.id] = t.initState(inst.rarity);
    }

    if (Object.keys(bag).length > 0) state[slot] = bag;
  }
  return state;
}

/** Прогоняет все триггеры экипировки, подписанные на `e.type` — независимо друг от друга,
 *  порядок слотов на исход не влияет (каждый читает один и тот же `e`, ничего не мутируя). */
export function runTriggers(
  equipment: Partial<Record<SlotType, ItemInstance>>,
  triggerState: TriggerStateBag,
  e: GameEvent,
  view: CombatView,
  rng: () => number,
): GameEvent[] {
  const spawned: GameEvent[] = [];
  for (const slot of Object.keys(equipment) as SlotType[]) {
    const inst = equipment[slot];
    if (!inst) continue;
    const beh = getItemBehavior(inst.item_id);
    for (const t of beh.triggers?.(inst.rarity) ?? []) {
      if (t.event !== e.type) continue;
      const bag = (triggerState[slot] ??= {});
      const tState = (bag[t.id] ??= {}) as Record<string, unknown>;
      const ctx: TriggerContext = { rarity: inst.rarity, slot, view, rng, state: tState };
      if (t.condition && !t.condition(e as never, ctx as never)) continue;
      const res = t.action(e as never, ctx as never);
      if (res.spawn) spawned.push(...res.spawn);
    }
  }
  return spawned;
}
