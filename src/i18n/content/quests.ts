/** Заголовки/описания квестов на обоих языках. Ключ — quest_id (см. `src/quests/definitions.ts`,
 *  поля `title`/`description` там больше нет — переехали сюда, см. docs/quests.md). */
export const QUEST_TEXT: Record<string, { title: { ru: string; en: string }; description: { ru: string; en: string } }> = {
  tutorial_equip: {
    title: { ru: 'Снаряжение', en: 'Gear Up' },
    description: { ru: 'Наденьте любой предмет', en: 'Equip any item' },
  },
  dead_fields_clear: {
    title: { ru: 'Исследовать: Мёртвые поля', en: 'Explore: Dead Fields' },
    description: { ru: 'Победите босса локации', en: "Defeat the area's boss" },
  },
  collect_dead_fields_items: {
    title: { ru: 'Собрать: Мёртвые поля', en: 'Collect: Dead Fields' },
    description: { ru: 'Вынесите из экспедиции все предметы этой области', en: 'Carry every item from this area out of an expedition' },
  },
  mage_ruins_clear: {
    title: { ru: 'Исследовать: Руины магов', en: 'Explore: Mage Ruins' },
    description: { ru: 'Победите босса локации', en: "Defeat the area's boss" },
  },
  collect_mage_ruins_items: {
    title: { ru: 'Собрать: Руины магов', en: 'Collect: Mage Ruins' },
    description: { ru: 'Вынесите из экспедиции все предметы этой области', en: 'Carry every item from this area out of an expedition' },
  },
  crypt_clear: {
    title: { ru: 'Исследовать: Склеп', en: 'Explore: Crypt' },
    description: { ru: 'Победите босса локации', en: "Defeat the area's boss" },
  },
  trampled_meadows_clear: {
    title: { ru: 'Исследовать: Растоптанные луга', en: 'Explore: Trampled Meadows' },
    description: { ru: 'Победите босса локации', en: "Defeat the area's boss" },
  },
  collect_trampled_meadows_items: {
    title: { ru: 'Собрать: Растоптанные луга', en: 'Collect: Trampled Meadows' },
    description: { ru: 'Вынесите из экспедиции все предметы этой области', en: 'Carry every item from this area out of an expedition' },
  },
  beast_lair_clear: {
    title: { ru: 'Исследовать: Логово зверей', en: 'Explore: Beast Lair' },
    description: { ru: 'Победите босса локации', en: "Defeat the area's boss" },
  },
  collect_beast_lair_items: {
    title: { ru: 'Собрать: Логово зверей', en: 'Collect: Beast Lair' },
    description: { ru: 'Вынесите из экспедиции все предметы этой области', en: 'Carry every item from this area out of an expedition' },
  },
  predator_pasture_clear: {
    title: { ru: 'Исследовать: Пастбище хищников', en: 'Explore: Predator Pasture' },
    description: { ru: 'Победите босса локации', en: "Defeat the area's boss" },
  },
  armor_dump_clear: {
    title: { ru: 'Исследовать: Свалка доспехов', en: 'Explore: Armor Dump' },
    description: { ru: 'Победите босса локации', en: "Defeat the area's boss" },
  },
  collect_armor_dump_items: {
    title: { ru: 'Собрать: Свалка доспехов', en: 'Collect: Armor Dump' },
    description: { ru: 'Вынесите из экспедиции все предметы этой области', en: 'Carry every item from this area out of an expedition' },
  },
  abandoned_camp_clear: {
    title: { ru: 'Исследовать: Брошенный лагерь', en: 'Explore: Abandoned Camp' },
    description: { ru: 'Победите босса локации', en: "Defeat the area's boss" },
  },
  collect_abandoned_camp_items: {
    title: { ru: 'Собрать: Брошенный лагерь', en: 'Collect: Abandoned Camp' },
    description: { ru: 'Вынесите из экспедиции все предметы этой области', en: 'Carry every item from this area out of an expedition' },
  },
  marauder_lair_clear: {
    title: { ru: 'Исследовать: Логово мародёров', en: 'Explore: Marauder Lair' },
    description: { ru: 'Победите босса локации', en: "Defeat the area's boss" },
  },
  battlefield_survive_10: {
    title: { ru: 'Поле битвы: 10 боёв', en: 'Battlefield: 10 Fights' },
    description: { ru: 'Продержитесь 10 боёв за один забег', en: 'Survive 10 fights in a single run' },
  },
  battlefield_survive_20: {
    title: { ru: 'Поле битвы: 20 боёв', en: 'Battlefield: 20 Fights' },
    description: { ru: 'Продержитесь 20 боёв за один забег', en: 'Survive 20 fights in a single run' },
  },
  battlefield_survive_30: {
    title: { ru: 'Поле битвы: 30 боёв', en: 'Battlefield: 30 Fights' },
    description: { ru: 'Продержитесь 30 боёв за один забег', en: 'Survive 30 fights in a single run' },
  },
  battlefield_survive_40: {
    title: { ru: 'Поле битвы: 40 боёв', en: 'Battlefield: 40 Fights' },
    description: { ru: 'Продержитесь 40 боёв за один забег', en: 'Survive 40 fights in a single run' },
  },
  battlefield_survive_50: {
    title: { ru: 'Поле битвы: 50 боёв', en: 'Battlefield: 50 Fights' },
    description: { ru: 'Продержитесь 50 боёв за один забег', en: 'Survive 50 fights in a single run' },
  },
};
