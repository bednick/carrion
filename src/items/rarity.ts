import type { Rarity } from './types';

/**
 * Единственный источник правды по шкале редкости: порядок, индексы, подписи, цвета и скейл статов.
 * Раньше лестница `common…legendary` была продублирована в craft/loot/MetaStore/balance/CampScene,
 * а цвета — в Tooltip и itemIcon; расхождения ловились только глазами. Всё, что зависит от порядка
 * или названия редкости, обязано импортироваться отсюда.
 *
 * Редкость зоны (`ZoneConfig.rarity`) живёт на этой же шкале — см. `src/zones/registry.ts`.
 */

export const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

const RARITY_INDEX: Record<Rarity, number> = RARITY_ORDER.reduce((acc, r, i) => {
  acc[r] = i;
  return acc;
}, {} as Record<Rarity, number>);

/** Порядковый номер редкости (common=0 … legendary=4) — для сортировок и кривых скейла. */
export function rarityIndex(rarity: Rarity): number {
  return RARITY_INDEX[rarity];
}

/** Следующая ступень; null у legendary (выше некуда). */
export const NEXT_RARITY: Record<Rarity, Rarity | null> = RARITY_ORDER.reduce((acc, r, i) => {
  acc[r] = RARITY_ORDER[i + 1] ?? null;
  return acc;
}, {} as Record<Rarity, Rarity | null>);

/** Прилагательное в им. падеже, муж. род, строчное («обычный предмет»). */
export const RARITY_NAMES: Record<Rarity, string> = {
  common: 'обычный', uncommon: 'необычный', rare: 'редкий', epic: 'эпический', legendary: 'легендарный',
};

/** То же с заглавной — заголовки и выпадашки балансных страниц. */
export const RARITY_LABEL: Record<Rarity, string> = RARITY_ORDER.reduce((acc, r) => {
  acc[r] = RARITY_NAMES[r].charAt(0).toUpperCase() + RARITY_NAMES[r].slice(1);
  return acc;
}, {} as Record<Rarity, string>);

/** Цвет редкости строкой — для текста Phaser и HTML балансных страниц. */
export const RARITY_HEX: Record<Rarity, string> = {
  common: '#ffffff',
  uncommon: '#55ff55',
  rare: '#5555ff',
  epic: '#aa00ff',
  legendary: '#ff8800',
};

/** Тот же цвет числом — для геометрии Phaser (заливки, обводки, градиенты плашек). */
export const RARITY_COLORS: Record<Rarity, number> = RARITY_ORDER.reduce((acc, r) => {
  acc[r] = parseInt(RARITY_HEX[r].slice(1), 16);
  return acc;
}, {} as Record<Rarity, number>);

/** Геометрическая кривая стата по редкости: base × scale^index. */
export function scaleByRarity(base: number, rarity: Rarity, scale: number): number {
  return base * Math.pow(scale, RARITY_INDEX[rarity]);
}
