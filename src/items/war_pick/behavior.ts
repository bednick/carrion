import type { ItemBehavior } from '../behavior';

const DMG_COLOR = '#ffcc44';

// Крит: профильный стат — множитель крита (растёт с редкостью), шанс крита фиксирован (R5 — ровно
// один профильный стат). Крит несёт rider `armorPierce` — игнорирует часть брони цели на этот удар:
// под флэт-броню это было не нужно (крупный урон и так пробивал её непропорционально сильнее — см.
// историю в docs/content.items.hand_right.md), но под %-моделью брони (2026-07, см. docs/mechanics.md
// §«Броня vs щит») процентное снижение одинаково режет любой урон вне зависимости от размера — без
// явного пробития крит потерял бы свою анти-Мародёры идентичность (R6).
//
// damage/interval — явная таблица по редкости (не формула-скейл): средний DPS с учётом крита
// (`damage · (1 - crit_chance + crit_chance · crit_mult) / interval`) растёт ×1.3 за уровень редкости
// от анкора common (5.0). damage подобран под целые числа, interval — остаточная подгонка точности.
const CRIT_CHANCE = 0.2;
const CRIT_ARMOR_PIERCE = 1.;
const CRIT_MULT_BY_RARITY: Record<import('../types').Rarity, number> = {
  common: 2.0,
  uncommon: 2.5,
  rare: 3.0,
  epic: 3.5,
  legendary: 3.5,
};
const DAMAGE_BY_RARITY: Record<import('../types').Rarity, number> = {
  common: 4,
  uncommon: 5,
  rare: 6,
  epic: 7,
  legendary: 9,
};
const INTERVAL_BY_RARITY: Record<import('../types').Rarity, number> = {
  common: 0.96,
  uncommon: 1.0,
  rare: 0.994,
  epic: 0.956,
  legendary: 0.945,
};

const damage = (rarity: import('../types').Rarity) => DAMAGE_BY_RARITY[rarity];
const interval = (rarity: import('../types').Rarity) => INTERVAL_BY_RARITY[rarity];
const critMult = (rarity: import('../types').Rarity) => CRIT_MULT_BY_RARITY[rarity];

const behavior: ItemBehavior = {
  name: 'Клевец',
  slots: ['hand_right'],
  type: 'weapon',
  baseValue: 10,
  tags: ['weapon', 'heavy', 'slow', 'crit'],
  attackInterval: interval,
  on: {
    attack_ready: (e, ctx) => {
      if (e.source.side !== 'hero' || e.source.slot !== ctx.slot || e.origin.from !== 'engine') {
        return {};
      }
      const base = damage(ctx.rarity);
      const isCrit = ctx.rng() < CRIT_CHANCE;
      const dmg = isCrit ? Math.round(base * critMult(ctx.rarity)) : base;
      return {
        replace: [],
        spawn: [{
          type: 'attack',
          source: e.source,
          target: e.target,
          amount: dmg,
          armorPierce: isCrit ? CRIT_ARMOR_PIERCE : undefined,
          origin: e.origin,
        }],
      };
    },
  },
  stats: (rarity) => [
    { text: `Урон: ${damage(rarity)}`, color: DMG_COLOR },
    { text: `Перезарядка: ${interval(rarity).toFixed(2)}s`, color: DMG_COLOR },
    { text: `Шанс крита: ${Math.round(CRIT_CHANCE * 100)}%`, color: DMG_COLOR },
    { text: `Множитель крита: ×${critMult(rarity)}, пробитие брони цели: ${Math.round(CRIT_ARMOR_PIERCE * 100)}%`, color: DMG_COLOR },
  ],
  baseDamage: damage,
};

export default behavior;
