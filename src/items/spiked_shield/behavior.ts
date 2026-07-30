import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';
import type { GameEvent } from '../../combat/events';

const BLOCK_CHANCE: Record<Rarity, number> = {
  common: 0.21,  //EHP 126
  uncommon: 0.26,  //EHP 135
  rare: 0.31,  //EHP 145
  epic: 0.37,  //EHP 159
  legendary: 0.43,  //EHP 177
};
const THORNS_RATIO: Record<Rarity, number> = {
  common: 0.20,
  uncommon: 0.20,
  rare: 0.20,
  epic: 0.20,
  legendary: 0.20
};

const behavior: ItemBehavior = {
  name: 'Шипастый щит',
  slots: ['hand_left'],
  type: 'shield',
  tags: ['shield', 'thorns', 'block'],
  on: {
    damage: (e, ctx) => {
      if (e.target.side !== 'hero') return {};

      // Блок и шипы независимы (один хук на слот катает оба исхода сам): блок гасит удар броском,
      // шипы отражают долю пришедшего урона всегда — заблокированный удар тоже оплачивается назад.
      // Гейтить шипы исходом блока нельзя: тогда детерминированность шипов (весь смысл предмета)
      // снова упирается в удачу, см. docs/content.items.hand_left.md §«Отклонённые направления».
      const blocked = ctx.rng() < BLOCK_CHANCE[ctx.rarity];

      // e.thorns: урон уже порождён чужими шипами (моба) — не отражаем его снова, иначе шипы
      // моба и героя отражают друг друга по кругу до предохранителя каскада.
      // Дробь не округляем: спавненный `damage` округлится один раз в applyDamage (стохастически),
      // иначе шипы 10% от удара в 1 всегда давали бы 0.
      const reflected = e.amount > 0 && !e.thorns ? e.amount * THORNS_RATIO[ctx.rarity] : 0;

      if (!blocked && reflected <= 0) return {};

      const spawn: GameEvent[] = [];
      if (blocked) {
        spawn.push({ type: 'block', source: e.source, target: e.target, prevented: e.amount, origin: e.origin });
      }
      if (reflected > 0) {
        spawn.push({
          type: 'damage',
          source: { side: 'hero', slot: ctx.slot },
          target: e.source,
          amount: reflected,
          thorns: true,
          origin: e.origin,
        });
      }

      return blocked ? { replace: [], spawn } : { spawn };
    },
  },
  stats: (rarity) => [
    { text: `Блок: ${Math.round(BLOCK_CHANCE[rarity] * 100)}%`, color: '#44aaff' },
    { text: `Шипы: ${Math.round(THORNS_RATIO[rarity] * 100)}% урона назад`, color: '#ff8844' },
  ],
};

export default behavior;
