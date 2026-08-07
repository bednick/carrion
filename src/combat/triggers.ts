import type { Rarity, SlotType, ItemInstance } from '../items/types';
import type { EventType, EventOf, GameEvent } from './events';
import type { CombatView } from '../items/behavior';
import type { EmergencyHealConfig } from './types';
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

export interface InvulnState { charges: number; max: number; }
export interface EmergencyHealState { used: boolean; config: EmergencyHealConfig; }

/**
 * Строит per-fight стейт-бэг: заряды неуязвимости/аварийный хил (декларативные поля
 * `ItemBehavior.invuln`/`emergencyHeal`, читаются один раз при сборке — сама механика гейта
 * живёт в `CombatEngine.applyDamage`, ей нужно мутируемое состояние, которого у стейтлес-триггеров
 * нет) + `initState()` всех `triggers()` надетой экипировки. Свежий на каждый `buildInitialHero` —
 * тот же контракт сброса, что был у старых `invulnHits`/`emergencyHealUsed`.
 */
export function buildTriggerState(equipment: Partial<Record<SlotType, ItemInstance>>): TriggerStateBag {
  const state: TriggerStateBag = {};
  for (const slot of Object.keys(equipment) as SlotType[]) {
    const inst = equipment[slot];
    if (!inst) continue;
    const beh = getItemBehavior(inst.item_id);
    const bag: Record<string, unknown> = {};

    if (beh.invuln) {
      const charges = beh.invuln(inst.rarity).charges;
      const s: InvulnState = { charges, max: charges };
      bag.invuln = s;
    }
    if (beh.emergencyHeal) {
      const s: EmergencyHealState = { used: false, config: beh.emergencyHeal(inst.rarity) };
      bag.emergency_heal = s;
    }
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

/** Заряды неуязвимости для UI (счётчик текущий/максимум) — суммирует по всей экипировке героя. */
export function getInvulnStatus(triggerState: TriggerStateBag): { hits: number; max: number } {
  let hits = 0;
  let max = 0;
  for (const bag of Object.values(triggerState)) {
    const s = bag?.invuln as InvulnState | undefined;
    if (!s) continue;
    hits += s.charges;
    max += s.max;
  }
  return { hits, max };
}
