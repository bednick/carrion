import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';

// Латы отчаяния: защита включается только на грани смерти (HP героя < 30% от макс.) —
// реактивная форма снижения урона, порог фиксирован и не скейлится редкостью (кандидат,
// см. docs/content.items.body.md, «Открытые вопросы» №2 — не финализирован).
const HP_THRESHOLD = 0.3;
const REDUCTION: Record<Rarity, number> = { common: 3, uncommon: 5, rare: 7, epic: 10, legendary: 10 };

const behavior: ItemBehavior = {
  on: {
    damage: (e, ctx) => {
      if (e.target.side !== 'hero') return {};
      if (ctx.view.heroMaxHp <= 0 || ctx.view.heroHp / ctx.view.heroMaxHp >= HP_THRESHOLD) return {};
      const before = e.amount;
      const reduced = Math.max(0, before - REDUCTION[ctx.rarity]);
      const spawn = before > 0 && reduced === 0
        ? [{ type: 'block' as const, source: e.source, target: e.target, prevented: before, origin: e.origin }]
        : undefined;
      return { replace: [{ ...e, amount: reduced }], spawn };
    },
  },
  stats: (rarity) => [
    { text: `Защита при HP < ${Math.round(HP_THRESHOLD * 100)}%: ${REDUCTION[rarity]}`, color: '#44aaff' },
  ],
};

export default behavior;
