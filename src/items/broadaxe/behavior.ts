import type { ItemBehavior } from '../behavior';

const DMG_COLOR = '#ffcc44';

// Cleave: полный урон основной цели, фиксированный сплеш-процент — всем остальным живым врагам
// на доске (не только соседям). Профильный стат — урон основной цели, сплеш-доля фиксирована.
// damage/interval — явная таблица по редкости: одноцелевой DPS (`damage/interval`) растёт ×1.3 за
// уровень от анкора common (4.0); damage подобран под целые числа, interval — остаточная подгонка.
const SPLASH_RATIO = 0.5;

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
  baseValue: 10,
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
      const splashDmg = Math.round(dmg * SPLASH_RATIO);
      const spawn = [
        { type: 'attack' as const, source, target: e.target, amount: dmg, origin, splash: false },
      ];

      if (e.target.side === 'enemy' && splashDmg > 0) {
        const primaryIdx = e.target.idx;
        ctx.view.enemies.forEach((en, idx) => {
          if (idx === primaryIdx || en.hp <= 0) return;
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

      return { replace: [], spawn };
    },
  },
  stats: (rarity) => {
    const dmg = damage(rarity);
    return [
      { text: `Урон: ${dmg}`, color: DMG_COLOR },
      { text: `Перезарядка: ${interval(rarity).toFixed(2)}s`, color: DMG_COLOR },
      { text: `Наносит сплеш урон всем прочим существам в размере ${Math.round(SPLASH_RATIO * 100)}%`, color: DMG_COLOR },
    ];
  },
  baseDamage: damage,
};

export default behavior;
