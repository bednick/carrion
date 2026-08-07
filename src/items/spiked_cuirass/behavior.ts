import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';
import { DEFENSE_COLOR, REACTIVE_COLOR } from '../statColors';

// Шипастый нагрудник: броня ниже «чистой» (gleaming_plate).
const REDUCTION: Record<Rarity, number> = {
  common: 0.21,  //EHP 126
  uncommon: 0.26,  //EHP 135
  rare: 0.31,  //EHP 145
  epic: 0.37,  //EHP 159
  legendary: 0.43,  //EHP 177
};
const THORNS: Record<Rarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5,
};

// Шипы — единая стадия движка (CombatEngine.runReactiveStage): фикс. число за каждый удар,
// срабатывает независимо от того, что случилось с ударом на стадии блока/митигации — старый
// «второй хук on.block», ловивший блок ЧУЖОГО слота раньше по HANDLER_ORDER, больше не нужен
// (порядок слотов на исход не влияет, см. docs/combat-events.md).
const behavior: ItemBehavior = {
  name: 'Шипастый нагрудник',
  slots: ['body'],
  type: 'armor',
  tags: ['armor', 'thorns'],
  channels: (rarity) => [
    { channel: 'armor_pct', tier: 'more', value: 1 - REDUCTION[rarity] },
    { channel: 'thorns_flat', tier: 'flat', value: THORNS[rarity] },
  ],
  stats: (rarity) => [
    { text: `Защита: ${Math.round(REDUCTION[rarity] * 100)}%`, color: DEFENSE_COLOR },
    { text: `Шипы: ${THORNS[rarity]}`, color: REACTIVE_COLOR },
  ],
};

export default behavior;
