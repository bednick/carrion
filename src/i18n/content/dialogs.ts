import { getLocale } from '../../core/Locale';
import type { DialogEntry } from '../../dialogs/definitions';
import type { FactionKey } from '../../zones/registry';
import type { Rarity } from '../../items/types';

/** Реплики НПС на обоих языках. Структура (сегменты/токены item-rarity-essence) идентична для
 *  обоих языков — переезжает вместе с текстом, чтобы порядок токенов в фразе не разъезжался между
 *  ru/en. См. `src/dialogs/definitions.ts` за типами (`DialogEntry`/`DialogSegment`) и
 *  `src/core/DialogSystem.ts` за триггерами показа. */

const FACTION_INFO_RU: Record<FactionKey, DialogEntry> = {
  undead: {
    npc: 'dealer',
    text: 'Ты пал на землях Нежити. Здоровья в них мало, зато удар часто уходит впустую: дух '
      + 'развоплотится, костяк примет замах на кость. Гасят целиком — хоть молотом бей. А убьёшь — '
      + 'встают снова. Тяжёлый редкий замах тут только теряется: не прошёл — стоишь без дела полбоя. '
      + 'Бей часто и мелко: этот бой берут скоростью, а не силой замаха.',
  },
  beasts: {
    npc: 'dealer',
    text: 'Ты пал на землях Зверей. Опасность здесь не в одном враге, а в своре — они наваливаются '
      + 'со всех сторон и постоянно доливают свежими телами. Тяжёлый удар по одной цели тут почти '
      + 'бесполезен: свора всё равно задавит числом. Нужно оружие, бьющее сразу по нескольким целям '
      + '— прошив или широкий замах.',
  },
  marauders: {
    npc: 'dealer',
    text: 'Ты пал на землях Мародёров. Здесь враг один, но закован в броню и отвечает контрударом '
      + 'на каждый твой удар. Частые лёгкие удары ловят блок и прилетают назад шипами — нужен '
      + 'редкий, но тяжёлый удар, который продавливает броню за один раз.',
  },
};

const FACTION_INFO_EN: Record<FactionKey, DialogEntry> = {
  undead: {
    npc: 'dealer',
    text: "You fell on Undead ground. They're weak, but a lot of your swings will land on nothing: "
      + "a spirit dissolves out of the way, bone shrugs off bone. They can shrug off a hit entirely "
      + "— swing a hammer and it still won't matter. And killing one just means it gets back up. A "
      + "rare, heavy swing is wasted here — miss it, and you're standing idle for half the fight. Hit "
      + "often and light: this fight is won on speed, not swing weight.",
  },
  beasts: {
    npc: 'dealer',
    text: "You fell on Beast ground. The danger here isn't one enemy — it's the pack. They pile in "
      + "from every side and keep feeding in fresh bodies. A heavy hit on a single target does almost "
      + "nothing here: the pack will still swarm you by numbers. You need a weapon that hits several "
      + "targets at once — a piercing thrust or a wide swing.",
  },
  marauders: {
    npc: 'dealer',
    text: "You fell on Marauder ground. Here it's one enemy, but armored, and it counters every hit "
      + "you land. Frequent light hits just get blocked and bounce back off the spikes — you need a "
      + "rare, heavy blow that crushes through the armor in one go.",
  },
};

const FACTION_GIFT_RU: Record<FactionKey, { itemId: string; rarity: Rarity; dialog: DialogEntry }> = {
  undead: {
    itemId: 'dagger',
    rarity: 'common',
    dialog: {
      npc: 'dealer',
      text: [
        { text: 'Возьми вот это — ' },
        { item: 'dagger', rarity: 'common' },
        { text: '. Бьёт часто и несильно: половину ударов они погасят, но с таким темпом это не беда — следующий пройдёт. Загляни в сундук.' },
      ],
    },
  },
  beasts: {
    itemId: 'short_spear',
    rarity: 'common',
    dialog: {
      npc: 'dealer',
      text: [
        { text: 'Возьми ' },
        { item: 'short_spear', rarity: 'common' },
        { text: ' — оно достаёт цель и ещё одного врага позади неё одним ударом. Загляни в сундук.' },
      ],
    },
  },
  marauders: {
    itemId: 'battle_staff',
    rarity: 'common',
    dialog: {
      npc: 'dealer',
      text: [
        { text: 'Возьми ' },
        { item: 'battle_staff', rarity: 'common' },
        { text: ' — тяжёлое оружие для одиночного продавливания брони. Загляни в сундук.' },
      ],
    },
  },
};

