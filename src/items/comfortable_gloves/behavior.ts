import type { ItemBehavior } from '../behavior';
import type { Rarity, SlotType } from '../types';

// Удобные перчатки: разово сокращают время до ПЕРВОГО тика hand_right в бою — применяется
// только при постройке таймеров (fight_start), дальше оружие тикает как обычно, эффект не
// повторяется на фазах одного и того же боя (см. WeaponTimerMod.firstTickRatio,
// buildWeaponTimers в src/combat/CombatEngine.ts). Плоская таблица по редкости, не scaleByRarity
// (см. docs/content.items.hand_left.md).
const FIRST_TICK_RATIO: Record<Rarity, number> = { common: 0.5, uncommon: 0.6, rare: 0.7, epic: 0.8, legendary: 0.8 };

const behavior: ItemBehavior = {
  weaponTimerMod: (rarity: Rarity, targetSlot: SlotType) => {
    if (targetSlot !== 'hand_right') return undefined;
    return { firstTickRatio: FIRST_TICK_RATIO[rarity] };
  },
  stats: (rarity) => [
    { text: `Первый удар боя быстрее: −${Math.round(FIRST_TICK_RATIO[rarity] * 100)}%`, color: '#44ddaa' },
  ],
};

export default behavior;
