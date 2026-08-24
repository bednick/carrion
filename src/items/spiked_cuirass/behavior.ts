import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';
import { DEFENSE_COLOR, REACTIVE_COLOR } from '../statColors';
import { t } from '../../i18n/t';

// Шипастый нагрудник: броня ниже «чистой» (gleaming_plate).
const REDUCTION: Record<Rarity, number> = {
  common: 0.05,
  uncommon: 0.10,  //EHP +11.1
  rare: 0.16,  //EHP +19
  epic: 0.22,  //EHP +28
  legendary: 0.28,  //EHP +39
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
  slots: ['body'],
  type: 'armor',
  tags: ['armor', 'thorns'],
  channels: (rarity) => [
    { channel: 'armor_pct', tier: 'more', value: 1 - REDUCTION[rarity] },
    { channel: 'thorns_flat', tier: 'flat', value: THORNS[rarity] },
  ],
  stats: (rarity) => [
    { text: `${t('stat_defense')}: ${Math.round(REDUCTION[rarity] * 100)}%`, color: DEFENSE_COLOR },
    { text: `${t('stat_thorns')}: ${THORNS[rarity]}`, color: REACTIVE_COLOR },
  ],
};

export default behavior;
