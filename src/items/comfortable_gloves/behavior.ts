import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';
import { UTILITY_COLOR } from '../statColors';
import { t } from '../../i18n/t';

// Удобные перчатки: разово сокращают время до ПЕРВОГО тика hand_right в бою — канал
// weapon_first_tick_ratio (combine='max', см. src/combat/channels.ts), применяется только при
// постройке таймеров (buildWeaponTimers), дальше оружие тикает как обычно. Плоская таблица по
// редкости, не scaleByRarity (см. docs/content.items.hand_left.md).
const FIRST_TICK_RATIO: Record<Rarity, number> = { common: 0.5, uncommon: 0.6, rare: 0.7, epic: 0.8, legendary: 0.8 };

const behavior: ItemBehavior = {
  slots: ['hand_left'],
  type: 'gloves',
  tags: ['gloves'],
  channels: (rarity) => [{
    channel: 'weapon_first_tick_ratio',
    tier: 'flat',
    value: FIRST_TICK_RATIO[rarity],
    scope: { targetSlot: 'hand_right' },
  }],
  stats: (rarity) => [
    { text: t('stat_first_hit_faster', { pct: Math.round(FIRST_TICK_RATIO[rarity] * 100) }), color: UTILITY_COLOR },
  ],
};

export default behavior;
