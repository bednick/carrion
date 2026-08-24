import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';
import { DEFENSE_COLOR } from '../statColors';
import { t } from '../../i18n/t';

// Чистая защита: только block_chance, без риддера — самый высокий голый блок в семье.
const BLOCK_CHANCE: Record<Rarity, number> = {
  common: 0.08,
  uncommon: 0.12,
  rare: 0.16,
  epic: 0.20,
  legendary: 0.25,
};

const behavior: ItemBehavior = {
  slots: ['hand_left'],
  type: 'shield',
  tags: ['shield', 'block'],
  channels: (rarity) => [{ channel: 'block_chance', tier: 'flat', value: BLOCK_CHANCE[rarity] }],
  stats: (rarity) => [
    { text: `${t('stat_block')}: ${Math.round(BLOCK_CHANCE[rarity] * 100)}%`, color: DEFENSE_COLOR },
  ],
};

export default behavior;
