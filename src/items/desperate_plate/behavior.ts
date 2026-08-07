import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';
import { DEFENSE_COLOR } from '../statColors';

// Латы отчаяния: защита включается только на грани смерти — динамический вклад в armor_pct
// (значение читается в момент резолюции урона, не при сборке героя): выше порога вклад нейтрален
// (множитель 1, «не участвует»), ниже порога — полная величина защиты.
const HP_THRESHOLD = 0.5;
const REDUCTION: Record<Rarity, number> = {
  common: 0.41,  //EHP 135 (50 + 85)
  uncommon: 0.48,  //EHP 145 (50 + 95)
  rare: 0.54,  //EHP 159 (50 + 109)
  epic: 0.60,  //EHP 177 (50 + 127)
  legendary: 0.67,  //EHP 200 (50 + 150)
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
