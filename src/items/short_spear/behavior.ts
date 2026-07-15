import type { ItemBehavior } from '../behavior';

const DMG_COLOR = '#ffcc44';

// damage/interval — явная таблица по редкости: одноцелевой DPS (`damage/interval`) растёт ×1.3 за
// уровень от анкора common (4.0); damage подобран под целые числа, interval — остаточная подгонка
// точности (прошив второй цели даёт тот же `damage` бесплатно, в анкор не входит).
const DAMAGE_BY_RARITY: Record<import('../types').Rarity, number> = {
  common: 4,
  uncommon: 5,
  rare: 7,
  epic: 9,
  legendary: 11,
};
const INTERVAL_BY_RARITY: Record<import('../types').Rarity, number> = {
  common: 1,
  uncommon: 0.962,
  rare: 1.036,
  epic: 1.024,
  legendary: 0.963,
};

const damage = (rarity: import('../types').Rarity) => DAMAGE_BY_RARITY[rarity];
const interval = (rarity: import('../types').Rarity) => INTERVAL_BY_RARITY[rarity];

// Прошив: бьёт основную цель и живого врага в строго соседней ячейке позади неё
// (по board-слоту, не по индексу массива — те расходятся после призывов). Пустая ячейка
// между целями блокирует прошив. Обе цели получают одинаковый урон.
const behavior: ItemBehavior = {
  name: 'Короткое копьё',
  slots: ['hand_right'],
  type: 'weapon',
  baseValue: 10,
  tags: ['weapon', 'pierce', 'slow'],
  attackInterval: interval,
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
    { text: `Перезарядка: ${interval(rarity).toFixed(2)}s`, color: DMG_COLOR },
    { text: `Также наносит урон стоящему за целью противнику`, color: DMG_COLOR },
  ],
  baseDamage: damage,
};

export default behavior;
