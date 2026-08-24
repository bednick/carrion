/** Названия и описания зон на обоих языках. Ключ — zone_id (см. `src/zones/<id>/config.json`, поля
 *  `name`/`description` там больше нет — переехали сюда, см. docs/content.zones.format.md). */
export const ZONE_TEXT: Record<string, { name: { ru: string; en: string }; description: { ru: string; en: string } }> = {
  'abandoned-camp': {
    name: { ru: 'Брошенный лагерь', en: 'Abandoned Camp' },
    description: {
      ru: 'Военный лагерь под ветеранами-мародёрами. Строй и доспех. Порог перед Полем Битвы.',
      en: 'A war camp held by veteran marauders. Formation and armor. The last threshold before the Battlefield.',
    },
  },
  'armor-dump': {
    name: { ru: 'Свалка доспехов', en: 'Armor Dump' },
    description: {
      ru: 'Свалка снятой брони мародёров. Тут копаются самые неопытные из банды.',
      en: 'A dump of armor stripped from marauders. Only the greenest of the gang dig through it here.',
    },
  },
  battlefield: {
    name: { ru: 'Поле Битвы', en: 'The Battlefield' },
    description: {
      ru: 'Эпицентр трёх армий. Каждый павший командир поднимается снова — и поле не отпускает, пока не падёшь ты.',
      en: "The epicenter of three armies. Every fallen commander rises again — and the field won't let go until you fall too.",
    },
  },
  'beast-lair': {
    name: { ru: 'Логово зверей', en: 'Beast Lair' },
    description: {
      ru: 'Норы и логова среди костей. Стаи не отпускают добычу, пока не разорвут.',
      en: "Burrows and dens among the bones. The packs don't let go of their prey until it's torn apart.",
    },
  },
  crypt: {
    name: { ru: 'Склеп', en: 'Crypt' },
    description: {
      ru: 'Прерванный погребальный ритуал. Мертвецы поднялись сами — голодные и многорукие.',
      en: 'An interrupted burial rite. The dead rose on their own — hungry, and many-handed.',
    },
  },
  'dead-fields': {
    name: { ru: 'Мёртвые поля', en: 'Dead Fields' },
    description: {
      ru: 'Выжженная равнина магической фракции. Ритуалы удержали павших на ногах.',
      en: 'A scorched plain held by the magic faction. Rituals kept the fallen on their feet.',
    },
  },
  'mage-ruins': {
    name: { ru: 'Руины магов', en: 'Mage Ruins' },
    description: {
      ru: 'Развалины лагеря мага-командира. Здесь нежить — оружие, а не случайность.',
      en: "The ruins of a magus-commander's camp. Here, the undead are a weapon, not an accident.",
    },
  },
  'marauder-lair': {
    name: { ru: 'Логово мародёров', en: 'Marauder Lair' },
    description: {
      ru: 'Организованный лагерь банды. Броню снимают не с павших, а с тех, кого свалили.',
      en: "An organized camp of the gang. They don't strip armor off the fallen — they strip it off whoever they knock down.",
    },
  },
  'predator-pasture': {
    name: { ru: 'Пастбище хищников', en: 'Predator Pasture' },
    description: {
      ru: 'Одичавшие боевые кони сбились в яростные табуны. Раненый зверь тут не отступает.',
      en: 'Feral warhorses have banded into ferocious herds. A wounded beast here does not retreat.',
    },
  },
  'training-camp': {
    name: { ru: 'Тренировочный лагерь', en: 'Training Camp' },
    description: {
      ru: 'Двор у самого костра, где новичков учат держать оружие прежде, чем отпустить за край поля.',
      en: "A yard by the campfire, where newcomers are taught to hold a weapon before being sent past the field's edge.",
    },
  },
  'trampled-meadows': {
    name: { ru: 'Растоптанные луга', en: 'Trampled Meadows' },
    description: {
      ru: 'Поле разгона конницы. Взрытая земля, сломанные копья, полчища крыс.',
      en: 'A cavalry charge ground. Torn-up earth, broken spears, swarms of rats.',
    },
  },
};
