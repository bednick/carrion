import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';
import { UNARMED_DAMAGE } from '../../combat/events';

// Баклер: не блокирует вообще — урон проходит целиком. Независимый шанс контрудара роллится
// на каждый входящий удар (не гейтится блоком) — отдельная реализация строки матрицы факций
// «Контрудар» (docs/factions.md), не довесок к «Безусловной митигации» (docs/content.items.hand_left.md).
// Плоская таблица по редкости (не scaleByRarity) — тот же приём, что у перчаток/heavy_shield.
const COUNTER_CHANCE: Record<Rarity, number> = { common: 0.15, uncommon: 0.20, rare: 0.25, epic: 0.30, legendary: 0.30 };

const behavior: ItemBehavior = {
  name: 'Баклер',
  slots: ['hand_left'],
  type: 'shield',
  baseValue: 10,
  tags: ['shield', 'counter'],
  on: {
    damage: (e, ctx) => {
      if (e.target.side !== 'hero') return {};
      // Не реагирует на шипы врага (защита моба, origin.from === 'enemy') — только на настоящие
      // входящие атаки (origin.from === 'engine').
      if (e.origin.from === 'enemy') return {};
      if (ctx.rng() >= COUNTER_CHANCE[ctx.rarity]) return {};

      const dmg = ctx.view.mainWeaponBaseDamage ?? UNARMED_DAMAGE;
      return {
        spawn: [
          // Настоящая атака hand_right (не выдуманное число) — source.slot='hand_right', поэтому
          // ловит независимый крит-ролл heavy_gloves (тот слушает именно attack по этому слоту).
          { type: 'attack', source: { side: 'hero', slot: 'hand_right' }, target: e.source, amount: dmg, origin: e.origin },
          // Отдельное чисто презентационное событие — только чтобы UI отрисовал «контрудар»
          // (терминальный attack→damage путь переставляет cause на сам attack, целью которого
          // всегда враг, — по нему нельзя отличить контрудар от обычной атаки, см. CombatEngine.apply).
          { type: 'counter', source: { side: 'hero', slot: ctx.slot }, target: e.source, origin: e.origin },
        ],
      };
    },
  },
  stats: (rarity) => [
    { text: `Контрудар: ${Math.round(COUNTER_CHANCE[rarity] * 100)}%`, color: '#ff8844' },
  ],
};

export default behavior;
