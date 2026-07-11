import gold from './gold.svg';
import essence from './essence.svg';
import essence_uncommon from './essence_uncommon.svg';
import essence_rare from './essence_rare.svg';
import essence_epic from './essence_epic.svg';
import type { EssenceTier } from '../../items/types';

// Иконки нематериальных наград (золото/эссенция) для карточек гарант-драфта и HUD.
export const REWARD_ICON_URLS: Record<string, string> = {
  gold,
  essence,
  essence_uncommon,
  essence_rare,
  essence_epic,
};

export function rewardIconKey(id: string): string {
  return `reward_icon_${id}`;
}

// Ключ текстуры кристалла эссенции конкретного тира.
export function essenceIconKey(tier: EssenceTier): string {
  return rewardIconKey(`essence_${tier}`);
}
