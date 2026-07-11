import type { ItemBehavior } from '../behavior';
import { scaleByRarity } from '../scaleByRarity';

// Лечение за убийство: на событие kill спавнит heal герою (kill при этом продолжает применяться).
const behavior: ItemBehavior = {
  on: {
    kill: (e, ctx) => {
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
    { text: `Лечение за убийство: ${Math.round(scaleByRarity(1, rarity, 1.5))}`, color: '#44ff88' },
  ],
};

export default behavior;
