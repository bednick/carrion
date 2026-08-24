import type { ItemBehavior } from '../behavior';
import { RESOURCE_COLOR } from '../statColors';
import { t } from '../../i18n/t';

// Неуязвимость: N ударов без урона, выдаётся ОДИН РАЗ НА ЗАБЕГ (заряды живут в per-run стейт-бэге
// — RunStateBag.invuln, src/combat/runState.ts; владелец бэга — ExpeditionScene, не бой), полностью
// гасит удар вместо HP (CombatEngine.handleDamage/consumeInvuln). Потратив запас, до конца забега
// герой без барьера — новый бой его не чинит. Декларативное значение, не хук/канал — сама механика
// нуждается в мутируемом состоянии, которого у стейтлес channels/triggers нет.
const INVULN_HITS: Record<import('../types').Rarity, number> = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };

const behavior: ItemBehavior = {
  slots: ['amulet'],
  type: 'accessory',
  tags: ['accessory', 'invuln'],
  invuln: (rarity) => ({ charges: INVULN_HITS[rarity] }),
  stats: (rarity) => [
    { text: t('stat_invuln_per_run', { hits: INVULN_HITS[rarity] }), color: RESOURCE_COLOR },
  ],
};

export default behavior;
