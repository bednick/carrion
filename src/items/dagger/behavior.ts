import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';
import { WEAPON_COLOR } from '../statColors';

// Лёгкое: интервал подобран под DPS ×1.3 за уровень (анкор common = 4.0 DPS), урон фиксирован по
// тиру. В hand_left (офф-хенд) кинжал вдвое медленнее — вклад в канал `weapon_interval_mult`
// со scope на hand_left, но ТОЛЬКО когда сам этот экземпляр реально лежит в hand_left (`channels()`
// получает актуальный слот — см. ItemBehavior.channels в behavior.ts). Иначе кинжал в hand_right
// замедлял бы ЛЮБОЕ другое оружие, оказавшееся в hand_left, что бессмысленно и неверно.
// Тултип получает актуальный слот от Tooltip.showItem (undefined в рюкзаке/сундуке → hand_right-числа).
const DAMAGE_BY_RARITY: Record<Rarity, number> = {
  common: 2,
  uncommon: 3,
  rare: 3,
  epic: 4,
  legendary: 4,
};
const INTERVAL_BY_RARITY: Record<Rarity, number> = {
  common: 0.5,
  uncommon: 0.577,
  rare: 0.444,
  epic: 0.455,
  legendary: 0.35,
};

const damage = (rarity: Rarity) => DAMAGE_BY_RARITY[rarity];
const interval = (rarity: Rarity) => INTERVAL_BY_RARITY[rarity];

const OFFHAND_INTERVAL_MULT = 2;

const behavior: ItemBehavior = {
  name: 'Кинжал',
  slots: ['hand_right', 'hand_left'],
  type: 'weapon',
  tags: ['weapon', 'light', 'fast'],
  weapon: (rarity) => ({ interval: interval(rarity), baseDamage: damage(rarity), shape: 'single' }),
  channels: (_rarity, slot) => slot === 'hand_left'
    ? [{
        channel: 'weapon_interval_mult',
        tier: 'more',
        value: OFFHAND_INTERVAL_MULT,
        scope: { targetSlot: 'hand_left' },
      }]
    : [],
  stats: (rarity, slot) => {
    const effInterval = interval(rarity) * (slot === 'hand_left' ? OFFHAND_INTERVAL_MULT : 1);
    return [
      { text: `Урон: ${damage(rarity)}`, color: WEAPON_COLOR },
      { text: `Перезарядка: ${effInterval.toFixed(1)}`, color: WEAPON_COLOR },
    ];
  },
};

export default behavior;
