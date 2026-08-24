import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';
import { DEFENSE_COLOR, PENALTY_COLOR } from '../statColors';
import { t } from '../../i18n/t';

// Тяжёлые латы: максимум защиты в семействе body ценой замедления всего надетого оружия — кросс-slot
// канал weapon_interval_mult без scope (та же idea, что раньше давал weaponTimerMod), участвует в
// каждом weaponTimer, не только hand_right.
const REDUCTION: Record<Rarity, number> = {
  common: 0.16,  //EHP +19
  uncommon: 0.22,  //EHP +28
  rare: 0.28,  //EHP +39
  epic: 0.33,  //EHP +50
  legendary: 0.40,  //EHP +65
};
const INTERVAL_PENALTY: Record<Rarity, number> = {
  common: 0.10,
  uncommon: 0.10,
  rare: 0.10,
  epic: 0.10,
  legendary: 0.10
};

const behavior: ItemBehavior = {
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
    { text: `${t('stat_defense')}: ${Math.round(REDUCTION[rarity] * 100)}%`, color: DEFENSE_COLOR },
    { text: `${t('stat_attack_speed')}: −${Math.round(INTERVAL_PENALTY[rarity] * 100)}%`, color: PENALTY_COLOR },
  ],
};

export default behavior;
