import type { Rarity, EssenceTier } from '../items/types';

export interface LootEntry {
  item_id: string;
  chance: number;
  rarity?: Rarity;
}

/** Диапазон эссенции по тирам: заданные тиры роллятся в [min,max] при выборе карточки эссенции. */
export type EssenceLoot = Partial<Record<EssenceTier, { min: number; max: number }>>;

export interface LootTable {
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
 * dodge → block → armor → thorns. Ничего отдельно не скейлится (значения берутся как есть).
 * - `armor`  — очки: вычитается из каждого входящего удара (`mitigateFlat`, см. `combat/mitigation.ts`).
 *              Не процент — процентная модель осталась только у брони героя. Сильнее давит мелкий чип
 *              (сплеш, шипы, прошив уходят в ноль целиком → движок спавнит `block`), большому пробою
 *              почти не мешает.
 * - `dodge`  — шанс 0..1 полностью погасить входящий удар (спавнит событие `dodge`). Инструмент Нежити
 *              (бестелесность), см. `docs/factions.md`.
 * - `block`  — шанс 0..1 полностью погасить входящий удар (канал `block_chance`, то же короткое
 *              замыкание, что и `dodge`, но следующей стадией резолюции). Инструмент Мародёров (щит),
 *              не пересекается по лору с `dodge`, но технически можно задать оба — см. приоритет
 *              отображения в UI (`src/ui/mobMechanics`).
 * - `thorns` — отражает фиксированный урон обратно в героя за каждый полученный удар.
 */
export interface MobDefense {
  armor?: number;
  dodge?: number;
  block?: number;
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
  /** Сдвиг спрайта относительно его размера после scale (доля 0..1, 0.1 = 10%). Пиксели считаются
   *  от фактических ширины/высоты спрайта — после вписывания в бокс и умножения на ui.scale. */
  move?: { up?: number; down?: number; left?: number; right?: number };
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
 * `loot` необязателен: без него (или без части источников) гарант-драфт просто
 * не показывает соответствующие карточки (см. buildRewardOptions).
 */
export interface BossRef {
  mob_id: string;
  loot?: LootTable;
}

/**
 * Endless-режим зоны (центр карты, `battlefield`): рядовые бои идут бесконечно из `mob_pool`
 * (взвешенный рандом с повторами, как в обычной зоне), без финального босса и награды-выбора —
 * экспедиция заканчивается только смертью или ручным отступлением. `curse_per_fight` — на сколько
 * процентных пунктов растёт входящий по герою урон за каждый пройденный бой (аддитивно, см.
 * `HeroState.damageTakenMult` и `ExpeditionScene`).
 */
export interface EndlessConfig {
  curse_per_fight: number;
}

/**
 * «Boss-only» выводится из данных, а не из флага: пустой/отсутствующий `mob_pool` (или
 * `fights` = 0) ⇒ рядовых боёв нет, сразу босс. Endless — отдельный, явный режим (флаг `endless`),
 * не выводится из данных: у endless-зоны `boss` не указывается вовсе (нет финального боя).
 * Топология центра решается в CampScene, не тут.
 */
export interface ZoneConfig {
  id: string;
  name: string;
  faction: string;
  /** Краткое лор-описание области — показывается в тултипе карты. */
  description?: string;
  /**
   * Редкость области = тир награды её босса (эссенция + центральная карточка драфта).
   * Единственный источник правды по «уровню» зоны: цвет названия на карте, гейт обмена эссенции
   * у кузнеца, звёзды в балансных тулзах (`zoneStars` в registry). Лут рядовых мобов — на ступень
   * ниже. Endless (battlefield) — `legendary`: босса нет, но это высший тир маршрута.
   */
  rarity: Rarity;
  fights?: { min: number; max: number };
  mob_pool?: MobPoolEntry[];
  /** Общий лут зоны: выпадает с любого убитого рядового моба (лут не привязан к конкретному мобу). */
  mob_loot?: LootTable;
  /** Отсутствует у endless-зоны (см. `endless`) — там нет финального боя. */
  boss?: BossRef;
  /** Присутствует только у endless-зоны (см. `EndlessConfig`). */
  endless?: EndlessConfig;
  /**
   * Обучающая зона вне карты/маршрутов (см. `docs/zones/training-camp.md`) — единственный явный
   * флаг такого рода, по аналогии с `endless`. Меняет поведение `ExpeditionScene`: победа над
   * боссом не открывает стандартный драфт награды (`boss.loot`/`mob_loot` у такой зоны пусты —
   * без флага `buildRewardOptions` вернула бы 0 карточек и экран застрял бы), а сразу возвращает
   * в лагерь и помечает `MetaStore.tutorial_completed`. Награда выдаётся отдельно, диалогом НПС.
   */
  tutorial?: boolean;
}
