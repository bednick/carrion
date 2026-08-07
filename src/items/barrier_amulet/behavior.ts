import type { ItemBehavior } from '../behavior';
import { RESOURCE_COLOR } from '../statColors';

// Неуязвимость: N ударов без урона, выдаётся заново на каждый бой (заряды живут в per-fight
// стейт-бэге триггеров — CombatEngine.buildInitialHero → buildTriggerState, а не в бесповоротном
// поле HeroState, см. docs/content.items.amulet.md), полностью гасит удар вместо HP
// (CombatEngine.handleDamage/consumeInvuln). Декларативное значение, не хук/канал — сама механика
// нуждается в мутируемом per-fight состоянии, которого у стейтлес channels/triggers нет.
const INVULN_HITS: Record<import('../types').Rarity, number> = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };

const behavior: ItemBehavior = {
  name: 'Амулет барьера',
  slots: ['amulet'],
  type: 'accessory',
  tags: ['accessory', 'invuln'],
  invuln: (rarity) => ({ charges: INVULN_HITS[rarity] }),
  stats: (rarity) => [
    { text: `Неуязвимость: ${INVULN_HITS[rarity]} уд.`, color: RESOURCE_COLOR },
  ],
};

export default behavior;
