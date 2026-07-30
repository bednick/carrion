import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';
import { standardArmor } from '../factories';

// Чистая броня: верхняя/нижняя планка оси «форма снижения урона» (docs/content.items.body.md).
const REDUCTION: Record<Rarity, number> = {
  common: 0.26,  //EHP 135
  uncommon: 0.31,  //EHP 145
  rare: 0.37,  //EHP 159
  epic: 0.43,  //EHP 177
  legendary: 0.50,  //EHP 200
};

const behavior: ItemBehavior = {
  name: 'Блестящие латы',
  slots: ['body'],
  type: 'armor',
  tags: ['armor'],
  ...standardArmor({ pct: REDUCTION }),
};

export default behavior;
