import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';
import { standardArmor } from '../factories';

// Чистая броня: верхняя/нижняя планка оси «форма снижения урона» (docs/content.items.body.md).
const REDUCTION: Record<Rarity, number> = {
  common: 0.10,  //EHP +11.1
  uncommon: 0.16,  //EHP +19
  rare: 0.22,  //EHP +28
  epic: 0.28,  //EHP +39
  legendary: 0.33,  //EHP +50
};

const behavior: ItemBehavior = {
  name: 'Блестящие латы',
  slots: ['body'],
  type: 'armor',
  tags: ['armor'],
  ...standardArmor({ pct: REDUCTION }),
};

export default behavior;
