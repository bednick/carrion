import type { Side } from './events';
import type { CombatView } from '../items/behavior';
import type { WeaponAuthoring } from '../items/behavior';
import type { ChannelSet } from './channels';
import { mitigateFlat } from './mitigation';

/** Один удар «в производстве» — до превращения в реальное `attack`-событие движком. */
export interface RawHit {
  target: Side;
  amount: number;
  armorPierce?: number;
  splash?: boolean;
  crit?: boolean;
}

// ─── Таргетинг форм атаки (engine-owned, не хук предмета — новое cleave/pierce оружие получает
// эти алгоритмы бесплатно, объявив только `shape`+`shapeParams`) ───────────────────────────────

/** Cleave: полный урон основной цели, сплеш затухает по дальности от неё (по board-слоту, не по
 *  индексу массива — те расходятся после призывов). При равной дальности побеждает меньший slot —
 *  та же логика, что у выбора цели движком. Перенесено дословно из старого `broadaxe/behavior.ts`. */
function cleaveTargets(primary: Side, dmg: number, splashRatios: number[], view: CombatView): RawHit[] {
  const hits: RawHit[] = [{ target: primary, amount: dmg, splash: false }];
  if (primary.side !== 'enemy') return hits;
  const primarySlot = view.enemies[primary.idx]?.slot;
  if (primarySlot === undefined) return hits;

  const others = view.enemies
    .map((en, idx) => ({ en, idx }))
    .filter(({ en, idx }) => idx !== primary.idx && en.hp > 0)
    .sort((a, b) => {
      const distA = Math.abs(a.en.slot - primarySlot);
      const distB = Math.abs(b.en.slot - primarySlot);
      return distA - distB || a.en.slot - b.en.slot;
    });

  others.slice(0, splashRatios.length).forEach(({ en, idx }, rank) => {
    // Дробь не округляем: спавненный `attack` округлится один раз в applyDamage (стохастически).
    const splashDmg = dmg * splashRatios[rank];
    if (splashDmg <= 0) return;
    hits.push({ target: { side: 'enemy', id: en.id, idx }, amount: splashDmg, splash: true });
  });
  return hits;
}

/** Прошив: основная цель + живой враг в строго соседней ячейке позади (по board-слоту). Пустая
 *  ячейка блокирует прошив, обе цели берут одинаковый урон. Перенесено из `short_spear/behavior.ts`. */
function pierceTargets(primary: Side, dmg: number, view: CombatView): RawHit[] {
  const hits: RawHit[] = [{ target: primary, amount: dmg }];
  if (primary.side !== 'enemy') return hits;
  const primarySlot = view.enemies[primary.idx]?.slot;
  if (primarySlot === undefined) return hits;

  const behindIdx = view.enemies.findIndex(en => en.hp > 0 && en.slot === primarySlot + 1);
  if (behindIdx >= 0) {
    const behind = view.enemies[behindIdx];
    hits.push({ target: { side: 'enemy', id: behind.id, idx: behindIdx }, amount: dmg });
  }
  return hits;
}

/**
 * Авторит атаку надетого оружия: форма (single/multihit/cleave/pierce) — данные предмета,
 * таргетинг — engine-owned функции выше. Крит — ОДНА общая стадия для всех форм: один бросок
 * `crit_chance`/удар, `crit_mult`/`crit_armor_pierce` читаются из агрегированных каналов героя,
 * а не от конкретного предмета (см. решение о консолидации крита, docs/combat-events.md).
 */
export function authorAttack(
  weapon: WeaponAuthoring,
  heroChannels: ChannelSet,
  primaryTarget: Side,
  view: CombatView,
  rng: () => number,
): RawHit[] {
  let hits: RawHit[];
  switch (weapon.shape) {
    case 'single':
      hits = [{ target: primaryTarget, amount: weapon.baseDamage }];
      break;
    case 'multihit': {
      const n = weapon.shapeParams?.hits ?? 1;
      hits = Array.from({ length: n }, () => ({ target: primaryTarget, amount: weapon.baseDamage }));
      break;
    }
    case 'cleave':
      hits = cleaveTargets(primaryTarget, weapon.baseDamage, weapon.shapeParams?.splashRatios ?? [], view);
      break;
    case 'pierce':
      hits = pierceTargets(primaryTarget, weapon.baseDamage, view);
      break;
  }

  return hits.map(h => {
    if (!heroChannels.roll('crit_chance', rng, view)) return h;
    const pierce = heroChannels.query('crit_armor_pierce', view);
    return {
      ...h,
      amount: Math.round(h.amount * heroChannels.query('crit_mult', view)),
      armorPierce: pierce > 0 ? pierce : h.armorPierce,
      crit: true,
    };
  });
}

// ─── Резолюция входящего урона: именованные стадии, не порядок слотов ──────────────────────────

export type DefenseOutcome =
  | { kind: 'dodge' }
  | { kind: 'blocked'; prevented: number }
  | { kind: 'resolved'; amount: number }; // дробный, после митигации, до округления

/**
 * Один резолвер урона для героя И моба — параметризован «чьими каналами» считать (герой:
 * `armor_pct`, доля-множитель; моб: `armor_flat`, вычет очков — модели намеренно разные, см.
 * `docs/mechanics.md` §«Броня vs щит»). Порядок стадий фиксирован и не зависит от того, в каком
 * слоте лежит предмет-источник канала: dodge → block → % митигация. Округление и применение к HP —
 * вне этой функции (CombatEngine.applyDamage), она сама состояние не мутирует.
 */
export function resolveDefense(
  rawAmount: number,
  armorPierce: number | undefined,
  defenderChannels: ChannelSet,
  isHero: boolean,
  view: CombatView,
  rng: () => number,
): DefenseOutcome {
  if (defenderChannels.roll('dodge_chance', rng, view)) return { kind: 'dodge' };
  if (defenderChannels.roll('block_chance', rng, view)) return { kind: 'blocked', prevented: rawAmount };

  const amount = isHero
    ? rawAmount * defenderChannels.query('armor_pct', view)
    : mitigateFlat(rawAmount, Math.max(0, defenderChannels.query('armor_flat', view) - (armorPierce ?? 0)));

  return { kind: 'resolved', amount };
}
