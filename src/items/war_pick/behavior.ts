import type { ItemBehavior } from '../behavior';
import { scaleByRarity } from '../scaleByRarity';

const DMG_COLOR = '#ffcc44';

// Крит: профильный стат — шанс крита (скейлится редкостью), урон и интервал фиксированы (R5 —
// ровно один профильный стат). Крит несёт rider `armorPierce` — игнорирует часть брони цели на этот
// удар: под флэт-броню это было не нужно (крупный урон и так пробивал её непропорционально сильнее —
// см. историю в docs/content.items.hand_right.md), но под %-моделью брони (2026-07, см.
// docs/mechanics.md §«Броня vs щит») процентное снижение одинаково режет любой урон вне зависимости от
// размера — без явного пробития крит потерял бы свою анти-Мародёры идентичность (R6).
const BASE_DAMAGE = 4;
const INTERVAL = 1.1;
const CRIT_MULT = 2.0;
const CRIT_ARMOR_PIERCE = 0.5;

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
        spawn: [{
          type: 'attack',
          source: e.source,
          target: e.target,
          amount: dmg,
          armorPierce: isCrit ? CRIT_ARMOR_PIERCE : undefined,
          origin: e.origin,
        }],
      };
    },
  },
  stats: (rarity) => [
    { text: `Урон: ${BASE_DAMAGE}`, color: DMG_COLOR },
    { text: `Перезарядка: ${INTERVAL.toFixed(1)}s`, color: DMG_COLOR },
    { text: `Шанс крита: ${Math.round(critChance(rarity) * 100)}%`, color: DMG_COLOR },
    { text: `Множитель крита: ×${CRIT_MULT}, пробитие брони цели: ${Math.round(CRIT_ARMOR_PIERCE * 100)}%`, color: DMG_COLOR },
  ],
  baseDamage: () => BASE_DAMAGE,
};

export default behavior;
