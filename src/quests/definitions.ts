import type { EssenceTier } from '../items/types';

export interface QuestRecord {
  id: string;
  progress: number;
  target: number;
}

export type QuestReward =
  | { type: 'unlock_area'; areaId: string }
  | { type: 'essence'; tier: EssenceTier; amount: number };

/** Стат-счётчики, по которым может авто-засчитываться квест (см. PlayerStats). */
export type StatCountKey =
  | 'mobs_killed'
  | 'items_crafted'
  | 'items_carried_out'
  | 'zones_entered'
  | 'zones_returned';

/**
 * Условие завершения квеста:
 * - `stat` — засчитывается, как только `stats[stat][id] >= count` (или сумма по всем id,
 *   если id опущен) — в том числе задним числом при выдаче, если игрок выполнил его заранее;
 * - `zone_items` — засчитывается, когда для КАЖДОГО item_id из `itemIds` в
 *   `stats.items_carried_out[id] > 0` (предмет хоть раз вынесен в сундук). Квест с таким
 *   условием должен иметь `target === itemIds.length`, чтобы прогресс `N/M` был корректен;
 * - `battlefield_depth` — засчитывается, когда лучший забег в endless-зоне
 *   (`meta.battlefield_best_depth`) дотянул до `depth`. Квест с таким условием должен иметь
 *   `target === depth`, чтобы прогресс `N/M` был корректен.
 */
export type QuestCondition =
  | { kind: 'stat'; stat: StatCountKey; id?: string; count?: number }
  | { kind: 'zone_items'; itemIds: string[] }
  | { kind: 'battlefield_depth'; depth: number };

export interface QuestDef {
  id: string;
  title: string;
  description: string;
  target: number;
  rewards: QuestReward[];
  next?: string[];
  condition?: QuestCondition;
  /** Зоны (id из MAP_ZONE_LAYOUT), в которых можно выполнить квест — для маркера «?» на карте. */
  areas?: string[];
}

