import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';
import { HEAL_COLOR } from '../statColors';

// Лайфстил за удар: на каждый нанесённый героем урон — шанс вылечить фиксированную величину.
// С быстрым оружием срабатывает чаще (больше бросков в единицу времени) — эмерджентная синергия
// on_hit × fast, но каждый отдельный удар лечит с вероятностью, а не гарантированно. Механика —
// общая реактивная стадия движка (CombatEngine.runReactiveStage): сплеш-тики (cleave `broadaxe`)
// не прокают лайфстил — иначе один взмах по толпе лечил бы героя за каждую задетую цель.
const PROC_CHANCE: Record<Rarity, number> = { common: 0.20, uncommon: 0.30, rare: 0.40, epic: 0.50, legendary: 0.50 };
const HEAL_AMOUNT = 1;

const behavior: ItemBehavior = {
  name: 'Пиявочная бусина',
  slots: ['amulet'],
  type: 'accessory',
  tags: ['accessory', 'lifesteal', 'on_hit'],
  channels: (rarity) => [
    { channel: 'lifesteal_on_hit_chance', tier: 'flat', value: PROC_CHANCE[rarity] },
    { channel: 'lifesteal_on_hit_flat', tier: 'flat', value: HEAL_AMOUNT },
  ],
  stats: (rarity) => [
    { text: `Шанс лечения за удар: ${Math.round(PROC_CHANCE[rarity] * 100)}% (+${HEAL_AMOUNT} HP)`, color: HEAL_COLOR },
  ],
};

export default behavior;
