import type { ItemBehavior } from '../behavior';
import { scaleByRarity } from '../scaleByRarity';

const DMG_COLOR = '#ffcc44';

// Cleave: полный урон основной цели, фиксированный сплеш-процент — всем остальным живым врагам
// на доске (не только соседям). Профильный стат — урон основной цели, сплеш-доля фиксирована.
const SPLASH_RATIO = 0.3;

const damage = (rarity: import('../types').Rarity) => Math.round(scaleByRarity(5, rarity, 1.4));

const behavior: ItemBehavior = {
  attackInterval: () => 1.5,
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
        { type: 'attack' as const, source, target: e.target, amount: dmg, origin },
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
      { text: `Перезарядка: 1.5s`, color: DMG_COLOR },
      { text: `Наносит сплеш урон всем прочим существам в размере ${Math.round(SPLASH_RATIO * 100)}%`, color: DMG_COLOR },
    ];
  },
};

export default behavior;
