import type { ItemBehavior } from '../behavior';
import { scaleByRarity } from '../scaleByRarity';

// Лайфстил за удар: на каждый нанесённый героем урон лечит немного.
// С быстрым оружием срабатывает чаще — эмерджентная синергия on_hit × fast.
const behavior: ItemBehavior = {
  on: {
    damage: (e, ctx) => {
      if (e.source.side !== 'hero' || e.target.side !== 'enemy' || e.amount <= 0) return {};
      const heal = Math.round(scaleByRarity(1, ctx.rarity, 1.5));
      return {
        spawn: [{
          type: 'heal',
          source: { side: 'hero', slot: ctx.slot },
          target: { side: 'hero' },
          amount: heal,
          origin: e.origin,
        }],
      };
    },
  },
  stats: (rarity) => [
    { text: `Лечение за удар: ${Math.round(scaleByRarity(1, rarity, 1.5))}`, color: '#44ff88' },
  ],
};

export default behavior;
