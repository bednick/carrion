import gold from './gold.svg';
import essence from './essence.svg';
import essence_common from './essence_common.svg';
import essence_uncommon from './essence_uncommon.svg';
import essence_rare from './essence_rare.svg';
import essence_epic from './essence_epic.svg';
import essence_legendary from './essence_legendary.svg';
import type { EssenceTier, Rarity } from '../../items/types';

// Иконки нематериальных наград (золото/эссенция) для карточек гарант-драфта и HUD.
export const REWARD_ICON_URLS: Record<string, string> = {
  gold,
  essence,
  essence_common,
  essence_uncommon,
  essence_rare,
  essence_epic,
  essence_legendary,
};

export function rewardIconKey(id: string): string {
  return `reward_icon_${id}`;
}

// Ключ текстуры кристалла эссенции конкретного тира.
export function essenceIconKey(tier: EssenceTier): string {
  return rewardIconKey(`essence_${tier}`);
}

// Ключ текстуры кристалла эссенции по редкости (для UI-фильтров, включая common/legendary —
// у этих тиров нет реальной эссенции в экономике крафта, картинка чисто декоративная).
export function essenceIconKeyByRarity(rarity: Rarity): string {
  return rewardIconKey(`essence_${rarity}`);
}
