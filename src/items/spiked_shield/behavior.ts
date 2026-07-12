import type { ItemBehavior } from '../behavior';

// Шипастый щит: не блокирует вовсе (0% block) — безусловно отражает долю ЛЮБОГО дошедшего до
// героя урона, без броска. Фиксировано, не скейлится редкостью (как splash_ratio у broadaxe) —
// см. docs/content.items.hand_left.md, узел «реакция на удар».
const THORNS_RATIO = 0.35;

const behavior: ItemBehavior = {
  on: {
    damage: (e, ctx) => {
      if (e.target.side !== 'hero' || e.amount <= 0) return {};
      const reflected = Math.round(e.amount * THORNS_RATIO);
      if (reflected <= 0) return {};
      return {
        spawn: [{
          type: 'damage',
          source: { side: 'hero', slot: ctx.slot },
          target: e.source,
          amount: reflected,
          origin: e.origin,
        }],
      };
    },
  },
  stats: () => [
    { text: `Шипы: ${Math.round(THORNS_RATIO * 100)}% урона назад`, color: '#ff8844' },
  ],
};

export default behavior;
