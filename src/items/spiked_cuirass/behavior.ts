import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';

// Шипастый нагрудник: броня ниже «чистой» (gleaming_plate), плюс безусловный rider
// thorns_ratio на долю урона, дошедшего до героя ПОСЛЕ снижения — тот же приём, что у
// spiked_shield (hand_left), см. docs/content.items.body.md.
const REDUCTION: Record<Rarity, number> = { common: 1, uncommon: 2, rare: 2, epic: 3, legendary: 3 };
const THORNS_RATIO: Record<Rarity, number> = { common: 0.08, uncommon: 0.11, rare: 0.14, epic: 0.18, legendary: 0.18 };

const behavior: ItemBehavior = {
  on: {
    damage: (e, ctx) => {
      if (e.target.side !== 'hero') return {};
      const before = e.amount;
      const reduced = Math.max(0, before - REDUCTION[ctx.rarity]);
      if (before > 0 && reduced === 0) {
        return {
          replace: [{ ...e, amount: 0 }],
          spawn: [{ type: 'block', source: e.source, target: e.target, prevented: before, origin: e.origin }],
        };
      }
      const reflected = Math.round(reduced * THORNS_RATIO[ctx.rarity]);
      if (reflected <= 0) return { replace: [{ ...e, amount: reduced }] };
      return {
        replace: [{ ...e, amount: reduced }],
        spawn: [{
          type: 'damage',
          source: { side: 'hero', slot: ctx.slot },
          target: e.source,
          amount: reflected,
          origin: e.origin,
        }],
      };
    },
  },
  stats: (rarity) => [
    { text: `Защита: ${REDUCTION[rarity]}`, color: '#44aaff' },
    { text: `Шипы: ${Math.round(THORNS_RATIO[rarity] * 100)}% урона назад`, color: '#ff8844' },
  ],
};

export default behavior;
