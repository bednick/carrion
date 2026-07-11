import type { ItemBehavior } from '../behavior';
import { scaleByRarity } from '../scaleByRarity';

// Баклер: малый шанс блока, но при блоке — контрудар по атаковавшему врагу.
const BLOCK = 0.15;
const COUNTER = 1;

const behavior: ItemBehavior = {
  on: {
    damage: (e, ctx) => {
      if (e.target.side !== 'hero') return {};
      if (ctx.rng() >= scaleByRarity(BLOCK, ctx.rarity, 1.0)) return {};
      return {
        replace: [],
        spawn: [{ type: 'block', source: e.source, target: e.target, prevented: e.amount, origin: e.origin }],
      };
    },
    block: (e, ctx) => {
      // Контрудар только по собственному блоку (origin = этот слот) и только если бил враг.
      if (e.origin.from !== 'item' || e.origin.slot !== ctx.slot || e.source.side !== 'enemy') return {};
      const dmg = Math.round(scaleByRarity(COUNTER, ctx.rarity, 1.5));
      return {
        spawn: [{ type: 'damage', source: { side: 'hero', slot: ctx.slot }, target: e.source, amount: dmg, origin: e.origin }],
      };
    },
  },
  stats: (rarity) => [
    { text: `Блок: ${Math.round(scaleByRarity(BLOCK, rarity, 1.0) * 100)}%`, color: '#44aaff' },
    { text: `Контрудар: ${Math.round(scaleByRarity(COUNTER, rarity, 1.5))}`, color: '#ff8844' },
  ],
};

export default behavior;
