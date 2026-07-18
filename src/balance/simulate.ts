// Ядро Monte Carlo симулятора экспедиций. Переиспользует РЕАЛЬНЫЙ боевой движок
// (src/combat/CombatEngine.ts) и реестры мобов/зон/предметов — числа гарантированно совпадают
// с игрой. Без зависимостей от Node (fs/process) и без Phaser — можно грузить и в браузере
// (src/balance/main.ts, balance.html), и из Node-скрипта (tools/balance-sim.mts).
//
// Headless-порт логики сборки боя из ExpeditionScene.ts (rollMob/resolvePhases/buildBoardEnemies) —
// сама сцена завязана на Phaser и тут не импортируется.

import { CombatEngine } from '../combat/CombatEngine';
import { BOARD_SLOTS, placementAnchor } from '../combat/types';
import type { CombatState, EnemyState } from '../combat/types';
import { getMobConfig } from '../mobs/registry';
import { sumMeta } from '../items/meta';
import type { EnemySpec, PhaseOverride, SummonRef, MobConfig, ZoneConfig } from '../zones/types';
import type { ItemInstance, SlotType } from '../items/types';

// ─── Порт fight-setup логики из ExpeditionScene (без Phaser) ───────────────────────────────

function resolveSpec(ref: PhaseOverride, isBoss: boolean): EnemySpec {
  const base: MobConfig = getMobConfig(ref.id);
  return {
    id: ref.id,
    name: ref.name ?? base.name,
    health: ref.health ?? base.health,
    attacks: ref.attacks ?? base.attacks,
    defense: ref.defense ?? base.defense,
    summons: ref.summons ?? base.summons,
    chance: ref.chance,
    position: base.position,
    summon_placement: base.summon_placement,
    isBoss,
  };
}

function resolvePhases(rootMobId: string, isBoss: boolean): EnemySpec[] {
  const root: MobConfig = getMobConfig(rootMobId);
  const specs = [resolveSpec({ id: rootMobId }, isBoss)];
  for (const phase of root.phases ?? []) specs.push(resolveSpec(phase, isBoss));
  return specs;
}

function resolveSummonSpec(ref: SummonRef): EnemySpec {
  const base: MobConfig = getMobConfig(ref.mob_id);
  return {
    id: ref.mob_id,
    name: ref.name ?? base.name,
    health: ref.health ?? base.health,
    attacks: ref.attacks ?? base.attacks,
    defense: ref.defense ?? base.defense,
    summons: base.summons,
    summon_placement: base.summon_placement,
    isBoss: false,
  };
}

function nearestFreeSlotFrom(from: number, occupied: Set<number>): number | null {
  let best: number | null = null;
  let bestDist = Infinity;
  for (let s = 0; s < BOARD_SLOTS; s++) {
    if (occupied.has(s)) continue;
    const d = Math.abs(s - from);
    if (d < bestDist) { best = s; bestDist = d; }
  }
  return best;
}

function buildBoardEnemies(spec: EnemySpec): EnemyState[] {
  const rootSlot = Math.max(0, Math.min(BOARD_SLOTS - 1, spec.position ?? 0));
  const enemies: EnemyState[] = [CombatEngine.buildEnemy(spec, rootSlot, resolveSummonSpec)];
  const occupied = new Set<number>([rootSlot]);

  const placement = spec.summon_placement ?? 'nearest';
  for (const summon of spec.summons ?? []) {
    if (summon.trigger.type !== 'start') continue;
    const count = summon.count ?? 1;
    for (let i = 0; i < count; i++) {
      const anchor = summon.position ?? placementAnchor(placement, rootSlot);
      const slot = nearestFreeSlotFrom(anchor, occupied);
      if (slot === null) break;
      occupied.add(slot);
      enemies.push(CombatEngine.buildEnemy(resolveSummonSpec(summon), slot, resolveSummonSpec));
    }
  }
  return enemies;
}

function rollMob(zoneCfg: ZoneConfig): MobConfig {
  const pool = zoneCfg.mob_pool ?? [];
  if (pool.length === 0) return getMobConfig(zoneCfg.boss!.mob_id);
  const total = pool.reduce((s, e) => s + e.weight, 0);
  let rand = Math.random() * total;
  for (const entry of pool) {
    rand -= entry.weight;
    if (rand <= 0) return getMobConfig(entry.mob_id);
  }
  return getMobConfig(pool[0].mob_id);
}

