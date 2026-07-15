import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';

// Барьер: временный HP-пул, выдаётся заново на каждый бой (CombatEngine.buildInitialHero),
// поглощает урон первым, до обычного HP (CombatEngine.applyDamage). Декларативное значение, не
// хук — сама механика живёт в движке (нужно мутируемое per-fight состояние), см.
// docs/content.items.amulet.md.
const BARRIER: Record<Rarity, number> = { common: 5, uncommon: 10, rare: 15, epic: 20, legendary: 30 };

const behavior: ItemBehavior = {
  name: 'Амулет барьера',
  slots: ['amulet'],
  type: 'accessory',
  baseValue: 10,
  tags: ['accessory', 'barrier'],
  barrierAmount: (rarity) => BARRIER[rarity],
  stats: (rarity) => [
    { text: `Барьер в начале боя: ${BARRIER[rarity]}`, color: '#66ccff' },
  ],
};

export default behavior;
