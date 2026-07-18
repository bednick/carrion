import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';

// Шипастый щит: не блокирует вовсе (0% block) — безусловно отражает долю ЛЮБОГО дошедшего до
// героя урона, без броска. Плоская таблица по редкости (не scaleByRarity) — тот же приём, что у
// перчаток/heavy_shield/buckler, см. docs/content.items.hand_left.md, узел «реакция на удар».
const THORNS_RATIO: Record<Rarity, number> = { common: 0.10, uncommon: 0.13, rare: 0.16, epic: 0.20, legendary: 0.20 };

const behavior: ItemBehavior = {
  name: 'Шипастый щит',
  slots: ['hand_left'],
  type: 'shield',
  tags: ['shield', 'thorns'],
  on: {
    damage: (e, ctx) => {
      // e.thorns: урон уже порождён чужими шипами (моба) — не отражаем его снова, иначе шипы
      // моба и героя отражают друг друга по кругу до предохранителя каскада.
      if (e.target.side !== 'hero' || e.amount <= 0 || e.thorns) return {};
      const reflected = Math.round(e.amount * THORNS_RATIO[ctx.rarity]);
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
    { text: `Шипы: ${Math.round(THORNS_RATIO[rarity] * 100)}% урона назад`, color: '#ff8844' },
  ],
};

export default behavior;
