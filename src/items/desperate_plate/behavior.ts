import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';
import { mitigateDamage } from '../../combat/mitigation';

// Латы отчаяния: защита включается только на грани смерти (HP героя < 30% от макс.) —
// реактивная форма снижения урона, порог фиксирован и не скейлится редкостью (кандидат,
// см. docs/content.items.body.md, «Открытые вопросы» №2 — не финализирован).
const HP_THRESHOLD = 0.3;
const REDUCTION: Record<Rarity, number> = { common: 0.18, uncommon: 0.27, rare: 0.37, epic: 0.48, legendary: 0.6 };

const behavior: ItemBehavior = {
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
