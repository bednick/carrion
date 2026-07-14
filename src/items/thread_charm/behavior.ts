import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';
import { scaleByRarity } from '../scaleByRarity';

// Аварийный хил: разово за бой лечит героя, если удар оставил HP ниже порога. Порог фиксирован
// (R5: один профильный стат — величина хила, не порог), флаг «уже сработал» и сама механика
// живут в CombatEngine.applyDamage (нужно мутируемое per-fight состояние), см.
// docs/content.items.amulet.md.
const THRESHOLD_RATIO = 0.3;
const heal = (rarity: Rarity) => Math.round(scaleByRarity(8, rarity, 1.5));

const behavior: ItemBehavior = {
  emergencyHeal: (rarity) => ({ thresholdRatio: THRESHOLD_RATIO, healAmount: heal(rarity) }),
  stats: (rarity) => [
    {
      text: `Аварийный хил при HP < ${Math.round(THRESHOLD_RATIO * 100)}%: ${heal(rarity)} (раз за бой)`,
      color: '#44ff88',
    },
  ],
};

export default behavior;
