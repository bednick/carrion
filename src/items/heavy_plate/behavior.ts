import type { ItemBehavior } from '../behavior';
import type { Rarity, SlotType } from '../types';

// Тяжёлые латы: максимум защиты в семействе body ценой замедления hand_right — кросс-slot
// weaponTimerMod с intervalMult > 1, тот же примитив, что у light_gloves (там < 1, здесь
// наоборот). Замыкает R7 (осознанный минус на топ-предмете body), см.
// docs/content.items.body.md.
const REDUCTION: Record<Rarity, number> = { common: 3, uncommon: 5, rare: 7, epic: 10, legendary: 10 };
const INTERVAL_PENALTY: Record<Rarity, number> = { common: 0.08, uncommon: 0.11, rare: 0.15, epic: 0.20, legendary: 0.20 };

const behavior: ItemBehavior = {
  on: {
    damage: (e, ctx) => {
      if (e.target.side !== 'hero') return {};
      const before = e.amount;
      const reduced = Math.max(0, before - REDUCTION[ctx.rarity]);
      const spawn = before > 0 && reduced === 0
        ? [{ type: 'block' as const, source: e.source, target: e.target, prevented: before, origin: e.origin }]
        : undefined;
      return { replace: [{ ...e, amount: reduced }], spawn };
    },
  },
  weaponTimerMod: (rarity: Rarity, targetSlot: SlotType) => {
    if (targetSlot !== 'hand_right') return undefined;
    return { intervalMult: 1 + INTERVAL_PENALTY[rarity] };
  },
  stats: (rarity) => [
    { text: `Защита: ${REDUCTION[rarity]}`, color: '#44aaff' },
    { text: `Скорость атаки главного оружия: −${Math.round(INTERVAL_PENALTY[rarity] * 100)}%`, color: '#ff6666' },
  ],
};

export default behavior;
