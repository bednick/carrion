import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';

// Неуязвимость: N ударов без урона, выдаётся заново на каждый бой (CombatEngine.buildInitialHero),
// полностью гасит удар вместо HP (CombatEngine.applyDamage). Декларативное значение, не хук — сама
// механика живёт в движке (нужно мутируемое per-fight состояние), см. docs/content.items.amulet.md.
const INVULN_HITS: Record<Rarity, number> = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };

const behavior: ItemBehavior = {
  name: 'Амулет барьера',
  slots: ['amulet'],
  type: 'accessory',
  tags: ['accessory', 'invuln'],
  invulnHitsGrant: (rarity) => INVULN_HITS[rarity],
  stats: (rarity) => [
    { text: `Неуязвимость: ${INVULN_HITS[rarity]} уд.`, color: '#66ccff' },
  ],
};

export default behavior;
