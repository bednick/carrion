import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';

// Лечение за убийство: доля от maxHp убитого врага (не героя) — на событие kill спавнит heal
// герою (kill при этом продолжает применяться). ctx.view — снапшот, построенный один раз в начале
// dispatch() ДО применения этого урона, но enemy.hp/maxHp в нём совпадают с текущими: maxHp не
// меняется по ходу боя, а hp конкретно этого врага уже обнулён к моменту kill (applyDamage
// порождает kill только когда enemy.hp <= 0), так что читаем именно maxHp, не hp. legendary не
// крафтится — повторяет epic (см. docs/content.items.amulet.md).
const HEAL_PERCENT: Record<Rarity, number> = { common: 0.10, uncommon: 0.15, rare: 0.20, epic: 0.25, legendary: 0.25 };

const behavior: ItemBehavior = {
  name: 'Амулет грифа',
  slots: ['amulet'],
  type: 'accessory',
  tags: ['accessory', 'on_kill', 'lifesteal'],
  on: {
    kill: (e, ctx) => {
      if (e.target.side !== 'enemy') return {};
      const enemyMaxHp = ctx.view.enemies[e.target.idx]?.maxHp ?? 0;
      const heal = Math.round(enemyMaxHp * HEAL_PERCENT[ctx.rarity]);
      return {
        spawn: [{
          type: 'heal',
          source: { side: 'hero', slot: ctx.slot },
          target: { side: 'hero' },
          amount: heal,
          origin: e.origin,
        }],
      };
    },
  },
  stats: (rarity) => [
    { text: `Лечение за убийство: ${Math.round(HEAL_PERCENT[rarity] * 100)}% от макс. HP врага`, color: '#44ff88' },
  ],
};

export default behavior;
