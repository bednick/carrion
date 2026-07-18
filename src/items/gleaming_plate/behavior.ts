import type { ItemBehavior } from '../behavior';
import { standardArmor } from '../factories';

// Чистая броня: верхняя/нижняя планка оси «форма снижения урона» (docs/content.items.body.md).
// scale по умолчанию (1.5), cap по умолчанию (60%) даёт ряд ~10/15/23/34/51% по редкости.
const behavior: ItemBehavior = {
  name: 'Блестящие латы',
  slots: ['body'],
  type: 'armor',
  tags: ['armor'],
  ...standardArmor({ pct: 0.1 }),
};

export default behavior;
