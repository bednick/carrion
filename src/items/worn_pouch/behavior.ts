import type { ItemBehavior } from '../behavior';

// Схрон убран — эффект временно мёртв (noop). Слот body_lower ждёт редизайна ролей
// (см. docs/content.items.md). Предмет убран из лут-пулов зон.
const behavior: ItemBehavior = {
  stats: () => [
    { text: 'Эффект в разработке', color: '#888888' },
  ],
};

export default behavior;
