import type { SlotType } from '../items/types';
import type { CombatView } from '../items/behavior';

/**
 * Закрытый реестр числовых каналов («сколько») — по аналогии с `EventType` в `events.ts`.
 * Предмет не «делает» эффект, а декларирует вклад в канал; сам канал резолвится в одном месте
 * (см. `ChannelSet.query`), независимо от того, в каком слоте лежит предмет-источник.
 */
export type ChannelId =
  | 'crit_chance'
  | 'crit_mult'
  | 'crit_armor_pierce'
  | 'block_chance'
  | 'dodge_chance'
  | 'armor_pct' // герой: доля урона, которая проходит (1 = без брони); каждый источник — 'more'
  | 'armor_flat' // моб: очки, вычитаемые из удара (mitigateFlat)
  | 'thorns_flat' // герой и моб: фикс. урон назад за каждый удар (разные ChannelSet — не пересекаются)
  | 'lifesteal_on_hit_chance'
  | 'lifesteal_on_hit_flat'
  | 'lifesteal_on_kill_pct'
  | 'weapon_interval_mult' // cross-slot; без scope — влияет на КАЖДЫЙ weaponTimer (не только hand_right)
  | 'weapon_first_tick_ratio'; // cross-slot, combine='max', scope.targetSlot обязателен

export type Tier = 'flat' | 'increased' | 'more';

export interface ChannelScope {
  targetSlot: SlotType;
}

/**
 * Вклад предмета в канал.
 * - `flat` — прибавляется к базе константой.
 * - `increased` — все источники этого тира складываются, сумма применяется один раз: (1+Σ).
 * - `more` — каждый источник — независимый множитель: Π(more_i). И `increased`, и `more` берут
 *   значение в одной и той же конвенции «доля» (0.2 = +20%, −0.26 = −26%), без домножения на 100 —
 *   так что `более`-вклад армии (доля прошедшего урона) можно записывать напрямую как множитель
 *   (0.74 = «пропускает 74%»), а не как «−26».
 * `value` может быть функцией от `CombatView` — для условных вкладов (напр. HP-порог
 * `desperate_plate`). Список контрибуций всё равно строится один раз при сборке героя/моба;
 * динамическим бывает только КОНКРЕТНОЕ число, читаемое в момент резолюции.
 */
export interface ChannelContribution {
  channel: ChannelId;
  tier: Tier;
  value: number | ((view: CombatView) => number);
  scope?: ChannelScope;
}

type CombineMode = 'tiered' | 'max';

interface ChannelSpec {
  base: number;
  combine: CombineMode;
  clamp?: [number, number];
}

const CHANNEL_SPECS: Record<ChannelId, ChannelSpec> = {
  crit_chance: { base: 0, combine: 'tiered', clamp: [0, 1] },
  crit_mult: { base: 1, combine: 'tiered' },
  crit_armor_pierce: { base: 0, combine: 'tiered' },
  block_chance: { base: 0, combine: 'tiered', clamp: [0, 1] },
  dodge_chance: { base: 0, combine: 'tiered', clamp: [0, 1] },
  armor_pct: { base: 1, combine: 'tiered', clamp: [0, 1] },
  armor_flat: { base: 0, combine: 'tiered', clamp: [0, Infinity] },
  thorns_flat: { base: 0, combine: 'tiered', clamp: [0, Infinity] },
  lifesteal_on_hit_chance: { base: 0, combine: 'tiered', clamp: [0, 1] },
  lifesteal_on_hit_flat: { base: 0, combine: 'tiered' },
  lifesteal_on_kill_pct: { base: 0, combine: 'tiered' },
  weapon_interval_mult: { base: 1, combine: 'tiered' },
  weapon_first_tick_ratio: { base: 0, combine: 'max' },
};

/** Агрегат вкладов (одной стороны боя — героя или конкретного моба). Строится один раз при
 *  сборке героя/моба (`buildInitialHero`/`buildEnemy`), не пересчитывается на каждое событие. */
export class ChannelSet {
  constructor(private contributions: ChannelContribution[]) {}

  private resolveValue(c: ChannelContribution, view: CombatView): number {
    return typeof c.value === 'function' ? c.value(view) : c.value;
  }

  /**
   * `targetSlot` фильтрует cross-slot каналы (`weapon_interval_mult`/`weapon_first_tick_ratio`):
   * контрибуции со `scope` участвуют только если их `targetSlot` совпал; контрибуции без `scope`
   * участвуют всегда (обычные, не cross-slot каналы).
   */
  query(id: ChannelId, view: CombatView, targetSlot?: SlotType): number {
    const spec = CHANNEL_SPECS[id];
    const relevant = this.contributions.filter(c => {
      if (c.channel !== id) return false;
      if (c.scope) return c.scope.targetSlot === targetSlot;
      return true;
    });

    let result: number;
    if (spec.combine === 'max') {
      result = relevant.reduce((max, c) => Math.max(max, this.resolveValue(c, view)), spec.base);
    } else {
      let flat = 0;
      let increased = 0;
      let more = 1;
      for (const c of relevant) {
        const v = this.resolveValue(c, view);
        if (c.tier === 'flat') flat += v;
        else if (c.tier === 'increased') increased += v;
        else more *= v;
      }
      result = (spec.base + flat) * (1 + increased) * more;
    }

    if (spec.clamp) result = Math.min(spec.clamp[1], Math.max(spec.clamp[0], result));
    return result;
  }

  roll(id: ChannelId, rng: () => number, view: CombatView, targetSlot?: SlotType): boolean {
    return rng() < this.query(id, view, targetSlot);
  }
}

export function aggregateChannels(contributions: ChannelContribution[]): ChannelSet {
  return new ChannelSet(contributions);
}
