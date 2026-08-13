import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';
import { HEAL_COLOR } from '../statColors';

// Лайфстил за удар: на каждый нанесённый героем урон — шанс вылечить фиксированную величину.
// Каждый прок множит шанс на DECAY до конца забега (RunStateBag.hitLeech, src/combat/runState.ts):
// предмет не выключается совсем — геометрическое затухание нуля не достигает, — но чем дольше
// забег, тем реже течёт хил, так что «бесконечного» лечения из него не выжать.
// С быстрым оружием срабатывает чаще (больше бросков в единицу времени) — эмерджентная синергия
// on_hit × fast, но и запас шанса такое оружие проедает быстрее. Механика — общая реактивная
// стадия движка (CombatEngine.runReactiveStage): сплеш-тики (cleave `broadaxe`) не прокают
// лайфстил — иначе один взмах по толпе лечил бы героя за каждую задетую цель.
//
// Редкость скейлит ОБЕ величины: профильный стат — величина хила (1→5 HP), рост шанса читается как
// слабый rider (R5, docs/content.items.md). Одним шансом рост ×5 не вытянуть: при затухании число
// проков за забег растёт логарифмически (n ≈ ln(1 + N·p·(1/DECAY − 1)) / ln(1/DECAY)), и даже при
// шансе 100% упирается в ~8 проков на 28 ударов.
// Бюджет откалиброван Monte-Carlo на ~28 ударов героя за забег (7 боёв × ~4 сек × ~1 удар/сек) под
// паритет с `vulture_amulet` (5/10/15/20/25 HP за забег): выходит 4.4 / 9.4 / 14.7 / 20.5 / 26.6 HP.
//
// Затухание игроку НЕ объясняется формулой: тултип показывает фактический шанс на текущий момент
// забега (`baseChance * decay^procs` — та же формула, которой кидает CombatEngine.rollHitLeech), и
// игрок видит, как процент падает по ходу забега сам. Состояние приезжает в stats() третьим
// аргументом от Tooltip (вне забега его нет — в лагере показываем базовый шанс редкости).
const PROC_CHANCE: Record<Rarity, number> = { common: 0.30, uncommon: 0.33, rare: 0.36, epic: 0.39, legendary: 0.42 };
const HEAL_AMOUNT: Record<Rarity, number> = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };
const DECAY = 0.75;

const behavior: ItemBehavior = {
  name: 'Пиявочная бусина',
  slots: ['amulet'],
  type: 'accessory',
  tags: ['accessory', 'lifesteal', 'on_hit'],
  hitLeech: (rarity) => ({ chance: PROC_CHANCE[rarity], decay: DECAY, amount: HEAL_AMOUNT[rarity] }),
  stats: (rarity, _slot, run) => {
    // Величина хила — из таблицы редкости этого экземпляра, а не из бэга: затухание общее на
    // item_id (syncRunState), а показывать могут копию другой редкости из рюкзака/лута.
    const hl = run?.hitLeech;
    const chance = hl ? hl.baseChance * Math.pow(hl.decay, hl.procs) : PROC_CHANCE[rarity];
    return [
      { text: `Шанс лечения за удар: ${Math.round(chance * 100)}% (+${HEAL_AMOUNT[rarity]} HP)`, color: HEAL_COLOR },
    ];
  },
};

export default behavior;
