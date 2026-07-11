import type { ItemBehavior } from '../behavior';
import { scaleByRarity } from '../scaleByRarity';

// Magic find: повышает шанс улучшить редкость найденных предметов (домен головы — «добыча»).
const behavior: ItemBehavior = {
  meta: (rarity) => ({ magicFind: scaleByRarity(0.2, rarity, 1.5) }),
  stats: (rarity) => [
    { text: `Качество добычи: +${Math.round(scaleByRarity(0.2, rarity, 1.25) * 100)}%`, color: '#ffcc44' },
  ],
};

export default behavior;
