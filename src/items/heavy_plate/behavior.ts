import type { ItemBehavior } from '../behavior';
import type { Rarity, SlotType } from '../types';
import { mitigateDamage } from '../../combat/mitigation';

// Тяжёлые латы: максимум защиты в семействе body ценой замедления hand_right — кросс-slot
const REDUCTION: Record<Rarity, number> = {
  common: 0.31,  //EHP 145
  uncommon: 0.37,  //EHP 159
  rare: 0.43,  //EHP 177
  epic: 0.50,  //EHP 200
  legendary: 0.57,  //EHP 230
};
const INTERVAL_PENALTY: Record<Rarity, number> = {
  common: 0.30,
  uncommon: 0.30,
  rare: 0.30,
  epic: 0.30,
  legendary: 0.30
};

const behavior: ItemBehavior = {
  name: 'Тяжёлые латы',
  slots: ['body'],
  type: 'armor',
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
    { text: `Скорость атаки: −${Math.round(INTERVAL_PENALTY[rarity] * 100)}%`, color: '#ff6666' },
  ],
};

export default behavior;
