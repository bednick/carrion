// Карта звуковых ключей → файл(ы) в public/audio. Ключи в snake_case, как остальные
// конфиги проекта. Источник сэмплов — Kenney.nl (CC0), см. public/audio/CREDITS.txt.
// Значение может быть массивом вариантов — тогда на событие проигрывается случайный
// (см. SoundManager.play). Чтобы добавить вариант: положи файл в public/audio и впиши
// его сюда в массив рядом с остальными.
export const SOUND_FILES = {
  // Боевые (проигрываются из колбэков ExpeditionScene — презентационный слой)
  hero_attack:  ['/audio/hero_attack.1.ogg', '/audio/hero_attack.2.ogg', '/audio/hero_attack.3.ogg'], // взмах/удар героя
  hero_hurt:    '/audio/hero_hurt.ogg',      // герой получает урон
  walking:      ['/audio/walking.1.ogg', '/audio/walking.2.ogg', '/audio/walking.3.ogg'], // шаги героя в походе
  block:        ['/audio/block.1.ogg', '/audio/block.2.ogg', '/audio/block.3.ogg'], // удар отклонён
  enemy_death:  '/audio/enemy_death.ogg',    // смерть обычного моба
  boss_victory: '/audio/boss_victory.ogg',   // победа над боссом

  // UI / глобальные (проигрываются из EventBus-подписок SoundManager)
  loot_pickup:  '/audio/loot_pickup.ogg',    // предмет ушёл в рюкзак
  disassemble:  '/audio/disassemble.ogg',    // предмет разобран в металл
  craft:        '/audio/craft.ogg',          // успешный крафт
  sell:         '/audio/sell.ogg',           // продажа за золото
} as const;

export type SoundKey = keyof typeof SOUND_FILES;

// Все варианты файла для ключа в виде массива (одиночный файл → массив из одного).
export function soundVariants(key: SoundKey): readonly string[] {
  const v = SOUND_FILES[key];
  return Array.isArray(v) ? v : [v as string];
}

// Ключ ассета в кэше Phaser для конкретного варианта. Нулевой вариант хранится под
// самим ключом — так старые места, грузящие/играющие по ключу, продолжают работать.
export function soundAssetKey(key: SoundKey, index: number): string {
  return index === 0 ? key : `${key}#${index}`;
}

// Зацикленные музыкальные/эмбиент-слои. Играются параллельно, каждый со своей громкостью.
// Как и SOUND_FILES, значение может быть массивом вариантов — при старте слоя берётся
// случайный (см. SoundManager.playMusicLayers). Громкость/мьют ключуются логическим
// ключом, поэтому вариант на выбор громкости не влияет.
export const MUSIC_FILES = {
  amb_campfire: ['/audio/music/amb_campfire.1.ogg', '/audio/music/amb_campfire.2.ogg'],
  amb_flute:    '/audio/music/amb_flute.mp3',
  amb_draft:    '/audio/music/amb_draft.ogg', // фоновый эмбиент похода (все зоны)
} as const;

export type MusicKey = keyof typeof MUSIC_FILES;

// Все варианты файла для музыкального ключа в виде массива.
export function musicVariants(key: MusicKey): readonly string[] {
  const v = MUSIC_FILES[key];
  return Array.isArray(v) ? v : [v as string];
}

// Ключ ассета в кэше Phaser для конкретного варианта (нулевой — под самим ключом).
export function musicAssetKey(key: MusicKey, index: number): string {
  return index === 0 ? key : `${key}#${index}`;
}
