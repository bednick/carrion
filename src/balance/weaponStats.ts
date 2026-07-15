// Характеристики оружия (слот hand_right) для balance-items.html.
// УВС (урон в секунду) считается прогоном РЕАЛЬНОГО хука `on.attack_ready` каждого предмета
// (тот же код, что в CombatEngine) против N болванок-врагов с фиксированной раскладкой по слотам
// доски — числа гарантированно совпадают с игрой, включая ситуативные архетипы (прошив/cleave/крит).
// Для детерминированных предметов (нет ctx.rng()) множественные сэмплы избыточны, но дёшевы —
// война_pick (крит) единственный, кому усреднение реально нужно.

import { ITEM_BEHAVIORS } from '../items/registry';
import type { Rarity, SlotType } from '../items/types';
import type { CombatView } from '../items/behavior';
import type { GameEvent } from '../combat/events';

const SAMPLES = 2000;
const SLOT: SlotType = 'hand_right';

// Строки stats(), которые уже вынесены в отдельные колонки таблицы (урон/интервал) — остальное
// идёт в колонку «доп. эффекты».
const OWN_COLUMN_PREFIXES = [/^Урон:/, /^Перезарядка:/];

function mockView(targetCount: number): CombatView {
  const enemies = Array.from({ length: targetCount }, (_, i) => ({
    id: `e${i}`, hp: 999_999, maxHp: 999_999, slot: i, isBoss: false,
  }));
  return { heroHp: 100, heroMaxHp: 100, enemies, equipment: {} };
}

function activationDamage(itemId: string, rarity: Rarity, targetCount: number): number {
  const hook = ITEM_BEHAVIORS[itemId]?.on?.attack_ready;
  if (!hook) return 0;

  const event: GameEvent = {
    type: 'attack_ready',
    source: { side: 'hero', slot: SLOT },
    target: { side: 'enemy', id: 'e0', idx: 0 },
    origin: { from: 'engine' },
  };
  const view = mockView(targetCount);

  let total = 0;
  for (let i = 0; i < SAMPLES; i++) {
    const result = hook(event as never, { rarity, slot: SLOT, view, rng: Math.random });
    for (const ev of result.spawn ?? []) {
      if (ev.type === 'attack') total += ev.amount;
    }
  }
  return total / SAMPLES;
}

export interface WeaponRow {
  id: string;
  name: string;
  tags: string[];
  damage: number;
  interval: number;
  dps1: number;
  dps2: number;
  dps4: number;
  effects: string[];
}

export function getWeaponRows(rarity: Rarity): WeaponRow[] {
  const rows: WeaponRow[] = [];
  for (const [id, behavior] of Object.entries(ITEM_BEHAVIORS)) {
    if (behavior.type !== 'weapon') continue;
    const interval = behavior.attackInterval?.(rarity) ?? 0;
    const damage = behavior.baseDamage?.(rarity) ?? 0;
    const effects = (behavior.stats?.(rarity) ?? [])
      .map((s) => s.text)
      .filter((text) => !OWN_COLUMN_PREFIXES.some((re) => re.test(text)));

    rows.push({
      id,
      name: behavior.name,
      tags: (behavior.tags ?? []).filter((t) => t !== 'weapon'),
      damage,
      interval,
      dps1: interval > 0 ? activationDamage(id, rarity, 1) / interval : 0,
      dps2: interval > 0 ? activationDamage(id, rarity, 2) / interval : 0,
      dps4: interval > 0 ? activationDamage(id, rarity, 4) / interval : 0,
      effects,
    });
  }
  return rows.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
}
