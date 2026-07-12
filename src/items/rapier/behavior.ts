import type { ItemBehavior } from '../behavior';
import { scaleByRarity } from '../scaleByRarity';

const DMG_COLOR = '#ffcc44';

// Мультихит: один клинок, два честных укола за взмах — оба в ту же цель. Каждый — свой `damage`,
// лайфстил прокает дважды. Профиль — урон удара и темп (оба скейлятся, как у standardWeapon).
const damage = (rarity: import('../types').Rarity) => Math.round(scaleByRarity(2, rarity, 1.3));
const interval = (rarity: import('../types').Rarity) => scaleByRarity(0.8, rarity, 0.9);

const behavior: ItemBehavior = {
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
