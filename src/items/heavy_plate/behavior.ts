import type { ItemBehavior } from '../behavior';
import type { Rarity, SlotType } from '../types';
import { mitigateDamage } from '../../combat/mitigation';

// Тяжёлые латы: максимум защиты в семействе body ценой замедления hand_right — кросс-slot
// weaponTimerMod с intervalMult > 1, тот же примитив, что у light_gloves (там < 1, здесь
// наоборот). Замыкает R7 (осознанный минус на топ-предмете body), см.
// docs/content.items.body.md.
const REDUCTION: Record<Rarity, number> = { common: 0.15, uncommon: 0.24, rare: 0.34, epic: 0.46, legendary: 0.6 };
const INTERVAL_PENALTY: Record<Rarity, number> = { common: 0.08, uncommon: 0.11, rare: 0.15, epic: 0.20, legendary: 0.20 };

const behavior: ItemBehavior = {
  name: 'Тяжёлые латы',
  slots: ['body'],
  type: 'armor',
  baseValue: 10,
  tags: ['armor', 'slow'],
  on: {
    damage: (e, ctx) => {
      if (e.target.side !== 'hero') return {};
      return { replace: [{ ...e, amount: mitigateDamage(e.amount, REDUCTION[ctx.rarity]) }] };
    },
  },
  weaponTimerMod: (rarity: Rarity, targetSlot: SlotType) => {
    if (targetSlot !== 'hand_right') return undefined;
    return { intervalMult: 1 + INTERVAL_PENALTY[rarity] };
  },
  stats: (rarity) => [
    { text: `Защита: ${Math.round(REDUCTION[rarity] * 100)}%`, color: '#44aaff' },
    { text: `Скорость атаки главного оружия: −${Math.round(INTERVAL_PENALTY[rarity] * 100)}%`, color: '#ff6666' },
  ],
};

export default behavior;
