import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';
import { HEAL_COLOR } from '../statColors';

// Лечение за убийство: доля от maxHp убитого врага (не героя) — общая стадия движка
// (CombatEngine.handleDamage) читает канал lifesteal_on_kill_pct в момент, когда враг умирает,
// с maxHp из того же снимка боя, что использовался для резолюции этого удара (maxHp не меняется
// по ходу боя, так что это эквивалентно чтению из состояния). legendary не крафтится — повторяет
// epic (см. docs/content.items.amulet.md).
const HEAL_PERCENT: Record<Rarity, number> = { common: 0.10, uncommon: 0.15, rare: 0.20, epic: 0.25, legendary: 0.25 };

const behavior: ItemBehavior = {
  name: 'Амулет грифа',
  slots: ['amulet'],
  type: 'accessory',
  tags: ['accessory', 'on_kill', 'lifesteal'],
  channels: (rarity) => [{ channel: 'lifesteal_on_kill_pct', tier: 'flat', value: HEAL_PERCENT[rarity] }],
  stats: (rarity) => [
    { text: `Лечение за убийство: ${Math.round(HEAL_PERCENT[rarity] * 100)}% от макс. HP врага`, color: HEAL_COLOR },
  ],
};

export default behavior;
