import type { Rarity } from './types';
import type { ItemBehavior } from './behavior';
import { scaleByRarity } from './scaleByRarity';
import { mitigateDamage } from '../combat/mitigation';

const DMG_COLOR = '#ffcc44';
const DEF_COLOR = '#44aaff';

export interface WeaponOpts {
  damage: number;
  interval: number; // секунды при common
  /** Кривые скейла по редкости: damage — множитель (heavy >1), interval — множитель (light <1). */
  scale?: { damage?: number; interval?: number };
}

/**
 * Обычное оружие: объявляет поток стамины (`attackInterval`) и авторит атаку на `attack_ready`.
 * Урон и интервал скейлятся по редкости заданными кривыми.
 */
export function standardWeapon(opts: WeaponOpts): ItemBehavior {
  const dScale = opts.scale?.damage ?? 1.5;
  const iScale = opts.scale?.interval ?? 1.0;
  const interval = (rarity: Rarity) => scaleByRarity(opts.interval, rarity, iScale);
  const damage = (rarity: Rarity) => Math.round(scaleByRarity(opts.damage, rarity, dScale));

  return {
    attackInterval: interval,
    on: {
      attack_ready: (e, ctx) => {
        // Авторим только собственный «естественный» взмах (origin движка) — иначе петля удвоения.
        if (e.source.side !== 'hero' || e.source.slot !== ctx.slot || e.origin.from !== 'engine') {
          return {};
        }
        return {
          replace: [], // тик готовности израсходован
          spawn: [{ type: 'attack', source: e.source, target: e.target, amount: damage(ctx.rarity), origin: e.origin }],
        };
      },
    },
    stats: (rarity) => [
      { text: `Урон: ${damage(rarity)}`, color: DMG_COLOR },
      { text: `Перезарядка: ${interval(rarity).toFixed(1)}s`, color: DMG_COLOR },
    ],
    baseDamage: damage,
  };
}

export interface ArmorOpts {
  /** Доля снижения урона (0..1) на `common`. */
  pct: number;
  scale?: number;
  /** Потолок доли на верхней редкости — броня не должна вырастать до гарантированного блока. */
  cap?: number;
}

/** Броня: мультипликативно снижает входящий по герою урон (стакается с другой бронёй по порядку,
 *  никогда не обнуляет удар целиком — см. `mitigateDamage`). */
export function standardArmor(opts: ArmorOpts): ItemBehavior {
  const scale = opts.scale ?? 1.5;
  const cap = opts.cap ?? 0.6;
  const pct = (rarity: Rarity) => Math.min(cap, scaleByRarity(opts.pct, rarity, scale));

  return {
    on: {
      damage: (e, ctx) => {
        if (e.target.side !== 'hero') return {};
        return { replace: [{ ...e, amount: mitigateDamage(e.amount, pct(ctx.rarity)) }] };
      },
    },
    stats: (rarity) => [{ text: `Защита: ${Math.round(pct(rarity) * 100)}%`, color: DEF_COLOR }],
  };
}

export interface ShieldOpts {
  block: number; // шанс блока 0..1 при common
  scale?: number;
}

/** Щит: с шансом полностью отклоняет входящий урон — заглушает `damage` и спавнит `block`. */
export function standardShield(opts: ShieldOpts): ItemBehavior {
  const scale = opts.scale ?? 1.0;
  const chance = (rarity: Rarity) => Math.min(1, scaleByRarity(opts.block, rarity, scale));

  return {
    on: {
      damage: (e, ctx) => {
        if (e.target.side !== 'hero') return {};
        if (ctx.rng() >= chance(ctx.rarity)) return {};
        return {
          replace: [],
          // source = атаковавший враг (для контрударов «за блок»); блокер — в origin (слот).
          spawn: [{
            type: 'block',
            source: e.source,
            target: e.target,
            prevented: e.amount,
            origin: e.origin,
          }],
        };
      },
    },
    stats: (rarity) => [{ text: `Блок: ${Math.round(chance(rarity) * 100)}%`, color: DEF_COLOR }],
  };
}
