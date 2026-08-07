import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';
import { CRIT_COLOR } from '../statColors';

// Тяжёлые перчатки: доп. вклад в общий крит-канал движка (не свой собственный бросок) — работает
// на ЛЮБОМ оружии hand_right, даже без своего крита (сами дают крит-шанс с нуля). С war_pick
// бонусы складываются НАД базой в одном агрегированном канале (один бросок на удар, не два
// независимых — см. docs/content.items.hand_left.md, консолидация крита в docs/combat-events.md).
const CRIT_CHANCE: Record<Rarity, number> = {
  common: 0.05,
  uncommon: 0.10,
  rare: 0.15,
  epic: 0.20,
  legendary: 0.25
};
const CRIT_MULT = 2;

const behavior: ItemBehavior = {
  name: 'Тяжёлые перчатки',
  slots: ['hand_left'],
  type: 'gloves',
  tags: ['gloves', 'crit'],
  channels: (rarity) => [
    { channel: 'crit_chance', tier: 'flat', value: CRIT_CHANCE[rarity] },
    { channel: 'crit_mult', tier: 'flat', value: CRIT_MULT - 1 },
  ],
  stats: (rarity) => [
    { text: `Доп. крит-шанс: ${Math.round(CRIT_CHANCE[rarity] * 100)}%`, color: CRIT_COLOR },
    { text: `Множитель крита: ×${CRIT_MULT}`, color: CRIT_COLOR },
  ],
};

export default behavior;
