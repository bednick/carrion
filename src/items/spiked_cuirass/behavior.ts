import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';
import { mitigateDamage } from '../../combat/mitigation';

// Шипастый нагрудник: броня ниже «чистой» (gleaming_plate)
const REDUCTION: Record<Rarity, number> = {
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
  name: 'Шипастый нагрудник',
  slots: ['body'],
  type: 'armor',
  tags: ['armor', 'thorns'],
  on: {
    damage: (e, ctx) => {
      if (e.target.side !== 'hero') return {};
      const reduced = mitigateDamage(e.amount, REDUCTION[ctx.rarity]);
      // Урон, порождённый чужими шипами (моба), сами шипы не отражают — иначе шипы моба и героя
      // отражают друг друга по кругу до предохранителя каскада.
      if (e.thorns) return { replace: [{ ...e, amount: reduced }] };
      // Доля считается от СЫРОГО урона удара (e.raw, до собственного снижения бронёй этого же
      // предмета и до любых чужих снижений) — иначе шипы платят меньше на редкости выше common,
      // где своя же броня уже подъела удар. Дробь не округляем: спавненный `damage` округлится
      // один раз в applyDamage (стохастически), иначе шипы 20% от удара в 1 всегда давали бы 0.
      const reflected = (e.raw ?? e.amount) * THORNS_RATIO[ctx.rarity];
      if (reflected <= 0) return { replace: [{ ...e, amount: reduced }] };
      return {
        replace: [{ ...e, amount: reduced }],
        spawn: [{
          type: 'damage',
          source: { side: 'hero', slot: ctx.slot },
          target: e.source,
          amount: reflected,
          thorns: true,
          origin: e.origin,
        }],
      };
    },
    // Удар заблокирован ЧУЖИМ щитом (hand_left) раньше, чем событие дошло до этого слота (`body`
    // идёт после `hand_left` в HANDLER_ORDER — см. docs/combat-events.md §3 «дыра порядка»): блок
    // гасит `damage` через replace:[]+spawn:[block], поэтому шипы нагрудника ловят его тут, свежим
    // проходом. `prevented` в `block` — это и есть сырой урон удара (между hand_right/hand_left и
    // рождением damage урон никто не трогает), блок не должен гасить шипы.
    block: (e, ctx) => {
      if (e.target.side !== 'hero' || e.thorns) return {};
      const reflected = e.prevented * THORNS_RATIO[ctx.rarity];
      if (reflected <= 0) return {};
      return {
        spawn: [{
          type: 'damage',
          source: { side: 'hero', slot: ctx.slot },
          target: e.source,
          amount: reflected,
          thorns: true,
          origin: e.origin,
        }],
      };
    },
  },
  stats: (rarity) => [
    { text: `Защита: ${Math.round(REDUCTION[rarity] * 100)}%`, color: '#44aaff' },
    { text: `Шипы: ${Math.round(THORNS_RATIO[rarity] * 100)}% урона назад`, color: '#ff8844' },
  ],
};

export default behavior;
