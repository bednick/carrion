import type { ItemBehavior } from '../behavior';

const DMG_COLOR = '#ffcc44';

// Мультихит: один клинок, два честных укола за взмах — оба в ту же цель. Каждый — свой `damage`,
// лайфстил прокает дважды. damage — фиксированная таблица по тиру (2/3/4/5/6), interval подогнан
// так, чтобы суммарный DPS двух ударов (`2·damage/interval`) рос ×1.3 за уровень редкости от
// анкора common (4.5), см. src/items/factories.ts (standardWeapon) для того же приёма.
const DAMAGE_BY_RARITY: Record<import('../types').Rarity, number> = {
  common: 2,
  uncommon: 3,
  rare: 4,
  epic: 5,
  legendary: 6,
};
const INTERVAL_BY_RARITY: Record<import('../types').Rarity, number> = {
  common: 0.889,
  uncommon: 1.026,
  rare: 1.052,
  epic: 1.011,
  legendary: 0.934,
};

const damage = (rarity: import('../types').Rarity) => DAMAGE_BY_RARITY[rarity];
const interval = (rarity: import('../types').Rarity) => INTERVAL_BY_RARITY[rarity];

const behavior: ItemBehavior = {
  name: 'Рапира',
  slots: ['hand_right'],
  type: 'weapon',
  tags: ['weapon', 'light', 'fast', 'multihit'],
  attackInterval: interval,
  on: {
    attack_ready: (e, ctx) => {
      if (e.source.side !== 'hero' || e.source.slot !== ctx.slot || e.origin.from !== 'engine') {
        return {};
      }
      const dmg = damage(ctx.rarity);
      return {
        replace: [],
        spawn: [
          { type: 'attack', source: e.source, target: e.target, amount: dmg, origin: e.origin },
          { type: 'attack', source: e.source, target: e.target, amount: dmg, origin: e.origin },
        ],
      };
    },
  },
  stats: (rarity) => [
    { text: `Урон: ${damage(rarity)}`, color: DMG_COLOR },
    { text: `Перезарядка: ${interval(rarity).toFixed(2)}s`, color: DMG_COLOR },
    { text: `Наносит два удара за одну атаку`, color: DMG_COLOR },
  ],
  baseDamage: damage,
};

export default behavior;
