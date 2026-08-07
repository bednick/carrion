import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';
import { DEFENSE_COLOR, PENALTY_COLOR } from '../statColors';

// Тяжёлые латы: максимум защиты в семействе body ценой замедления всего надетого оружия — кросс-slot
// канал weapon_interval_mult без scope (та же idea, что раньше давал weaponTimerMod), участвует в
// каждом weaponTimer, не только hand_right.
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
  channels: (rarity) => [
    { channel: 'armor_pct', tier: 'more', value: 1 - REDUCTION[rarity] },
    {
      channel: 'weapon_interval_mult',
      tier: 'more',
      value: 1 + INTERVAL_PENALTY[rarity],
    },
  ],
  stats: (rarity) => [
    { text: `Защита: ${Math.round(REDUCTION[rarity] * 100)}%`, color: DEFENSE_COLOR },
    { text: `Скорость атаки: −${Math.round(INTERVAL_PENALTY[rarity] * 100)}%`, color: PENALTY_COLOR },
  ],
};

export default behavior;
