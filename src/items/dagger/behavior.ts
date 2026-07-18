import type { ItemBehavior } from '../behavior';
import { standardWeapon } from '../factories';

// Лёгкое: интервал подобран под DPS ×1.3 за уровень (анкор common = 4.0 DPS), урон фиксирован по тиру.
const behavior: ItemBehavior = {
  name: 'Кинжал',
  slots: ['hand_right', 'hand_left'],
  type: 'weapon',
  tags: ['weapon', 'light', 'fast'],
  ...standardWeapon({
    common: { damage: 2, interval: 0.5 },
    uncommon: { damage: 3, interval: 0.577 },
    rare: { damage: 3, interval: 0.444 },
    epic: { damage: 4, interval: 0.455 },
    legendary: { damage: 4, interval: 0.35 },
  }),
};

export default behavior;
