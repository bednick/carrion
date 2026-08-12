import type { ItemBehavior } from '../behavior';
import { RESOURCE_COLOR } from '../statColors';

// Неуязвимость: N ударов без урона, выдаётся ОДИН РАЗ НА ЗАБЕГ (заряды живут в per-run стейт-бэге
// — RunStateBag.invuln, src/combat/runState.ts; владелец бэга — ExpeditionScene, не бой), полностью
// гасит удар вместо HP (CombatEngine.handleDamage/consumeInvuln). Потратив запас, до конца забега
// герой без барьера — новый бой его не чинит. Декларативное значение, не хук/канал — сама механика
// нуждается в мутируемом состоянии, которого у стейтлес channels/triggers нет.
const INVULN_HITS: Record<import('../types').Rarity, number> = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };

const behavior: ItemBehavior = {
  name: 'Амулет барьера',
  slots: ['amulet'],
  type: 'accessory',
  tags: ['accessory', 'invuln'],
  invuln: (rarity) => ({ charges: INVULN_HITS[rarity] }),
  stats: (rarity) => [
    { text: `Неуязвимость: ${INVULN_HITS[rarity]} уд. за забег`, color: RESOURCE_COLOR },
  ],
};

export default behavior;