const FACTION_GIFT_EN: Record<FactionKey, { itemId: string; rarity: Rarity; dialog: DialogEntry }> = {
  undead: {
    itemId: 'dagger',
    rarity: 'common',
    dialog: {
      npc: 'dealer',
      text: [
        { text: 'Take this — ' },
        { item: 'dagger', rarity: 'common' },
        { text: ". It hits often and light: they'll shrug off half your swings, but at this pace that's fine — the next one gets through. Check the chest." },
      ],
    },
  },
  beasts: {
    itemId: 'short_spear',
    rarity: 'common',
    dialog: {
      npc: 'dealer',
      text: [
        { text: 'Take ' },
        { item: 'short_spear', rarity: 'common' },
        { text: ' — it reaches the target and whoever is standing behind it with a single hit. Check the chest.' },
      ],
    },
  },
  marauders: {
    itemId: 'battle_staff',
    rarity: 'common',
    dialog: {
      npc: 'dealer',
      text: [
        { text: 'Take ' },
        { item: 'battle_staff', rarity: 'common' },
        { text: ' — a heavy weapon for crushing through armor one hit at a time. Check the chest.' },
      ],
    },
  },
};

const FACTION_RECOMMEND_RU: Record<FactionKey, DialogEntry> = {
  undead: {
    npc: 'dealer',
    text: [
      { text: 'У тебя уже есть ' },
      { item: 'dagger', rarity: 'common' },
      { text: ' — возьми его на следующую вылазку сюда. Частые лёгкие удары пробиваются сквозь их уклонения и блоки ровнее тяжёлого замаха, да ещё и кормят лечение с регеном, без которых в затяжном бою не выстоять.' },
    ],
  },
  beasts: {
    npc: 'dealer',
    text: [
      { text: 'У тебя уже есть ' },
      { item: 'short_spear', rarity: 'common' },
      { text: ' — самое то против своры. Возьми его на следующую вылазку.' },
    ],
  },
  marauders: {
    npc: 'dealer',
    text: [
      { text: 'У тебя уже есть ' },
      { item: 'battle_staff', rarity: 'common' },
      { text: ' — тяжёлый пробой как раз для одиночной цели в броне. Возьми его в следующий раз.' },
    ],
  },
};

const FACTION_RECOMMEND_EN: Record<FactionKey, DialogEntry> = {
  undead: {
    npc: 'dealer',
    text: [
      { text: 'You already have ' },
      { item: 'dagger', rarity: 'common' },
      { text: " — take it on your next trip here. Frequent light hits get past their dodges and blocks more reliably than a heavy swing, and they also feed lifesteal and regen — you won't last a long fight without those." },
    ],
  },
  beasts: {
    npc: 'dealer',
    text: [
      { text: 'You already have ' },
      { item: 'short_spear', rarity: 'common' },
      { text: ' — perfect against a pack. Take it on your next trip.' },
    ],
  },
  marauders: {
    npc: 'dealer',
    text: [
      { text: 'You already have ' },
      { item: 'battle_staff', rarity: 'common' },
      { text: ' — a heavy breach hit, just right for a single armored target. Take it next time.' },
    ],
  },
};

const SMITH_UNLOCK_DIALOG_RARE_RU: DialogEntry = {
  npc: 'smith',
  text: [
    { text: 'Теперь у меня есть, чем с тобой поменяться — неси ' },
    { essence: 'rare', label: 'редкую' },
    { text: ' эссенцию, отдам взамен три ' },
    { essence: 'uncommon', label: 'необычных' },
    { text: '. Загляни на вкладку обмена.' },
  ],
};
const SMITH_UNLOCK_DIALOG_RARE_EN: DialogEntry = {
  npc: 'smith',
  text: [
    { text: "Now I've got something to trade — bring me " },
    { essence: 'rare', label: 'rare' },
    { text: " essence, and I'll give you three " },
    { essence: 'uncommon', label: 'uncommon' },
    { text: ' in exchange. Check the trade tab.' },
  ],
};

