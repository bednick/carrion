import type { ItemBehavior } from '../behavior';

const DMG_COLOR = '#ffcc44';

// Крит: профильный стат — множитель крита (растёт с редкостью), шанс крита фиксирован (R5 — ровно
// один профильный стат). Крит несёт rider `armorPierce` — снимает 3 очка брони цели на этот удар
// (броня мобов числовая, см. docs/mechanics.md §«Броня vs щит»). 3 — весь потолок брони Мародёров
// в зонах, где `war_pick` является якорем, то есть крит по факту проходит мимо брони целиком;
// против более бронированных целей он её вычитает, а не обнуляет. Пробитие — часть анти-Мародёры
// идентичности клевца (R6), см. docs/content.items.hand_right.md.
//
// damage/interval — явная таблица по редкости (не формула-скейл): средний DPS с учётом крита
// (`damage · (1 - crit_chance + crit_chance · crit_mult) / interval`) растёт ×1.3 за уровень редкости
// от анкора common (5.0). damage подобран под целые числа, interval — остаточная подгонка точности.
const CRIT_CHANCE = 0.2;
const CRIT_ARMOR_PIERCE = 2;
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
          crit: isCrit || undefined,
          origin: e.origin,
        }],
      };
    },
  },
  stats: (rarity) => [
    { text: `Урон: ${damage(rarity)}`, color: DMG_COLOR },
    { text: `Перезарядка: ${interval(rarity).toFixed(2)}s`, color: DMG_COLOR },
    { text: `Шанс крита: ${Math.round(CRIT_CHANCE * 100)}%`, color: DMG_COLOR },
    { text: `Множитель крита: ×${critMult(rarity)}, пробитие брони: ${CRIT_ARMOR_PIERCE}`, color: DMG_COLOR },
  ],
  baseDamage: damage,
};

export default behavior;
