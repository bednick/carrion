import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';
import { mitigateDamage } from '../../combat/mitigation';

// Латы отчаяния: защита включается только на грани смерти
const HP_THRESHOLD = 0.5;
const REDUCTION: Record<Rarity, number> = {
  common: 0.41,  //EHP 135 (50 + 85)
  uncommon: 0.48,  //EHP 145 (50 + 95)
  rare: 0.54,  //EHP 159 (50 + 109)
  epic: 0.60,  //EHP 177 (50 + 127)
  legendary: 0.67,  //EHP 200 (50 + 150)
};

const behavior: ItemBehavior = {
  name: 'Латы отчаяния',
  slots: ['body'],
  type: 'armor',
  tags: ['armor', 'last_stand'],
  on: {
    damage: (e, ctx) => {
      if (e.target.side !== 'hero') return {};
      if (ctx.view.heroMaxHp <= 0 || ctx.view.heroHp / ctx.view.heroMaxHp >= HP_THRESHOLD) return {};
      return { replace: [{ ...e, amount: mitigateDamage(e.amount, REDUCTION[ctx.rarity]) }] };
    },
  },
  stats: (rarity) => [
    { text: `Защита при HP < ${Math.round(HP_THRESHOLD * 100)}%: ${Math.round(REDUCTION[rarity] * 100)}%`, color: '#44aaff' },
  ],
};

export default behavior;
