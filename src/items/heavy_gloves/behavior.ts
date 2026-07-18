import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';

// Тяжёлые перчатки: независимый крит-бросок поверх атаки hand_right — работает на ЛЮБОМ оружии,
// даже без своего крита (сами дают крит-шанс с нуля). Обычный `replace` на amount, тот же приём,
// что у брони (только повышает, не снижает). С war_pick — второй независимый бросок поверх
// первого, легитимный стак (см. docs/content.items.hand_left.md).
const CRIT_CHANCE: Record<Rarity, number> = { common: 0.05, uncommon: 0.10, rare: 0.15, epic: 0.20, legendary: 0.20 };
const CRIT_MULT = 1.5;

const behavior: ItemBehavior = {
  name: 'Тяжёлые перчатки',
  slots: ['hand_left'],
  type: 'gloves',
  tags: ['gloves', 'crit'],
  on: {
    attack: (e, ctx) => {
      if (e.source.side !== 'hero' || e.source.slot !== 'hand_right') return {};
      if (ctx.rng() >= CRIT_CHANCE[ctx.rarity]) return {};
      return { replace: [{ ...e, amount: Math.round(e.amount * CRIT_MULT) }] };
    },
  },
  stats: (rarity) => [
    { text: `Доп. крит-шанс: ${Math.round(CRIT_CHANCE[rarity] * 100)}%`, color: '#ffcc44' },
    { text: `Множитель крита: ×${CRIT_MULT}`, color: '#ffcc44' },
  ],
};

export default behavior;
