import type { ItemBehavior } from '../behavior';
import { standardWeapon } from '../factories';

// Тяжёлое: урон растёт с редкостью, интервал подобран под DPS ×1.3 за уровень (анкор common ≈ 5.498 DPS).
const behavior: ItemBehavior = {
  name: 'Боевой посох',
  slots: ['hand_right'],
  type: 'weapon',
  baseValue: 10,
  tags: ['weapon', 'heavy', 'slow'],
  ...standardWeapon({
    common: { damage: 8, interval: 1.455 },
    uncommon: { damage: 10, interval: 1.399 },
    rare: { damage: 13, interval: 1.399 },
    epic: { damage: 16, interval: 1.325 },
    legendary: { damage: 20, interval: 1.274 },
  }),
};

export default behavior;
