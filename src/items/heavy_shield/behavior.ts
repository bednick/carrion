import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';

// Чистая защита: только block_chance, без риддера — самый высокий голый блок в семье
const BLOCK_CHANCE: Record<Rarity, number> = {
  common: 0.26,  //EHP 135
  uncommon: 0.31,  //EHP 145
  rare: 0.37,  //EHP 159
  epic: 0.43,  //EHP 177
  legendary: 0.50,  //EHP 200
};

const behavior: ItemBehavior = {
  name: 'Тяжёлый щит',
  slots: ['hand_left'],
  type: 'shield',
  tags: ['shield', 'block'],
  on: {
    damage: (e, ctx) => {
      if (e.target.side !== 'hero') return {};
      if (ctx.rng() >= BLOCK_CHANCE[ctx.rarity]) return {};
      return {
        replace: [],
        spawn: [{ type: 'block', source: e.source, target: e.target, prevented: e.amount, thorns: e.thorns, origin: e.origin }],
      };
    },
  },
  stats: (rarity) => [
    { text: `Блок: ${Math.round(BLOCK_CHANCE[rarity] * 100)}%`, color: '#44aaff' },
  ],
};

export default behavior;
