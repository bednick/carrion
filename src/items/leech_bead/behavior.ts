import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';

// Лайфстил за удар: на каждый нанесённый героем урон — шанс вылечить фиксированную величину.
// С быстрым оружием срабатывает чаще (больше бросков в единицу времени) — эмерджентная синергия
// on_hit × fast, но каждый отдельный удар лечит с вероятностью, а не гарантированно.
// Сплеш-тики (напр. cleave `broadaxe`, e.splash === true) не прокают лайфстил — иначе один взмах
// по толпе лечил бы героя за каждую задетую цель, что ломает баланс лечения относительно урона.
const PROC_CHANCE: Record<Rarity, number> = { common: 0.20, uncommon: 0.30, rare: 0.40, epic: 0.50, legendary: 0.50 };
const HEAL_AMOUNT = 1;

const behavior: ItemBehavior = {
  name: 'Пиявочная бусина',
  slots: ['amulet'],
  type: 'accessory',
  baseValue: 10,
  tags: ['accessory', 'lifesteal', 'on_hit'],
  on: {
    damage: (e, ctx) => {
      if (e.source.side !== 'hero' || e.target.side !== 'enemy' || e.amount <= 0 || e.splash) return {};
      if (ctx.rng() >= PROC_CHANCE[ctx.rarity]) return {};
      return {
        spawn: [{
          type: 'heal',
          source: { side: 'hero', slot: ctx.slot },
          target: { side: 'hero' },
          amount: HEAL_AMOUNT,
          origin: e.origin,
        }],
      };
    },
  },
  stats: (rarity) => [
    { text: `Шанс лечения за удар: ${Math.round(PROC_CHANCE[rarity] * 100)}% (+${HEAL_AMOUNT} HP)`, color: '#44ff88' },
  ],
};

export default behavior;
