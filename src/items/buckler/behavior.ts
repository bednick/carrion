import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';
import type { GameEvent } from '../../combat/events';
import { UNARMED_DAMAGE } from '../../combat/events';

const BLOCK_CHANCE: Record<Rarity, number> = {
  common: 0.21,  //EHP 126
  uncommon: 0.26,  //EHP 135
  rare: 0.31,  //EHP 145
  epic: 0.37,  //EHP 159
  legendary: 0.43,  //EHP 177
};
const COUNTER_CHANCE: Record<Rarity, number> = {
  common: 0.20,
  uncommon: 0.20,
  rare: 0.20,
  epic: 0.20,
  legendary: 0.20
};

const behavior: ItemBehavior = {
  name: 'Баклер',
  slots: ['hand_left'],
  type: 'shield',
  tags: ['shield', 'counter', 'block'],
  on: {
    damage: (e, ctx) => {
      if (e.target.side !== 'hero') return {};

      // Два независимых броска на одно событие (один хук на слот — предмет катает оба сам):
      // блок гасит урон, контрудар отвечает. Исход одного не гейтит другой (R5-мотив «раздельный
      // тюнинг частоты проков и вклада в выживание», docs/content.items.hand_left.md).
      // Блок — как у heavy_shield: на любой дошедший до героя damage, включая шипы врага.
      const blocked = ctx.rng() < BLOCK_CHANCE[ctx.rarity];

      // Контрудар не реагирует на шипы врага (защита моба, origin.from === 'enemy') — только на
      // настоящие входящие атаки (origin.from === 'engine').
      const counters = e.origin.from !== 'enemy' && ctx.rng() < COUNTER_CHANCE[ctx.rarity];

      if (!blocked && !counters) return {};

      const spawn: GameEvent[] = [];
      if (blocked) {
        spawn.push({ type: 'block', source: e.source, target: e.target, prevented: e.amount, thorns: e.thorns, origin: e.origin });
      }
      if (counters) {
        const dmg = ctx.view.mainWeaponBaseDamage ?? UNARMED_DAMAGE;
        // Настоящая атака hand_right (не выдуманное число) — source.slot='hand_right', поэтому
        // ловит независимый крит-ролл heavy_gloves (тот слушает именно attack по этому слоту).
        spawn.push({ type: 'attack', source: { side: 'hero', slot: 'hand_right' }, target: e.source, amount: dmg, origin: e.origin });
        // Отдельное чисто презентационное событие — только чтобы UI отрисовал «контрудар»
        // (терминальный attack→damage путь переставляет cause на сам attack, целью которого
        // всегда враг, — по нему нельзя отличить контрудар от обычной атаки, см. CombatEngine.apply).
        spawn.push({ type: 'counter', source: { side: 'hero', slot: ctx.slot }, target: e.source, origin: e.origin });
      }

      return blocked ? { replace: [], spawn } : { spawn };
    },
  },
  stats: (rarity) => [
    { text: `Блок: ${Math.round(BLOCK_CHANCE[rarity] * 100)}%`, color: '#44aaff' },
    { text: `Контрудар: ${Math.round(COUNTER_CHANCE[rarity] * 100)}%`, color: '#ff8844' },
  ],
};

export default behavior;
