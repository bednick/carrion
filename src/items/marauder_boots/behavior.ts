import type { ItemBehavior } from '../behavior';

// Побег убран — эффект временно мёртв (noop). По новому домену legs предмет
// становится «мародёром редкости» (см. docs/content.items.legs.md). Убран из лут-пулов зон.
const behavior: ItemBehavior = {
  stats: () => [
    { text: 'Эффект в разработке', color: '#888888' },
  ],
};

export default behavior;
