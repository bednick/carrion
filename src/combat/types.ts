import type { ItemInstance, SlotType } from '../items/types';
import type { EnemySpec, SummonTrigger, SummonPlacement, MobDefense } from '../zones/types';

/** Число ячеек доски боя (один ряд). Это и есть жёсткий потолок числа врагов. */
export const BOARD_SLOTS = 4;

/** Опорная ячейка для расстановки призыва по стратегии (без учёта занятости слотов). */
export function placementAnchor(placement: SummonPlacement, selfSlot: number): number {
  switch (placement) {
    case 'front': return 0;
    case 'back': return BOARD_SLOTS - 1;
    default: return selfSlot; // 'nearest'
  }
}

/**
 * Рантайм-состояние одного триггера призыва живого моба (interval/hp).
 * `elapsed` копит время для `interval`; `fired` отмечает отработанный `hp`-порог.
 * `position` — явная целевая ячейка призыва из `SummonRef` (приоритетнее стратегии).
 */
export interface SummonPlan {
  spec: EnemySpec;
  trigger: SummonTrigger;
  count: number;
  position?: number;
  elapsed: number;
  fired: boolean;
}

export interface EnemyState {
  id: string;
  name: string;
  maxHp: number;
  hp: number;
  slot: number;
  attackTimers: { damage: number; interval: number; elapsed: number }[];
  summonPlans: SummonPlan[];
  /** Стратегия расстановки призывов этого моба (см. `MobConfig.summon_placement`). */
  summonPlacement: SummonPlacement;
  /** Защита моба (флэт-броня/уклонение/шипы) — хук на входящий `damage`. */
  defense?: MobDefense;
  isBoss?: boolean;
  phaseIndex?: number;
}

/** Разовый порог аварийного лечения амулета (docs/content.items.amulet.md): не скейлится редкостью (R5). */
export interface EmergencyHealConfig {
  thresholdRatio: number;
  healAmount: number;
}

export interface HeroState {
  maxHp: number;
  hp: number;
  equipment: Partial<Record<SlotType, ItemInstance>>;
  // Потоки стамины: по одному на надетое оружие (slot + интервал в мс). Урон тут не хранится —
  // его авторит хук предмета при срабатывании (docs/combat-events.md §5).
  weaponTimers: { slot: SlotType; interval: number; elapsed: number }[];
  unarmedTimer: number;
  // Барьер (временный HP-пул поверх обычного HP, docs/content.items.amulet.md): выдаётся заново
  // на каждый бой (buildInitialHero), тает по мере поглощения урона в applyDamage, не
  // восстанавливается до следующего боя. barrierMax — для UI (бар текущий/максимум).
  barrier: number;
  barrierMax: number;
  // Аварийный хил (docs/content.items.amulet.md): конфиг читается один раз при сборке героя из
  // ItemBehavior.emergencyHeal; emergencyHealUsed — флаг «уже сработал в этом бою», сбрасывается
  // на каждый buildInitialHero (новый бой), не на смену фазы одного боя.
  emergencyHeal?: EmergencyHealConfig;
  emergencyHealUsed: boolean;
}

export type CombatPhase = 'fighting' | 'walking' | 'done' | 'dead';

export interface CombatState {
  phase: CombatPhase;
  enemies: EnemyState[];
  hero: HeroState;
  fightIndex: number;
  totalFights: number;
  walkProgress: number;
  speedMultiplier: number;
  isBossFight: boolean;
}
