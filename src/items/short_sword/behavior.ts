import type { ItemBehavior } from '../behavior';
import { standardWeapon } from '../factories';

// Сбалансированное: интервал подобран под DPS ×1.3 за уровень (анкор common = 4.5 DPS), урон фиксирован по тиру.
const behavior: ItemBehavior = {
  name: 'Короткий меч',
  slots: ['hand_right'],
  type: 'weapon',
  tags: ['weapon', 'balanced'],
  ...standardWeapon({
    common: { damage: 4, interval: 0.889 },
    uncommon: { damage: 5, interval: 0.855 },
    rare: { damage: 6, interval: 0.789 },
    epic: { damage: 7, interval: 0.708 },
    legendary: { damage: 8, interval: 0.622 },
  }),
};

export default behavior;
