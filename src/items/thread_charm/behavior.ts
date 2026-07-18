import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';

// Аварийный хил: разово за бой лечит героя, если удар оставил HP ниже порога. Порог фиксирован
// (R5: один профильный стат — величина хила, не порог), флаг «уже сработал» и сама механика
// живут в CombatEngine.applyDamage (нужно мутируемое per-fight состояние), см.
// docs/content.items.amulet.md. Хил задан в % от heroMaxHp, не флэт-числом — считается от
// текущего maxHp героя в момент срабатывания. legendary не крафтится, повторяет epic.
const THRESHOLD_RATIO = 0.2;
const HEAL_PERCENT: Record<Rarity, number> = { common: 0.05, uncommon: 0.10, rare: 0.15, epic: 0.20, legendary: 0.30 };

const behavior: ItemBehavior = {
  name: 'Оберег на волоске',
  slots: ['amulet'],
  type: 'accessory',
  tags: ['accessory', 'last_stand'],
  emergencyHeal: (rarity) => ({ thresholdRatio: THRESHOLD_RATIO, healPercent: HEAL_PERCENT[rarity] }),
  stats: (rarity) => [
    {
      text: `Аварийный хил при HP < ${Math.round(THRESHOLD_RATIO * 100)}%: ${Math.round(HEAL_PERCENT[rarity] * 100)}% от макс. HP (раз за бой)`,
      color: '#44ff88',
    },
  ],
};

export default behavior;
