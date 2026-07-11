import type { ItemBehavior } from '../behavior';
import { scaleByRarity } from '../scaleByRarity';

const DMG_COLOR = '#ffcc44';

// Крит: профильный стат — шанс крита (скейлится редкостью), урон и интервал фиксированы (R5 —
// ровно один профильный стат). Крит рождается в авторе, до общего хука `damage` (флэт-броня врага
// применяется уже к криченному числу).
const BASE_DAMAGE = 4;
const INTERVAL = 1.1;
const CRIT_MULT = 2.0;

const critChance = (rarity: import('../types').Rarity) => Math.min(1, scaleByRarity(0.2, rarity, 1.35));

const behavior: ItemBehavior = {
  attackInterval: () => INTERVAL,
  on: {
    attack_ready: (e, ctx) => {
      if (e.source.side !== 'hero' || e.source.slot !== ctx.slot || e.origin.from !== 'engine') {
        return {};
      }
      const isCrit = ctx.rng() < critChance(ctx.rarity);
      const dmg = isCrit ? Math.round(BASE_DAMAGE * CRIT_MULT) : BASE_DAMAGE;
      return {
        replace: [],
        spawn: [{ type: 'attack', source: e.source, target: e.target, amount: dmg, origin: e.origin }],
      };
    },
  },
  stats: (rarity) => [
    { text: `Урон: ${BASE_DAMAGE}`, color: DMG_COLOR },
    { text: `Перезарядка: ${INTERVAL.toFixed(1)}s`, color: DMG_COLOR },
    { text: `Шанс крита: ${Math.round(critChance(rarity) * 100)}%`, color: DMG_COLOR },
    { text: `Множитель крита: ×${CRIT_MULT}`, color: DMG_COLOR },
  ],
};

export default behavior;
