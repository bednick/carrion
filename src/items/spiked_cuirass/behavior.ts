import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';
import { mitigateDamage } from '../../combat/mitigation';

// Шипастый нагрудник: броня ниже «чистой» (gleaming_plate), плюс безусловный rider
// thorns_ratio на долю урона, дошедшего до героя ПОСЛЕ снижения — тот же приём, что у
// spiked_shield (hand_left), см. docs/content.items.body.md.
const REDUCTION: Record<Rarity, number> = { common: 0.20, uncommon: 0.20, rare: 0.25, epic: 0.30, legendary: 0.30 };
const THORNS_RATIO: Record<Rarity, number> = { common: 0.20, uncommon: 0.25, rare: 0.25, epic: 0.30, legendary: 0.30 };

const behavior: ItemBehavior = {
  name: 'Шипастый нагрудник',
  slots: ['body'],
  type: 'armor',
  tags: ['armor', 'thorns'],
  on: {
    damage: (e, ctx) => {
      if (e.target.side !== 'hero') return {};
      const reduced = mitigateDamage(e.amount, REDUCTION[ctx.rarity]);
      // Урон, порождённый чужими шипами (моба), сами шипы не отражают — иначе шипы моба и героя
      // отражают друг друга по кругу до предохранителя каскада.
      if (e.thorns) return { replace: [{ ...e, amount: reduced }] };
      const reflected = Math.round(reduced * THORNS_RATIO[ctx.rarity]);
      if (reflected <= 0) return { replace: [{ ...e, amount: reduced }] };
      return {
        replace: [{ ...e, amount: reduced }],
        spawn: [{
          type: 'damage',
          source: { side: 'hero', slot: ctx.slot },
          target: e.source,
          amount: reflected,
          thorns: true,
          origin: e.origin,
        }],
      };
    },
  },
  stats: (rarity) => [
    { text: `Защита: ${Math.round(REDUCTION[rarity] * 100)}%`, color: '#44aaff' },
    { text: `Шипы: ${Math.round(THORNS_RATIO[rarity] * 100)}% урона назад`, color: '#ff8844' },
  ],
};

export default behavior;
