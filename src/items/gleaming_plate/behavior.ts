import { standardArmor } from '../factories';

// Чистая броня: верхняя/нижняя планка оси «форма снижения урона» (docs/content.items.body.md).
// scale по умолчанию (1.5) даёт ряд 2/3/5/7 по редкости.
export default standardArmor({ reduction: 2 });
