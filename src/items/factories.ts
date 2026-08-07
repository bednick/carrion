import type { Rarity } from './types';
import type { ItemCombatBehavior } from './behavior';
import { scaleByRarity } from './rarity';
import { DEFENSE_COLOR, WEAPON_COLOR } from './statColors';

export interface WeaponRarityStats {
  damage: number;
  interval: number; // секунды
}

export type WeaponOpts = Record<Rarity, WeaponRarityStats>;

/**
 * Обычное оружие: одна цель, без риддеров формы (крит — общая стадия движка, читает каналы
 * `crit_chance`/`crit_mult`, не завязана на конкретное оружие). Урон и интервал — явная таблица
 * по редкости (не формула-скейл) — так проще подогнать DPS вручную под целые числа урона.
 */
export function standardWeapon(opts: WeaponOpts): ItemCombatBehavior {
  const interval = (rarity: Rarity) => opts[rarity].interval;
  const damage = (rarity: Rarity) => opts[rarity].damage;

  return {
    weapon: (rarity) => ({ interval: interval(rarity), baseDamage: damage(rarity), shape: 'single' }),
    stats: (rarity) => [
      { text: `Урон: ${damage(rarity)}`, color: WEAPON_COLOR },
      { text: `Перезарядка: ${interval(rarity).toFixed(1)}`, color: WEAPON_COLOR },
    ],
  };
}

export interface ArmorOpts {
  /**
   * Доля снижения урона (0..1). Число — значение на `common`, дальше геометрический скейл с `cap`.
   * Явная таблица по редкости — когда ряд подгоняется руками под круглые проценты; `scale`/`cap`
   * тогда не применяются (значения в таблице уже финальные).
   */
  pct: number | Record<Rarity, number>;
  scale?: number;
  /** Потолок доли на верхней редкости — броня не должна вырастать до гарантированного блока. */
  cap?: number;
}

/** Броня: вклад в канал `armor_pct` тиром `more` — каждый источник брони независимый множитель
 *  «доля урона, прошедшая через этот слой» (0.74 = держит 26%). Несколько источников стакаются
 *  произведением Π(more_i) — то же самое, что раньше давала цепочка `mitigateDamage`-вызовов,
 *  но не зависит от того, в каком слоте лежит предмет (см. channels.ts). */
export function standardArmor(opts: ArmorOpts): ItemCombatBehavior {
  const scale = opts.scale ?? 1.5;
  const cap = opts.cap ?? 0.6;
  const raw = opts.pct;
  const pct = typeof raw === 'number'
    ? (rarity: Rarity) => Math.min(cap, scaleByRarity(raw, rarity, scale))
    : (rarity: Rarity) => raw[rarity];

  return {
    channels: (rarity) => [{ channel: 'armor_pct', tier: 'more', value: 1 - pct(rarity) }],
    stats: (rarity) => [{ text: `Защита: ${Math.round(pct(rarity) * 100)}%`, color: DEFENSE_COLOR }],
  };
}