const SMITH_UNLOCK_DIALOG_EPIC_RU: DialogEntry = {
  npc: 'smith',
  text: [
    { text: 'Открылся ещё один обмен — неси ' },
    { essence: 'epic', label: 'эпическую' },
    { text: ' эссенцию, отдам взамен три ' },
    { essence: 'rare', label: 'редких' },
    { text: '. Тот же невыгодный курс.' },
  ],
};
const SMITH_UNLOCK_DIALOG_EPIC_EN: DialogEntry = {
  npc: 'smith',
  text: [
    { text: 'Another trade just opened up — bring me ' },
    { essence: 'epic', label: 'epic' },
    { text: " essence, and I'll give you three " },
    { essence: 'rare', label: 'rare' },
    { text: '. Same lousy rate.' },
  ],
};

const TUTORIAL_REWARD_DIALOG_RU: DialogEntry[] = [
  {
    npc: 'dealer',
    text: 'На ногах устоял — уже неплохо для новичка. Голыми руками там, за краем поля, долго '
      + 'не продержишься, но начало есть.',
  },
  {
    npc: 'dealer',
    text: [
      { text: 'Держи — ' },
      { item: 'desperate_plate', rarity: 'common' },
      { text: '. Сняты с того, кто не вернулся. Дырявые, зато настоящие. Загляни в сундук.' },
    ],
  },
];
const TUTORIAL_REWARD_DIALOG_EN: DialogEntry[] = [
  {
    npc: 'dealer',
    text: "Stayed on your feet — not bad for a rookie. You won't last long out past the field's "
      + 'edge with bare hands, but it\'s a start.',
  },
  {
    npc: 'dealer',
    text: [
      { text: 'Here — ' },
      { item: 'desperate_plate', rarity: 'common' },
      { text: ". Stripped off someone who didn't come back. Full of holes, but real. Check the chest." },
    ],
  },
];

const FUSE_UNLOCK_DIALOG_RU: DialogEntry = {
  npc: 'smith',
  text: [
    { text: 'Теперь я могу сплавлять три предмета одной редкости в один, на редкость выше. Итог '
      + 'решает случай среди трёх вложенных. Таким улучшением можно улучшить предмет до ' },
    { rarity: 'legendary', label: 'легендарного' },
    { text: ' уровня!' },
  ],
};
const FUSE_UNLOCK_DIALOG_EN: DialogEntry = {
  npc: 'smith',
  text: [
    { text: 'I can fuse three items of the same rarity into one, a rarity higher, now. Chance '
      + 'decides the result among the three you put in. This is how you can push an item all the '
      + 'way up to ' },
    { rarity: 'legendary', label: 'legendary' },
    { text: '!' },
  ],
};

export function factionInfo(faction: FactionKey): DialogEntry {
  return (getLocale() === 'ru' ? FACTION_INFO_RU : FACTION_INFO_EN)[faction];
}

export function factionGift(faction: FactionKey): { itemId: string; rarity: Rarity; dialog: DialogEntry } {
  return (getLocale() === 'ru' ? FACTION_GIFT_RU : FACTION_GIFT_EN)[faction];
}

export function factionRecommend(faction: FactionKey): DialogEntry {
  return (getLocale() === 'ru' ? FACTION_RECOMMEND_RU : FACTION_RECOMMEND_EN)[faction];
}

export function smithUnlockDialog(tier: 'rare' | 'epic'): DialogEntry {
  const ru = tier === 'rare' ? SMITH_UNLOCK_DIALOG_RARE_RU : SMITH_UNLOCK_DIALOG_EPIC_RU;
  const en = tier === 'rare' ? SMITH_UNLOCK_DIALOG_RARE_EN : SMITH_UNLOCK_DIALOG_EPIC_EN;
  return getLocale() === 'ru' ? ru : en;
}

export function tutorialRewardDialog(): DialogEntry[] {
  return getLocale() === 'ru' ? TUTORIAL_REWARD_DIALOG_RU : TUTORIAL_REWARD_DIALOG_EN;
}

export function fuseUnlockDialog(): DialogEntry {
  return getLocale() === 'ru' ? FUSE_UNLOCK_DIALOG_RU : FUSE_UNLOCK_DIALOG_EN;
}
