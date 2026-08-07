import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';
import { DEFENSE_COLOR, REACTIVE_COLOR } from '../statColors';

const BLOCK_CHANCE: Record<Rarity, number> = {
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

// Блок и шипы независимы — оба просто каналы, резолвятся отдельными стадиями движка
// (resolution.ts:resolveDefense для блока, CombatEngine.runReactiveStage для шипов). Шипы
// безусловны (без броска), фикс. число за каждый удар и срабатывают даже на заблокированный удар
// — движок сам гарантирует это одной стадией, без нужды во втором хуке «поймать блок другого
// слота», как было раньше (docs/combat-events.md).
const behavior: ItemBehavior = {
  name: 'Шипастый щит',
  slots: ['hand_left'],
  type: 'shield',
  tags: ['shield', 'thorns', 'block'],
  channels: (rarity) => [
    { channel: 'block_chance', tier: 'flat', value: BLOCK_CHANCE[rarity] },
    { channel: 'thorns_flat', tier: 'flat', value: THORNS[rarity] },
  ],
  stats: (rarity) => [
    { text: `Блок: ${Math.round(BLOCK_CHANCE[rarity] * 100)}%`, color: DEFENSE_COLOR },
    { text: `Шипы: ${THORNS[rarity]}`, color: REACTIVE_COLOR },
  ],
};

export default behavior;
