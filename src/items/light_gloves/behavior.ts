import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';
import { UTILITY_COLOR } from '../statColors';
import { t } from '../../i18n/t';

// Лёгкие перчатки: сокращают интервал всего надетого оружия весь бой — кросс-slot канал
// weapon_interval_mult без scope (тир 'more' — независимый множитель, см. src/combat/channels.ts,
// без scope контрибуция участвует в каждом weaponTimer, не только hand_right). Плоская таблица по
// редкости, не scaleByRarity (см. docs/content.items.hand_left.md).
const INTERVAL_REDUCTION: Record<Rarity, number> = { common: 0.05, uncommon: 0.07, rare: 0.10, epic: 0.15, legendary: 0.15 };

const behavior: ItemBehavior = {
  slots: ['hand_left'],
  type: 'gloves',
  tags: ['gloves', 'fast'],
  channels: (rarity) => [{
    channel: 'weapon_interval_mult',
    tier: 'more',
    value: 1 - INTERVAL_REDUCTION[rarity],
  }],
  stats: (rarity) => [
    { text: `${t('stat_attack_speed')}: +${Math.round(INTERVAL_REDUCTION[rarity] * 100)}%`, color: UTILITY_COLOR },
  ],
};

export default behavior;
