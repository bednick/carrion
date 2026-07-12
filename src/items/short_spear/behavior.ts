import type { ItemBehavior } from '../behavior';
import { scaleByRarity } from '../scaleByRarity';

const DMG_COLOR = '#ffcc44';

const damage = (rarity: import('../types').Rarity) => Math.round(scaleByRarity(5, rarity, 1.5));

// Прошив: бьёт основную цель и живого врага в строго соседней ячейке позади неё
// (по board-слоту, не по индексу массива — те расходятся после призывов). Пустая ячейка
// между целями блокирует прошив. Обе цели получают одинаковый урон.
const behavior: ItemBehavior = {
  attackInterval: () => 1.25,
  on: {
    attack_ready: (e, ctx) => {
      if (e.source.side !== 'hero' || e.source.slot !== ctx.slot || e.origin.from !== 'engine') {
        return {};
      }
      const dmg = damage(ctx.rarity);
      const spawn = [
        { type: 'attack' as const, source: e.source, target: e.target, amount: dmg, origin: e.origin },
      ];

      if (e.target.side === 'enemy') {
        const primarySlot = ctx.view.enemies[e.target.idx]?.slot;
        if (primarySlot !== undefined) {
          const behindIdx = ctx.view.enemies.findIndex(
            en => en.hp > 0 && en.slot === primarySlot + 1
          );
          if (behindIdx >= 0) {
            const behind = ctx.view.enemies[behindIdx];
            spawn.push({
              type: 'attack' as const,
              source: e.source,
              target: { side: 'enemy', id: behind.id, idx: behindIdx },
              amount: dmg,
              origin: e.origin,
            });
          }
        }
      }

      return { replace: [], spawn };
    },
  },
  stats: (rarity) => [
    { text: `Урон: ${damage(rarity)}`, color: DMG_COLOR },
    { text: `Перезарядка: 1.25s`, color: DMG_COLOR },
    { text: `Также наносит урон стоящему за целью противнику`, color: DMG_COLOR },
  ],
  baseDamage: damage,
};

export default behavior;
