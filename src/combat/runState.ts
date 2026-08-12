import type { ItemInstance, SlotType } from '../items/types';
import type { EmergencyHealConfig } from './types';
import { SLOT_ORDER } from '../items/types';
import { getItemBehavior } from '../items/registry';

/**
 * Per-run состояние предмета: лимиты, которые живут весь забег, а не бой (амулеты —
 * docs/content.items.amulet.md). Все четыре формы — движковые примитивы, а не триггеры: им нужно
 * мутируемое состояние, которого у стейтлес `channels`/`triggers` нет, а сама механика (гашение
 * урона, порог по HP, трата заряда, затухание шанса) живёт стадиями в `CombatEngine`.
 */
export interface RunItemState {
  /** Неуязвимость: N ударов полностью без урона. `max` — для счётчика в UI. */
  invuln?: { charges: number; max: number };
  /** Аварийный хил: разовый (за забег) долив HP при падении ниже порога. */
  emergencyHeal?: { used: boolean; config: EmergencyHealConfig };
  /** Лечение за убийство: фиксированная величина, конечное число срабатываний. */
  killHeal?: { amount: number; charges: number; max: number };
  /** Лайфстил за удар: шанс затухает с каждым проком (`baseChance * decay^procs`) — нуля не
   *  достигает никогда, так что предмет не «выключается» до конца забега, а только редеет. */
  hitLeech?: { baseChance: number; decay: number; amount: number; procs: number };
}

/**
 * Стейт-бэг забега: `item_id` → состояние. Ключ — предмет, а НЕ слот (в отличие от per-fight
 * `TriggerStateBag`): состояние обязано пережить перевешивание в другой слот и снятие-надевание
 * посреди боя, иначе «снять и надеть амулет» было бы бесплатным сбросом лимита за забег.
 *
 * Владелец бэга — забег (`ExpeditionScene`, `simulate.ts:runExpedition`), не бой: `HeroState`
 * держит его ПО ССЫЛКЕ, так что траты движка текут обратно владельцу и переживают
 * `buildInitialHero` следующего боя (тот же контракт, что у `damageTakenMult`).
 */
export type RunStateBag = Record<string, RunItemState>;

/**
 * Досевает бэг под текущую экипировку: незнакомый предмет получает полный запас, уже знакомый
 * сохраняет потраченное (`charges`/`used`/`procs` не трогаем). Записи не удаляются до конца
 * забега — снятый предмет помнит свой остаток, если его наденут обратно.
 *
 * Конфиг и `max` пересчитываются из ТЕКУЩЕЙ редкости: в рюкзаке может лежать вторая копия того же
 * предмета другого тира. Остаток при этом клампится к новому максимуму — апгрейд редкости посреди
 * забега не возвращает потраченные заряды.
 */
export function syncRunState(bag: RunStateBag, equipment: Partial<Record<SlotType, ItemInstance>>): void {
  for (const slot of Object.keys(equipment) as SlotType[]) {
    const inst = equipment[slot];
    if (!inst) continue;
    const beh = getItemBehavior(inst.item_id);
    const prev = bag[inst.item_id];
    const fresh: RunItemState = {};

    if (beh.invuln) {
      const max = beh.invuln(inst.rarity).charges;
      fresh.invuln = { charges: Math.min(prev?.invuln?.charges ?? max, max), max };
    }
    if (beh.emergencyHeal) {
      fresh.emergencyHeal = { used: prev?.emergencyHeal?.used ?? false, config: beh.emergencyHeal(inst.rarity) };
    }
    if (beh.killHeal) {
      const { amount, charges: max } = beh.killHeal(inst.rarity);
      fresh.killHeal = { amount, charges: Math.min(prev?.killHeal?.charges ?? max, max), max };
    }
    if (beh.hitLeech) {
      const { chance, decay, amount } = beh.hitLeech(inst.rarity);
      fresh.hitLeech = { baseChance: chance, decay, amount, procs: prev?.hitLeech?.procs ?? 0 };
    }

    if (Object.keys(fresh).length > 0) bag[inst.item_id] = fresh;
  }
}

/** Свежий бэг забега под стартовую экипировку. */
export function buildRunState(equipment: Partial<Record<SlotType, ItemInstance>>): RunStateBag {
  const bag: RunStateBag = {};
  syncRunState(bag, equipment);
  return bag;
}

/**
 * Состояния предметов НАДЕТОЙ экипировки в порядке слотов — детерминированный порядок трат
 * (какой предмет первым отдаст заряд), не зависящий от порядка ключей в бэге.
 */
export function equippedRunStates(
  equipment: Partial<Record<SlotType, ItemInstance>>,
  bag: RunStateBag,
): RunItemState[] {
  const out: RunItemState[] = [];
  for (const slot of SLOT_ORDER) {
    const inst = equipment[slot];
    const s = inst ? bag[inst.item_id] : undefined;
    if (s) out.push(s);
  }
  return out;
}

/** Заряды неуязвимости для UI (текущие/максимум) — сумма по надетой экипировке. Остаток за забег:
 *  между боями одной экспедиции не восстанавливается. */
export function getInvulnStatus(
  equipment: Partial<Record<SlotType, ItemInstance>>,
  bag: RunStateBag,
): { hits: number; max: number } {
  let hits = 0;
  let max = 0;
  for (const s of equippedRunStates(equipment, bag)) {
    if (!s.invuln) continue;
    hits += s.invuln.charges;
    max += s.invuln.max;
  }
  return { hits, max };
}
