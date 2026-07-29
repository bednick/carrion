import type { ItemBehavior } from '../behavior';

const DMG_COLOR = '#ffcc44';

// Cleave: полный урон основной цели, сплеш затухает по дальности от неё (по board-слоту, не по
// индексу массива — те расходятся после призывов, тот же приём, что у прошива в short_spear) —
// ближайший прочий живой враг получает 50%, следующий 35%, следующий 25%. При равной дальности
// (враг стоит по разные стороны от цели на одном расстоянии) побеждает меньший slot — та же логика,
// что у дефолтного выбора цели движком (CombatEngine.nearestFreeSlot/выбор цели: чем меньше slot,
// тем ближе). Профильный стат — урон основной цели, ступени сплеша фиксированы и не растут с редкостью.
// damage/interval — явная таблица по редкости: одноцелевой DPS (`damage/interval`) растёт ×1.3 за
// уровень от анкора common (4.0); damage подобран под целые числа, interval — остаточная подгонка.
const SPLASH_RATIOS = [0.5, 0.35, 0.25];

const DAMAGE_BY_RARITY: Record<import('../types').Rarity, number> = {
  common: 5,
  uncommon: 7,
  rare: 8,
  epic: 11,
  legendary: 14,
};
const INTERVAL_BY_RARITY: Record<import('../types').Rarity, number> = {
  common: 1.25,
  uncommon: 1.346,
  rare: 1.183,
  epic: 1.252,
  legendary: 1.225,
};

const damage = (rarity: import('../types').Rarity) => DAMAGE_BY_RARITY[rarity];
const interval = (rarity: import('../types').Rarity) => INTERVAL_BY_RARITY[rarity];

const behavior: ItemBehavior = {
  name: 'Секира',
  slots: ['hand_right'],
  type: 'weapon',
  tags: ['weapon', 'cleave', 'slow'],
  attackInterval: interval,
  on: {
    attack_ready: (e, ctx) => {
      if (e.source.side !== 'hero' || e.source.slot !== ctx.slot || e.origin.from !== 'engine') {
        return {};
      }
      const source = e.source;
      const origin = e.origin;
      const dmg = damage(ctx.rarity);
      const spawn = [
        { type: 'attack' as const, source, target: e.target, amount: dmg, origin, splash: false },
      ];

      if (e.target.side === 'enemy') {
        const primaryIdx = e.target.idx;
        const primarySlot = ctx.view.enemies[primaryIdx]?.slot;
        if (primarySlot !== undefined) {
          const others = ctx.view.enemies
            .map((en, idx) => ({ en, idx }))
            .filter(({ en, idx }) => idx !== primaryIdx && en.hp > 0)
            .sort((a, b) => {
              const distA = Math.abs(a.en.slot - primarySlot);
              const distB = Math.abs(b.en.slot - primarySlot);
              return distA - distB || a.en.slot - b.en.slot;
            });

          others.slice(0, SPLASH_RATIOS.length).forEach(({ en, idx }, rank) => {
            // Дробь не округляем: спавненный `attack` округлится один раз в applyDamage
            // (стохастически), иначе сплеш 20% от урона в 2 всегда давал бы 0 и цель молча
            // выпадала бы из списка — см. `spiked_shield/behavior.ts`.
            const splashDmg = dmg * SPLASH_RATIOS[rank];
            if (splashDmg <= 0) return;
            spawn.push({
              type: 'attack' as const,
              source,
              target: { side: 'enemy', id: en.id, idx },
              amount: splashDmg,
              origin,
              splash: true,
            });
          });
        }
      }

      return { replace: [], spawn };
    },
  },
  stats: (rarity) => {
    const dmg = damage(rarity);
    return [
      { text: `Урон: ${dmg}`, color: DMG_COLOR },
      { text: `Перезарядка: ${interval(rarity).toFixed(2)}s`, color: DMG_COLOR },
      { text: `Сплеш урон до ${Math.round(SPLASH_RATIOS[0] * 100)}%`, color: DMG_COLOR },
    ];
  },
  baseDamage: damage,
};

export default behavior;
