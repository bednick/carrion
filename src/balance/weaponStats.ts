// Характеристики оружия (слот hand_right) для balance-items.html.
// УВС (урон в секунду) считается прогоном РЕАЛЬНОГО authorAttack (тот же код, что в CombatEngine)
// против N болванок-врагов с фиксированной раскладкой по слотам доски — числа гарантированно
// совпадают с игрой, включая ситуативные архетипы (прошив/cleave/крит). Канал-агрегат строится
// ТОЛЬКО из собственных channels() этого предмета (не всей экипировки) — «сила самого оружия»,
// включая его собственный крит (напр. war_pick), без чужих бонусов вроде heavy_gloves.
// Для детерминированных предметов (нет броска) множественные сэмплы избыточны, но дёшевы — war_pick
// (крит) единственный, кому усреднение реально нужно.

import { ITEM_BEHAVIORS } from '../items/registry';
import type { Rarity } from '../items/types';
import type { CombatView } from '../items/behavior';
import type { Side } from '../combat/events';
import { aggregateChannels } from '../combat/channels';
import { authorAttack } from '../combat/resolution';
import { ITEM_NAMES } from '../i18n/content/items';

const SAMPLES = 2000;

// Строки stats(), которые уже вынесены в отдельные колонки таблицы (урон/интервал) — остальное
// идёт в колонку «доп. эффекты». Dev-тул всегда на русском (см. план локализации), но stats()
// предмета берёт лейблы через t() и следует ЖИВОМУ языку игры (последний выбор в CampScene) — на
// случай, если он окажется английским, матчим оба варианта префикса.
const OWN_COLUMN_PREFIXES = [/^Урон:/, /^Перезарядка:/, /^Damage:/, /^Recharge:/];

function mockView(targetCount: number): CombatView {
  const enemies = Array.from({ length: targetCount }, (_, i) => ({
    id: `e${i}`, hp: 999_999, maxHp: 999_999, slot: i, isBoss: false,
  }));
  return { heroHp: 100, heroMaxHp: 100, enemies, equipment: {} };
}

function activationDamage(itemId: string, rarity: Rarity, targetCount: number): number {
  const behavior = ITEM_BEHAVIORS[itemId];
  const weapon = behavior?.weapon?.(rarity);
  if (!weapon) return 0;

  // Таблица считает предмет в hand_right (см. коммент вверху файла) — тем же слотом резолвим
  // слот-зависимые вклады вроде dagger's weapon_interval_mult (см. dagger/behavior.ts).
  const channels = aggregateChannels(behavior.channels?.(rarity, 'hand_right') ?? []);
  const view = mockView(targetCount);
  const target: Side = { side: 'enemy', id: 'e0', idx: 0 };

  let total = 0;
  for (let i = 0; i < SAMPLES; i++) {
    const hits = authorAttack(weapon, channels, target, view, Math.random);
    for (const h of hits) total += h.amount;
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
    const weapon = behavior.weapon?.(rarity);
    const interval = weapon?.interval ?? 0;
    const damage = weapon?.baseDamage ?? 0;
    const effects = (behavior.stats?.(rarity) ?? [])
      .map((s) => s.text)
      .filter((text) => !OWN_COLUMN_PREFIXES.some((re) => re.test(text)));

    rows.push({
      id,
      name: ITEM_NAMES[id].ru,
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
