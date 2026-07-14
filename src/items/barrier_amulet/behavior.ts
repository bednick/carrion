import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';
import { scaleByRarity } from '../scaleByRarity';

// Барьер: временный HP-пул, выдаётся заново на каждый бой (CombatEngine.buildInitialHero),
// поглощает урон первым, до обычного HP (CombatEngine.applyDamage). Декларативное значение, не
// хук — сама механика живёт в движке (нужно мутируемое per-fight состояние), см.
// docs/content.items.amulet.md.
const barrier = (rarity: Rarity) => Math.round(scaleByRarity(4, rarity, 1.5));

const behavior: ItemBehavior = {
  barrierAmount: barrier,
  stats: (rarity) => [
    { text: `Барьер в начале боя: ${barrier(rarity)}`, color: '#66ccff' },
  ],
};

export default behavior;
