import type { ItemBehavior } from '../behavior';
import { scaleByRarity } from '../scaleByRarity';

// Шипы: получив урон от врага, наносим ему ответный (урон по герою при этом применяется как обычно).
const THORNS = 1;

const behavior: ItemBehavior = {
  on: {
    damage: (e, ctx) => {
      if (e.target.side !== 'hero' || e.source.side !== 'enemy' || e.amount <= 0) return {};
      const dmg = Math.round(scaleByRarity(THORNS, ctx.rarity, 1.5));
      return {
        spawn: [{ type: 'damage', source: { side: 'hero', slot: ctx.slot }, target: e.source, amount: dmg, origin: e.origin }],
      };
    },
  },
  stats: (rarity) => [
    { text: `Шипы: ${Math.round(scaleByRarity(THORNS, rarity, 1.5))}`, color: '#ff8844' },
  ],
};

export default behavior;