// ─── Headless-прогон одного боя: тикаем движок фиксированным шагом, без рендера ────────────

const TICK_MS = 20;               // шаг симуляции (мельче, чем кадр Phaser, — точнее таймеры)
const STALEMATE_MS = 10 * 60_000; // 10 минут виртуального времени без исхода = патовая ситуация

type FightOutcome = 'win' | 'dead' | 'stalemate';

interface FightResult {
  outcome: FightOutcome;
  hpEnd: number;
}

// Строит героя заново на каждый бой (как ExpeditionScene.beginFight), перенося только hp —
// barrier/emergencyHealUsed/weaponTimers обязаны обнуляться каждый бой (docs/content.items.amulet.md:
// «Полный barrierMax — на каждый бой», «Флаг сбрасывается каждый новый бой»). Общий на всю экспедицию
// объект hero тут раньше был багом: оберег/барьер могли сработать лишь раз за экспедицию, а не за бой.
function runFight(
  equipment: Partial<Record<SlotType, ItemInstance>>,
  prevHp: number,
  zoneCfg: ZoneConfig,
  fightIdx: number,
  totalFights: number,
  isBoss: boolean,
  damageTakenMult = 1,
): FightResult {
  const hero = CombatEngine.buildInitialHero(equipment, damageTakenMult);
  hero.hp = Math.max(1, Math.min(prevHp, hero.maxHp));

  const rootMobId = isBoss ? zoneCfg.boss!.mob_id : rollMob(zoneCfg).id;
  const phases = resolvePhases(rootMobId, isBoss);
  const enemies = buildBoardEnemies(phases[0]);
  const enginePhases = phases.length > 1 ? phases : undefined;

  const state: CombatState = {
    phase: 'fighting',
    enemies,
    hero,
    fightIndex: fightIdx,
    totalFights,
    walkProgress: 0,
    speedMultiplier: 1,
    isBossFight: isBoss,
  };

  const engine = new CombatEngine(state, {
    onDamageDealt: () => {},
    onBlock: () => {},
    onEnemyDied: () => {},
    onHeroDied: () => {},
    onFightEnd: () => {},
  }, resolveSummonSpec, enginePhases);

  let elapsed = 0;
  while (state.phase === 'fighting') {
    engine.update(TICK_MS);
    elapsed += TICK_MS;
    if (elapsed > STALEMATE_MS) return { outcome: 'stalemate', hpEnd: state.hero.hp };
  }
  return { outcome: state.phase === 'dead' ? 'dead' : 'win', hpEnd: state.hero.hp };
}

export interface ExpeditionResult {
  outcome: FightOutcome;
  fightsCompleted: number; // рядовых боёв, не считая босса
  hpAtBossStart: number | null;
  hpAtEnd: number;
}

// Предохранитель от бесконечного цикла: если экипировка настолько сильна, что проклятие
// (см. docs/content.zones.format.md) не убивает героя и за столько боёв — считаем патом, не победой
// (в endless-зоне победы не существует, см. ExpeditionScene).
const ENDLESS_DEPTH_CAP = 500;

/** Endless-зона (docs/content.zones.format.md) — рядовые бои без предела, растущее проклятие
 *  вместо fightPlan/boss. Headless-порт ветки ExpeditionScene.beginFight/onFightEnd. */
function runEndlessExpedition(equipment: Partial<Record<SlotType, ItemInstance>>, zoneCfg: ZoneConfig): ExpeditionResult {
  const cursePerFight = zoneCfg.endless!.curse_per_fight;
  let depth = 0;
  let hp = CombatEngine.buildInitialHero(equipment).hp;
  while (depth < ENDLESS_DEPTH_CAP) {
    const curseMult = 1 + (cursePerFight / 100) * depth;
    const result = runFight(equipment, hp, zoneCfg, depth, 0, false, curseMult);
    hp = result.hpEnd;
    if (result.outcome !== 'win') {
      return { outcome: result.outcome, fightsCompleted: depth, hpAtBossStart: null, hpAtEnd: hp };
    }
    depth++;
  }
  return { outcome: 'stalemate', fightsCompleted: depth, hpAtBossStart: null, hpAtEnd: hp };
}

