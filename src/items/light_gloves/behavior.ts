import type { ItemBehavior } from '../behavior';
import type { Rarity, SlotType } from '../types';

// Лёгкие перчатки: сокращают attackInterval hand_right на каждый тик, весь бой — кросс-slot
// модификатор таймера (см. WeaponTimerMod в src/items/behavior.ts, применяется в
// buildWeaponTimers, src/combat/CombatEngine.ts). Плоская таблица по редкости, не scaleByRarity
// (см. docs/content.items.hand_left.md).
const INTERVAL_REDUCTION: Record<Rarity, number> = { common: 0.05, uncommon: 0.07, rare: 0.10, epic: 0.15, legendary: 0.15 };

const behavior: ItemBehavior = {
  name: 'Лёгкие перчатки',
  slots: ['hand_left'],
  type: 'gloves',
  baseValue: 10,
  tags: ['gloves', 'fast'],
  weaponTimerMod: (rarity: Rarity, targetSlot: SlotType) => {
    if (targetSlot !== 'hand_right') return undefined;
    return { intervalMult: 1 - INTERVAL_REDUCTION[rarity] };
  },
  stats: (rarity) => [
    { text: `Скорость атаки главного оружия: +${Math.round(INTERVAL_REDUCTION[rarity] * 100)}%`, color: '#44ddaa' },
  ],
};

export default behavior;
