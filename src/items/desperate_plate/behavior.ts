import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';
import { DEFENSE_COLOR } from '../statColors';

// Латы отчаяния: защита включается только на грани смерти — динамический вклад в armor_pct
// (значение читается в момент резолюции урона, не при сборке героя): выше порога вклад нейтрален
// (множитель 1, «не участвует»), ниже порога — полная величина защиты.
const HP_THRESHOLD = 0.5;
const REDUCTION: Record<Rarity, number> = {
  common: 0.18,  //EHP 111 (50 + 61)
  uncommon: 0.27,  //EHP 118.5 (50 + 68.5)
  rare: 0.36,  //EHP 128.1 (50 + 78.1)
  epic: 0.43,  //EHP 137.7 (50 + 87.7)
  legendary: 0.50,  //EHP 150 (50 + 100)
};

const behavior: ItemBehavior = {
  name: 'Латы отчаяния',
  slots: ['body'],
  type: 'armor',
  tags: ['armor', 'last_stand'],
  channels: (rarity) => [{
    channel: 'armor_pct',
    tier: 'more',
    value: (view) => (view.heroMaxHp > 0 && view.heroHp / view.heroMaxHp < HP_THRESHOLD)
      ? 1 - REDUCTION[rarity]
      : 1,
  }],
  stats: (rarity) => [
    { text: `Защита при HP < ${Math.round(HP_THRESHOLD * 100)}%: ${Math.round(REDUCTION[rarity] * 100)}%`, color: DEFENSE_COLOR },
  ],
};

export default behavior;