export const QUEST_DEFS: Record<string, QuestDef> = {
  tutorial_equip: {
    id: 'tutorial_equip',
    title: 'Снаряжение',
    description: 'Наденьте любой предмет',
    target: 1,
    rewards: [],
  },

  // ── Зональные квесты: по одному на каждую из 9 областей ──────────────
  // Цель боевого квеста (<zone>_clear) — добить босса локации. Условие завязано
  // на zones_returned (растёт только при полном зачёте зоны = добивании босса;
  // ретрит не считается) — устойчивее mobs_killed, у которого некоторые боссы
  // делят mob_id. Награда — эссенция (тир и количество растут по мере
  // продвижения по маршруту, см. таблицу в docs/quests.md).
  //
  // Квест сбора (collect_<zone>_items) — условие zone_items: нужно вынести в
  // сундук хотя бы один экземпляр каждого предмета из mob_loot/boss.loot зоны.
  // Награда — разблокировка следующей зоны маршрута (unlock_area, замена бывшей
  // покупке проходки за золото) плюс эссенция.
  //
  // <zone>_clear и collect_<zone>_items зоны выдаются ОДНОВРЕМЕННО, а не один за
  // другим: событие, открывающее зону (стартовый сид меты для dead-fields — см.
  // MetaStore.createDefault — или `next` квеста сбора предыдущей зоны маршрута),
  // перечисляет в `next` сразу оба id. `next` самого <zone>_clear на свой
  // collect_<zone>_items оставлен как подстраховка для уже идущих партий (сохранений
  // без единого бампа схемы, см. AGENTS.md) — addActiveQuest идемпотентна по id, так
  // что для новых игр это просто no-op.
  //
  // Финальные зоны маршрутов (crypt/predator-pasture/marauder-lair) квеста
  // сбора не получают — дальше только battlefield, чей гейт завязан на
  // completed_areas трёх финальных зон и этим механизмом не затрагивается.
  //
  // Исключение — dead_fields_clear: помимо своей обычной награды-эссенции, он же (а не
  // collect_dead_fields_items) открывает старты 2-го и 3-го маршрутов (trampled-meadows,
  // armor-dump) вместе с их квестами сбора, чтобы игрок мог пойти в любой из трёх
  // маршрутов сразу после первого прохождения Мёртвых полей, не собирая в них все
  // предметы.

  // Маршрут 1: Мёртвые поля → Руины магов → Склеп
  dead_fields_clear: {
    id: 'dead_fields_clear',
    title: 'Исследовать: Мёртвые поля',
    description: 'Победите босса локации',
    target: 1,
    // Открывает сразу оба других стартовых маршрута — в отличие от обычной пары зон
    // одного маршрута (где следующая зона ждёт полного сбора предметов), старты 2-го
    // и 3-го маршрутов открываются уже первым прохождением Мёртвых полей.
    rewards: [
      { type: 'essence', tier: 'uncommon', amount: 10 },
      { type: 'unlock_area', areaId: 'trampled-meadows' },
      { type: 'unlock_area', areaId: 'armor-dump' },
    ],
    next: [
      'collect_dead_fields_items',
      'trampled_meadows_clear', 'collect_trampled_meadows_items',
      'armor_dump_clear', 'collect_armor_dump_items',
    ],
    condition: { kind: 'stat', stat: 'zones_returned', id: 'dead-fields' },
    areas: ['dead-fields'],
  },
  collect_dead_fields_items: {
    id: 'collect_dead_fields_items',
    title: 'Собрать: Мёртвые поля',
    description: 'Вынесите из экспедиции все предметы этой области',
    target: 3,
    rewards: [
      { type: 'unlock_area', areaId: 'mage-ruins' },
      { type: 'essence', tier: 'rare', amount: 4 },
    ],
    next: ['mage_ruins_clear', 'collect_mage_ruins_items'],
    condition: { kind: 'zone_items', itemIds: ['light_gloves', 'short_sword', 'desperate_plate'] },
    areas: ['dead-fields'],
  },
  mage_ruins_clear: {
    id: 'mage_ruins_clear',
    title: 'Исследовать: Руины магов',
    description: 'Победите босса локации',
    target: 1,
    rewards: [{ type: 'essence', tier: 'rare', amount: 10 }],
    next: ['collect_mage_ruins_items'],
    condition: { kind: 'stat', stat: 'zones_returned', id: 'mage-ruins' },
    areas: ['mage-ruins'],
  },
  collect_mage_ruins_items: {
    id: 'collect_mage_ruins_items',
    title: 'Собрать: Руины магов',
    description: 'Вынесите из экспедиции все предметы этой области',
    target: 3,
    rewards: [
      { type: 'unlock_area', areaId: 'crypt' },
      { type: 'essence', tier: 'epic', amount: 4 },
    ],
    next: ['crypt_clear'],
    condition: { kind: 'zone_items', itemIds: ['rapier', 'gleaming_plate', 'spiked_shield'] },
    areas: ['mage-ruins'],
  },
  crypt_clear: {
    id: 'crypt_clear',
    title: 'Исследовать: Склеп',
    description: 'Победите босса локации',
    target: 1,
    rewards: [{ type: 'essence', tier: 'epic', amount: 10 }], // конечная зона маршрута — дальше только Поле битвы (гейт не меняется)
    condition: { kind: 'stat', stat: 'zones_returned', id: 'crypt' },
    areas: ['crypt'],
  },

  // Маршрут 2: Растоптанные луга → Логово зверей → Пастбище хищников
  trampled_meadows_clear: {
    id: 'trampled_meadows_clear',
    title: 'Исследовать: Растоптанные луга',
    description: 'Победите босса локации',
    target: 1,
    rewards: [{ type: 'essence', tier: 'uncommon', amount: 10 }],
    next: ['collect_trampled_meadows_items'],
    condition: { kind: 'stat', stat: 'zones_returned', id: 'trampled-meadows' },
    areas: ['trampled-meadows'],
  },
  collect_trampled_meadows_items: {
    id: 'collect_trampled_meadows_items',
    title: 'Собрать: Растоптанные луга',
    description: 'Вынесите из экспедиции все предметы этой области',
    target: 3,
    rewards: [
      { type: 'unlock_area', areaId: 'beast-lair' },
      { type: 'essence', tier: 'rare', amount: 4 },
    ],
    next: ['beast_lair_clear', 'collect_beast_lair_items'],
    condition: { kind: 'zone_items', itemIds: ['short_spear', 'comfortable_gloves', 'thread_charm'] },
    areas: ['trampled-meadows'],
  },
  beast_lair_clear: {
    id: 'beast_lair_clear',
    title: 'Исследовать: Логово зверей',
    description: 'Победите босса локации',
    target: 1,
    rewards: [{ type: 'essence', tier: 'rare', amount: 10 }],
    next: ['collect_beast_lair_items'],
    condition: { kind: 'stat', stat: 'zones_returned', id: 'beast-lair' },
    areas: ['beast-lair'],
  },
  collect_beast_lair_items: {
    id: 'collect_beast_lair_items',
    title: 'Собрать: Логово зверей',
    description: 'Вынесите из экспедиции все предметы этой области',
    target: 3,
    rewards: [
      { type: 'unlock_area', areaId: 'predator-pasture' },
      { type: 'essence', tier: 'epic', amount: 4 },
    ],
    next: ['predator_pasture_clear'],
    condition: { kind: 'zone_items', itemIds: ['broadaxe', 'spiked_cuirass', 'buckler'] },
    areas: ['beast-lair'],
  },
  predator_pasture_clear: {
    id: 'predator_pasture_clear',
    title: 'Исследовать: Пастбище хищников',
    description: 'Победите босса локации',
    target: 1,
    rewards: [{ type: 'essence', tier: 'epic', amount: 10 }], // конечная зона маршрута
    condition: { kind: 'stat', stat: 'zones_returned', id: 'predator-pasture' },
    areas: ['predator-pasture'],
  },

  // Маршрут 3: Свалка доспехов → Брошенный лагерь → Логово мародёров
  armor_dump_clear: {
    id: 'armor_dump_clear',
    title: 'Исследовать: Свалка доспехов',
    description: 'Победите босса локации',
    target: 1,
    rewards: [{ type: 'essence', tier: 'uncommon', amount: 10 }],
    next: ['collect_armor_dump_items'],
    condition: { kind: 'stat', stat: 'zones_returned', id: 'armor-dump' },
    areas: ['armor-dump'],
  },
  collect_armor_dump_items: {
    id: 'collect_armor_dump_items',
    title: 'Собрать: Свалка доспехов',
    description: 'Вынесите из экспедиции все предметы этой области',
    target: 2,
    rewards: [
      { type: 'unlock_area', areaId: 'abandoned-camp' },
      { type: 'essence', tier: 'rare', amount: 4 },
    ],
    next: ['abandoned_camp_clear', 'collect_abandoned_camp_items'],
    condition: { kind: 'zone_items', itemIds: ['battle_staff', 'heavy_gloves'] },
    areas: ['armor-dump'],
  },
  abandoned_camp_clear: {
    id: 'abandoned_camp_clear',
    title: 'Исследовать: Брошенный лагерь',
    description: 'Победите босса локации',
    target: 1,
    rewards: [{ type: 'essence', tier: 'rare', amount: 10 }],
    next: ['collect_abandoned_camp_items'],
    condition: { kind: 'stat', stat: 'zones_returned', id: 'abandoned-camp' },
    areas: ['abandoned-camp'],
  },
  collect_abandoned_camp_items: {
    id: 'collect_abandoned_camp_items',
    title: 'Собрать: Брошенный лагерь',
    description: 'Вынесите из экспедиции все предметы этой области',
    target: 3,
    rewards: [
      { type: 'unlock_area', areaId: 'marauder-lair' },
      { type: 'essence', tier: 'epic', amount: 4 },
    ],
    next: ['marauder_lair_clear'],
    condition: { kind: 'zone_items', itemIds: ['war_pick', 'heavy_plate', 'heavy_shield'] },
    areas: ['abandoned-camp'],
  },
  marauder_lair_clear: {
    id: 'marauder_lair_clear',
    title: 'Исследовать: Логово мародёров',
    description: 'Победите босса локации',
    target: 1,
    rewards: [{ type: 'essence', tier: 'epic', amount: 10 }], // конечная зона маршрута
    condition: { kind: 'stat', stat: 'zones_returned', id: 'marauder-lair' },
    areas: ['marauder-lair'],
  },

  // ── Поле битвы: цепочка на глубину забега ────────────────────────────
  // Отдельная ветка, не входящая в маршрутные пары <zone>_clear / collect_<zone>_items:
  // Поле битвы — endless-зона без босса и без лута, единственный её выхлоп — рекорд
  // глубины. Эти пять квестов и есть награда за зону.
  //
  // Первый квест не выдаётся ничьим `next`: гейт Поля битвы — не квест, а
  // completed_areas трёх финальных зон (MetaStore.isCenterUnlocked). Поэтому
  // battlefield_survive_10 выдаётся из QuestSystem.grantBattlefieldChain, как только
  // центр открылся; дальше цепочка идёт обычным `next`.
  //
  // Условие — battlefield_depth по meta.battlefield_best_depth (лучший забег, а не сумма
  // боёв за все заходы). Рекорд пишется и при смерти, и при отступлении — см.
  // ExpeditionScene.onHeroDeath / retreatToCamp.
  //
  // unlock_area в наградах нет: открывать после Поля битвы нечего.
  battlefield_survive_10: {
    id: 'battlefield_survive_10',
    title: 'Поле битвы: 10 боёв',
    description: 'Продержитесь 10 боёв за один забег',
    target: 10,
    rewards: [
      { type: 'essence', tier: 'uncommon', amount: 50 },
      { type: 'essence', tier: 'rare', amount: 50 },
      { type: 'essence', tier: 'epic', amount: 50 },
    ],
    next: ['battlefield_survive_20'],
    condition: { kind: 'battlefield_depth', depth: 10 },
    areas: ['battlefield'],
  },
  battlefield_survive_20: {
    id: 'battlefield_survive_20',
    title: 'Поле битвы: 20 боёв',
    description: 'Продержитесь 20 боёв за один забег',
    target: 20,
    rewards: [
      { type: 'essence', tier: 'uncommon', amount: 50 },
      { type: 'essence', tier: 'rare', amount: 50 },
      { type: 'essence', tier: 'epic', amount: 50 },
    ],
    next: ['battlefield_survive_30'],
    condition: { kind: 'battlefield_depth', depth: 20 },
    areas: ['battlefield'],
  },
  battlefield_survive_30: {
    id: 'battlefield_survive_30',
    title: 'Поле битвы: 30 боёв',
    description: 'Продержитесь 30 боёв за один забег',
    target: 30,
    rewards: [
      { type: 'essence', tier: 'uncommon', amount: 50 },
      { type: 'essence', tier: 'rare', amount: 50 },
      { type: 'essence', tier: 'epic', amount: 50 },
    ],
    next: ['battlefield_survive_40'],
    condition: { kind: 'battlefield_depth', depth: 30 },
    areas: ['battlefield'],
  },
  battlefield_survive_40: {
    id: 'battlefield_survive_40',
    title: 'Поле битвы: 40 боёв',
    description: 'Продержитесь 40 боёв за один забег',
    target: 40,
    rewards: [
      { type: 'essence', tier: 'uncommon', amount: 50 },
      { type: 'essence', tier: 'rare', amount: 50 },
      { type: 'essence', tier: 'epic', amount: 50 },
    ],
    next: ['battlefield_survive_50'],
    condition: { kind: 'battlefield_depth', depth: 40 },
    areas: ['battlefield'],
  },
  battlefield_survive_50: {
    id: 'battlefield_survive_50',
    title: 'Поле битвы: 50 боёв',
    description: 'Продержитесь 50 боёв за один забег',
    target: 50,
    rewards: [
      { type: 'essence', tier: 'uncommon', amount: 50 },
      { type: 'essence', tier: 'rare', amount: 50 },
      { type: 'essence', tier: 'epic', amount: 50 },
    ], // конец цепочки — дальше только рекорд ради рекорда
    condition: { kind: 'battlefield_depth', depth: 50 },
    areas: ['battlefield'],
  },
};
