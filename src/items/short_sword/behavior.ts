import type { ItemBehavior } from '../behavior';
import { standardWeapon } from '../factories';

// Сбалансированное: интервал подобран под DPS ×1.3 за уровень (анкор common = 4.0 DPS), урон фиксирован по тиру.
const behavior: ItemBehavior = {
  slots: ['hand_right'],
  type: 'weapon',
  tags: ['weapon', 'balanced'],
  ...standardWeapon({
    common: { damage: 4, interval: 1.0 },
    uncommon: { damage: 5, interval: 0.962 },
    rare: { damage: 6, interval: 0.888 },
    epic: { damage: 7, interval: 0.797 },
    legendary: { damage: 8, interval: 0.7 },
  }),
};

export default behavior;
