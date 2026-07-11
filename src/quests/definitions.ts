export interface QuestRecord {
  id: string;
  progress: number;
  target: number;
}

export type RewardType = 'gold' | 'unlock_area' | 'quest';

export interface QuestReward {
  type: RewardType;
  value?: number;
  questId?: string;
  areaId?: string;
}

/** Стат-счётчики, по которым может авто-засчитываться квест (см. PlayerStats). */
export type StatCountKey =
  | 'mobs_killed'
  | 'items_crafted'
  | 'items_carried_out'
  | 'zones_entered'
  | 'zones_returned';

/**
 * Условие на статистику. Квест с `condition` засчитывается, как только
 * `stats[stat][id] >= count` (или сумма по всем id, если id опущен) — в том
 * числе задним числом при выдаче, если игрок выполнил его заранее.
 */
export interface QuestCondition {
  stat: StatCountKey;
  id?: string;
  count?: number; // по умолчанию 1
}

export interface QuestDef {
  id: string;
  title: string;
  description: string;
  target: number;
  rewards: QuestReward[];
  next?: string[];
  condition?: QuestCondition;
}

export const QUEST_DEFS: Record<string, QuestDef> = {
  tutorial_equip: {
    id: 'tutorial_equip',
    title: 'Снаряжение',
    description: 'Наденьте любой предмет',
    target: 1,
    rewards: [{ type: 'gold', value: 10 }],
  },
  tutorial_sell: {
    id: 'tutorial_sell',
    title: 'Первая продажа',
    description: 'Продайте предмет скупщику',
    target: 1,
    rewards: [{ type: 'gold', value: 15 }],
  },
  tutorial_disassemble: {
    id: 'tutorial_disassemble',
    title: 'Разборка',
    description: 'Разберите предмет у кузнеца',
    target: 1,
    rewards: [
      { type: 'gold', value: 10 },
    ],
  },

  // ── Зональные квесты: по одному на каждую из 9 областей ──────────────
  // Цель — добить босса локации. Условие завязано на zones_returned (растёт
  // только при полном зачёте зоны = добивании босса; ретрит не считается) —
  // это устойчивее mobs_killed, у которого некоторые боссы делят mob_id.
  // Награда: золото + автоматически открывается ПОКУПКА следующей зоны
  // (completeArea → зона проходит prereq и становится покупаемой).
  // next выдаёт квест следующей зоны маршрута (см. FACTION_ROUTES в CampScene).

  // Маршрут 1: Мёртвые поля → Руины магов → Склеп
  dead_fields_clear: {
    id: 'dead_fields_clear',
    title: 'Исследовать область: Мёртвые поля',
    description: 'Победите босса локации',
    target: 1,
    // ½ проходки в Руины магов (500) + бесплатное открытие двух других стартовых
    // зон маршрутов (Растоптанные луга и Свалка доспехов — без покупки проходки).
    rewards: [
      { type: 'gold', value: 250 },
      { type: 'unlock_area', areaId: 'trampled-meadows' },
      { type: 'unlock_area', areaId: 'armor-dump' },
    ],
    // Открываем и цепочку Руин магов, и стартовые квесты двух открытых зон
    // (раньше они выдавались при покупке проходки — теперь покупки нет).
    next: ['mage_ruins_clear', 'trampled_meadows_clear', 'armor_dump_clear'],
    condition: { stat: 'zones_returned', id: 'dead-fields' },
  },
  mage_ruins_clear: {
    id: 'mage_ruins_clear',
    title: 'Исследовать область: Руины магов',
    description: 'Победите босса локации',
    target: 1,
    rewards: [{ type: 'gold', value: 2500 }], // ½ проходки в Склеп (5000)
    next: ['crypt_clear'],
    condition: { stat: 'zones_returned', id: 'mage-ruins' },
  },
  crypt_clear: {
    id: 'crypt_clear',
    title: 'Исследовать область: Склеп',
    description: 'Победите босса локации',
    target: 1,
    rewards: [{ type: 'gold', value: 2500 }], // конечная зона: ½ своей цены (5000)
    condition: { stat: 'zones_returned', id: 'crypt' },
  },

  // Маршрут 2: Растоптанные луга → Логово зверей → Пастбище хищников
  trampled_meadows_clear: {
    id: 'trampled_meadows_clear',
    title: 'Исследовать область: Растоптанные луга',
    description: 'Победите босса локации',
    target: 1,
    rewards: [{ type: 'gold', value: 250 }], // ½ проходки в Логово зверей (500)
    next: ['beast_lair_clear'],
    condition: { stat: 'zones_returned', id: 'trampled-meadows' },
  },
  beast_lair_clear: {
    id: 'beast_lair_clear',
    title: 'Исследовать область: Логово зверей',
    description: 'Победите босса локации',
    target: 1,
    rewards: [{ type: 'gold', value: 2500 }], // ½ проходки в Пастбище хищников (5000)
    next: ['predator_pasture_clear'],
    condition: { stat: 'zones_returned', id: 'beast-lair' },
  },
  predator_pasture_clear: {
    id: 'predator_pasture_clear',
    title: 'Исследовать область: Пастбище хищников',
    description: 'Победите босса локации',
    target: 1,
    rewards: [{ type: 'gold', value: 2500 }], // конечная зона: ½ своей цены (5000)
    condition: { stat: 'zones_returned', id: 'predator-pasture' },
  },

  // Маршрут 3: Свалка доспехов → Брошенный лагерь → Логово мародёров
  armor_dump_clear: {
    id: 'armor_dump_clear',
    title: 'Исследовать область: Свалка доспехов',
    description: 'Победите босса локации',
    target: 1,
    rewards: [{ type: 'gold', value: 250 }], // ½ проходки в Брошенный лагерь (500)
    next: ['abandoned_camp_clear'],
    condition: { stat: 'zones_returned', id: 'armor-dump' },
  },
  abandoned_camp_clear: {
    id: 'abandoned_camp_clear',
    title: 'Исследовать область: Брошенный лагерь',
    description: 'Победите босса локации',
    target: 1,
    rewards: [{ type: 'gold', value: 2500 }], // ½ проходки в Логово мародёров (5000)
    next: ['marauder_lair_clear'],
    condition: { stat: 'zones_returned', id: 'abandoned-camp' },
  },
  marauder_lair_clear: {
    id: 'marauder_lair_clear',
    title: 'Исследовать область: Логово мародёров',
    description: 'Победите босса локации',
    target: 1,
    rewards: [{ type: 'gold', value: 2500 }], // конечная зона: ½ своей цены (5000)
    condition: { stat: 'zones_returned', id: 'marauder-lair' },
  },

  find_uncommon: {
    id: 'find_uncommon',
    title: 'Коллекционер',
    description: 'Найдите предмет редкости «Необычный»',
    target: 1,
    rewards: [
      { type: 'gold', value: 25 },
    ],
  },
};
