import type { ItemInstance, SlotType } from '../items/types';
import type { EnemySpec, SummonTrigger, SummonPlacement, MobDefense } from '../zones/types';
import type { ChannelSet } from './channels';
import type { TriggerStateBag } from './triggers';

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
  /** Защита моба (флэт-броня/уклонение/шипы) — данные конфига, читается тултипом напрямую. */
  defense?: MobDefense;
  /** Каналы моба, построенные один раз из `defense` (см. `buildEnemyChannels` в CombatEngine) —
   *  тот же резолвер урона (`resolution.ts`), что и у героя, параметризованный «чьими каналами». */
  channels: ChannelSet;
  /** Пустой у всех текущих мобов (ни один не декларирует триггеров) — заведён как задел под
   *  будущие способности моба без повторного рефакторинга (см. docs/combat-events.md). Не
   *  слот-ключирован, как у героя (`TriggerStateBag`) — у моба нет экипировки по слотам. */
  triggerState: Record<string, unknown>;
  isBoss?: boolean;
  phaseIndex?: number;
}

/** Разовый порог аварийного лечения амулета (docs/content.items.amulet.md): не скейлится редкостью (R5).
 * healPercent — доля от heroMaxHp (0..1), не фиксированное число: хил считается от текущего maxHp
 * героя в момент срабатывания (applyDamage), а не один раз при сборке. */
export interface EmergencyHealConfig {
  thresholdRatio: number;
  healPercent: number;
}

export interface HeroState {
  maxHp: number;
  hp: number;
  equipment: Partial<Record<SlotType, ItemInstance>>;
  // Потоки стамины: по одному на надетое оружие (slot + интервал в мс). Урон тут не хранится —
  // его авторит общая стадия движка (см. resolution.ts:authorAttack, docs/combat-events.md §5).
  weaponTimers: { slot: SlotType; interval: number; elapsed: number }[];
  unarmedTimer: number;
  // Каналы героя, построенные один раз из экипировки (см. CombatEngine.buildInitialHero) —
  // единственный источник правды по числовым статам (крит/блок/броня/шипы/лайфстил/...).
  channels: ChannelSet;
  // Per-fight стейт-бэг триггеров (docs/content.items.amulet.md): заряды неуязвимости, флаг
  // «аварийный хил уже сработал», состояние любых будущих stateful-триггеров. Свежий на каждый
  // buildInitialHero — тот же контракт сброса, что был у старых invulnHits/emergencyHealUsed,
  // но теперь общий для ЛЮБОГО нового stateful-предмета, не только этих двух.
  triggerState: TriggerStateBag;
  // Множитель входящего по герою урона («проклятие» endless-зон, docs/content.zones.format.md):
  // 1 = без штрафа. В отличие от triggerState НЕ сбрасывается каждый buildInitialHero — растёт с
  // числом пройденных боёв, вызывающая сторона (ExpeditionScene) сама переносит его между боями.
  damageTakenMult: number;
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
