import type { Rarity, EssenceTier } from '../items/types';

export interface LootEntry {
  item_id: string;
  chance: number;
  rarity?: Rarity;
}

/** Диапазон эссенции по тирам: заданные тиры роллятся в [min,max] при выборе карточки эссенции. */
export type EssenceLoot = Partial<Record<EssenceTier, { min: number; max: number }>>;

export interface LootTable {
  gold: { min: number; max: number };
  items: LootEntry[];
  /** Необязательно: эссенция за финальный драфт (правая карточка награды). */
  essence?: EssenceLoot;
}

/** Одна независимая атака: свой урон и свой интервал (в секундах). */
export interface AttackDef {
  damage: number;
  interval: number;
}

/**
 * Защита моба — хук на `damage`(target=этот враг). Все поля опциональны, применяются в порядке
 * dodge → armor → thorns. Ничего отдельно не скейлится (значения берутся как есть).
 * - `armor`  — доля 0..1: мультипликативно снижает каждый входящий удар (см. `combat/mitigation.ts`).
 *              НЕ блок: сильнее давит мелкий чип, большому пробою почти не мешает — но никогда не
 *              обнуляет удар целиком.
 * - `dodge`  — шанс 0..1 полностью погасить входящий удар (спавнит событие `dodge`).
 * - `thorns` — отражает фиксированный урон обратно в героя за каждый полученный удар.
 */
export interface MobDefense {
  armor?: number;
  dodge?: number;
  thorns?: number;
}

/**
 * Когда срабатывает призыв:
 * - `start`    — один раз в начале боя;
 * - `interval` — каждые `every` секунд, пока призыватель жив;
 * - `hp`       — один раз, когда HP призывателя падает ≤ `at`·maxHp (доля 0..1);
 * - `death`    — один раз, когда призыватель окончательно гибнет (после проверки фаз).
 *               Призыв садится от ячейки павшего (она уже свободна) — так моб «рассыпается»
 *               на несколько врагов на своём месте. Не путать с `hp: { at: 0 }` — тот не
 *               сработает: мёртвого моба тик уже не опрашивает.
 */
export type SummonTrigger =
  | { type: 'start' }
  | { type: 'interval'; every: number }
  | { type: 'hp'; at: number }
  | { type: 'death' };

/**
 * Куда призыватель ставит призванного моба, если у самого призыва нет явной `position`:
 * - `nearest` — ближайшая свободная ячейка от призывателя (по умолчанию);
 * - `front`   — ближайшая свободная к герою (крайняя левая, слот 0);
 * - `back`    — дальняя от героя (крайняя правая, последний слот).
 */
export type SummonPlacement = 'nearest' | 'front' | 'back';

/**
 * Призыв доп. противника. Ссылается на другого моба по id и берёт его статы;
 * поля статов можно переопределить. `trigger` обязателен — задаёт момент призыва.
 * `count` (по умолчанию 1) — сколько противников за одно срабатывание.
 * `position` — явная целевая ячейка; если занята — берётся ближайшая свободная к ней.
 * Приоритетнее стратегии `summon_placement` призывателя.
 */
export interface SummonRef {
  mob_id: string;
  trigger: SummonTrigger;
  count?: number;
  position?: number;
  name?: string;
  health?: number;
  attacks?: AttackDef[];
  defense?: MobDefense;
}

/**
 * Форма, в которую моб переходит при «смерти». Ссылается на моба по `id`
 * и может частично переопределить его описание.
 * `chance` — шанс входа в эту форму (0..1, по умолчанию 1). Фазы проверяются по порядку;
 * если ролл не прошёл — цепочка обрывается и моб умирает окончательно.
 */
export interface PhaseOverride {
  id: string;
  name?: string;
  health?: number;
  attacks?: AttackDef[];
  summons?: SummonRef[];
  defense?: MobDefense;
  chance?: number;
}

/** Поля отображения моба (не влияют на боевую логику). */
export interface MobUi {
  /** Прозрачность спрайта 0..1 (по умолчанию 1 — непрозрачный). */
  alpha?: number;
  /** Множитель к итоговому размеру спрайта после вписывания в бокс (по умолчанию 1). */
  scale?: number;
}

export interface MobConfig {
  id: string;
  name: string;
  health: number;
  attacks: AttackDef[];
  defense?: MobDefense;
  summons?: SummonRef[];
  phases?: PhaseOverride[];
  scale?: { min: number; max: number };
  /** Ячейка доски, в которую встаёт этот моб как корневой в бою (по умолчанию 0). */
  position?: number;
  /** Стратегия расстановки призванных им мобов без явной `position` (по умолчанию `nearest`). */
  summon_placement?: SummonPlacement;
  /** Визуальные настройки отображения (прозрачность и т.п.). */
  ui?: MobUi;
  /** Визуальная сложность моба — красит имя в тултипе (палитра как у редкости предметов).
   *  Не влияет на баланс/лут. Не указано ⇒ 'common'. */
  tier?: Rarity;
}

/** Нормализованное описание противника для боевого движка (intervalы в секундах). */
export interface EnemySpec {
  id: string;
  name: string;
  health: number;
  attacks: AttackDef[];
  defense?: MobDefense;
  summons?: SummonRef[];
  chance?: number;
  isBoss?: boolean;
  /** Ячейка корневого моба (см. `MobConfig.position`). */
  position?: number;
  /** Стратегия расстановки его призывов (см. `MobConfig.summon_placement`). */
  summon_placement?: SummonPlacement;
}

export interface MobPoolEntry {
  mob_id: string;
  weight: number;
}

/**
 * Босс зоны — это просто моб (по mob_id) + награда за финальный бой.
 * `loot` необязателен: без него гарант-драфт всё равно из 5 карточек, но недостающие
 * источники (золото/эссенция/предметы) заменяются золотом-заглушкой (см. buildRewardOptions).
 */
export interface BossRef {
  mob_id: string;
  loot?: LootTable;
}

/**
 * «Финальность» и «boss-only» выводятся из данных, а не из флага:
 * пустой/отсутствующий `mob_pool` (или `fights` = 0) ⇒ рядовых боёв нет, сразу босс.
 * Топология центра решается в CampScene, не тут.
 */
export interface ZoneConfig {
  id: string;
  name: string;
  faction: string;
  /** Краткое лор-описание области — показывается в тултипе карты. */
  description?: string;
  star: number;
  fights?: { min: number; max: number };
  mob_pool?: MobPoolEntry[];
  /** Общий лут зоны: выпадает с любого убитого рядового моба (лут не привязан к конкретному мобу). */
  mob_loot?: LootTable;
  boss: BossRef;
}
