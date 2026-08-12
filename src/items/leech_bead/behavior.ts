import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';
import { HEAL_COLOR, PENALTY_COLOR } from '../statColors';

// Лайфстил за удар: на каждый нанесённый героем урон — шанс вылечить фиксированную величину.
// Каждый прок множит шанс на DECAY до конца забега (RunStateBag.hitLeech, src/combat/runState.ts):
// предмет не выключается совсем — геометрическое затухание нуля не достигает, — но чем дольше
// забег, тем реже течёт хил, так что «бесконечного» лечения из него не выжать.
// С быстрым оружием срабатывает чаще (больше бросков в единицу времени) — эмерджентная синергия
// on_hit × fast, но и запас шанса такое оружие проедает быстрее. Механика — общая реактивная
// стадия движка (CombatEngine.runReactiveStage): сплеш-тики (cleave `broadaxe`) не прокают
// лайфстил — иначе один взмах по толпе лечил бы героя за каждую задетую цель.
const PROC_CHANCE: Record<Rarity, number> = { common: 0.20, uncommon: 0.30, rare: 0.40, epic: 0.50, legendary: 0.50 };
const HEAL_AMOUNT = 1;
const DECAY = 0.75;

const behavior: ItemBehavior = {
  name: 'Пиявочная бусина',
  slots: ['amulet'],
  type: 'accessory',
  tags: ['accessory', 'lifesteal', 'on_hit'],
  hitLeech: (rarity) => ({ chance: PROC_CHANCE[rarity], decay: DECAY, amount: HEAL_AMOUNT }),
  stats: (rarity) => [
    { text: `Шанс лечения за удар: ${Math.round(PROC_CHANCE[rarity] * 100)}% (+${HEAL_AMOUNT} HP)`, color: HEAL_COLOR },
    { text: `Каждое срабатывание: шанс ×${DECAY} до конца забега`, color: PENALTY_COLOR },
  ],
};

export default behavior;
