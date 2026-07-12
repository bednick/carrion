import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';

// Чистая защита: только block_chance, без риддера — самый высокий голый блок в семье
// (docs/content.items.hand_left.md, узел «реакция на удар»). Плоский скейл +5пп за редкость —
// раньше `standardShield` со scale:1.0 давал нулевой рост (см. «Открытые вопросы» №1, решено).
const BLOCK_CHANCE: Record<Rarity, number> = { common: 0.25, uncommon: 0.30, rare: 0.35, epic: 0.40, legendary: 0.40 };

const behavior: ItemBehavior = {
  on: {
    damage: (e, ctx) => {
      if (e.target.side !== 'hero') return {};
      if (ctx.rng() >= BLOCK_CHANCE[ctx.rarity]) return {};
      return {
        replace: [],
        spawn: [{ type: 'block', source: e.source, target: e.target, prevented: e.amount, origin: e.origin }],
      };
    },
  },
  stats: (rarity) => [
    { text: `Блок: ${Math.round(BLOCK_CHANCE[rarity] * 100)}%`, color: '#44aaff' },
  ],
};

export default behavior;