export function runExpedition(equipment: Partial<Record<SlotType, ItemInstance>>, zoneCfg: ZoneConfig): ExpeditionResult {
  if (zoneCfg.endless) return runEndlessExpedition(equipment, zoneCfg);

  const hasMobs = (zoneCfg.mob_pool?.length ?? 0) > 0 && !!zoneCfg.mob_loot;
  let count = 0;
  if (hasMobs && zoneCfg.fights) {
    const { min, max } = zoneCfg.fights;
    const base = min + Math.floor(Math.random() * (max - min + 1));
    count = Math.max(1, base + sumMeta(equipment).fightDelta);
  }
  const fightPlan: ('mob' | 'boss')[] = [...Array(count).fill('mob'), 'boss'];

  let fightsCompleted = 0;
  let hpAtBossStart: number | null = null;
  let hp = CombatEngine.buildInitialHero(equipment).hp;
  for (let i = 0; i < fightPlan.length; i++) {
    const isBoss = fightPlan[i] === 'boss';
    if (isBoss) hpAtBossStart = hp;
    const result = runFight(equipment, hp, zoneCfg, i, fightPlan.length, isBoss);
    hp = result.hpEnd;
    if (result.outcome !== 'win') {
      return { outcome: result.outcome, fightsCompleted, hpAtBossStart, hpAtEnd: hp };
    }
    if (!isBoss) fightsCompleted++;
  }
  return { outcome: 'win', fightsCompleted, hpAtBossStart, hpAtEnd: hp };
}

// ─── Агрегация по N прогонам ────────────────────────────────────────────────────────────────

/** Гистограмма HP: 20 корзин по 5 (0–4, 5–9, … 95–100). */
export const HIST_BUCKETS = 20;
export const HIST_BUCKET_SIZE = 100 / HIST_BUCKETS;

export function hpBucketIndex(hp: number): number {
  return Math.max(0, Math.min(HIST_BUCKETS - 1, Math.floor(hp / HIST_BUCKET_SIZE)));
}

export interface SimSummary {
  trials: number;
  wins: number;
  deaths: number;
  stalemates: number;
  fightsSum: number;
  /** HP героя в момент входа в бой с боссом (независимо от исхода самого боя с боссом). */
  bossStartHpSum: number;
  bossStartHpCount: number;
  bossStartHist: number[];
  /** HP героя сразу после победы над боссом (только среди выигранных экспедиций). */
  bossEndHpSum: number;
  bossEndHpCount: number;
  bossEndHist: number[];
  deathAtFight: Record<number, number>;
}

export function emptySummary(): SimSummary {
  return {
    trials: 0, wins: 0, deaths: 0, stalemates: 0, fightsSum: 0,
    bossStartHpSum: 0, bossStartHpCount: 0, bossStartHist: new Array(HIST_BUCKETS).fill(0),
    bossEndHpSum: 0, bossEndHpCount: 0, bossEndHist: new Array(HIST_BUCKETS).fill(0),
    deathAtFight: {},
  };
}

/** Прогоняет `trials` экспедиций синхронно и возвращает агрегат. Для больших `trials` в браузере
 *  используй меньшими пачками через `mergeResult` + yield в event loop (см. src/balance/main.ts). */
export function runMonteCarlo(equipment: Partial<Record<SlotType, ItemInstance>>, zoneCfg: ZoneConfig, trials: number): SimSummary {
  const s = emptySummary();
  for (let i = 0; i < trials; i++) mergeResult(s, runExpedition(equipment, zoneCfg));
  return s;
}

export function mergeResult(s: SimSummary, r: ExpeditionResult): void {
  s.trials++;
  s.fightsSum += r.fightsCompleted;
  if (r.outcome === 'win') s.wins++;
  else if (r.outcome === 'dead') {
    s.deaths++;
    s.deathAtFight[r.fightsCompleted] = (s.deathAtFight[r.fightsCompleted] ?? 0) + 1;
  } else s.stalemates++;

  if (r.hpAtBossStart !== null) {
    s.bossStartHpSum += r.hpAtBossStart;
    s.bossStartHpCount++;
    s.bossStartHist[hpBucketIndex(r.hpAtBossStart)]++;
  }
  if (r.outcome === 'win') {
    s.bossEndHpSum += r.hpAtEnd;
    s.bossEndHpCount++;
    s.bossEndHist[hpBucketIndex(r.hpAtEnd)]++;
  }
}
