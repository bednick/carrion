import type { ItemInstance, Rarity, EssenceTier, EssencePool } from './types';
import { NEXT_RARITY, rarityIndex } from './rarity';
import { essenceSourceZoneIds, FACTION_ROUTES } from '../zones/registry';
import { t } from '../i18n/t';

// Единый источник правды о крафте — обе сцены (лагерь/экспедиция) считают результат
// и стоимость (эссенция) через этот модуль, чтобы правила не расходились.
// Крафт = улучшение редкости (1 предмет + эссенция, потолок — эпик) и слияние (3 предмета одной
// редкости → 1 следующей, без эссенции и без потолка — единственный путь до legendary).
// Разбора предметов на эссенцию больше нет. Рецептов (два разных предмета → третий новый
// тип) тоже нет — см. docs/mechanics.md.

// Эссенция — ингредиент повышения редкости. Тиров три: обычного (упразднён) и
// легендарного (снаряжение только находится) нет.
export const ESSENCE_TIERS: EssenceTier[] = ['uncommon', 'rare', 'epic'];

/** Потолок обычного улучшения (craftPreview): выше эпика не поднимает — до legendary доводит только слияние (fuseItems). */
export const CRAFT_RARITY_CAP: Rarity = 'epic';

export function emptyEssence(): EssencePool {
  return { uncommon: 0, rare: 0, epic: 0 };
}

// Обмен дорогой эссенции на дешёвую — специально невыгодный курс, нужен только чтобы
// разменять излишек одного тира на нехватку другого, а не как основной источник ресурса.
export const ESSENCE_EXCHANGE_RATE = 3;

/** Тир, на который меняется данный (на один шаг вниз); null — меняться уже некуда. */
export const ESSENCE_EXCHANGE_TARGET: Record<EssenceTier, EssenceTier | null> = {
  uncommon: null, rare: 'uncommon', epic: 'rare',
};

/**
 * Обмен тира `from` открыт, только когда у игрока появился прямой источник этой эссенции —
 * пройдена хотя бы одна зона, чей босс её даёт. Пока источника нет, строка обмена бесполезна
 * (менять нечего) и только путает, поэтому у кузнеца она под замком.
 */
export function isEssenceExchangeUnlocked(from: EssenceTier, completedAreas: string[]): boolean {
  return essenceSourceZoneIds(from).some((z) => completedAreas.includes(z));
}

/**
 * Слияние (fuseItems) открыто, только когда пройдены все три стартовые зоны — по одной от
 * каждой фракции (первый элемент каждого маршрута FACTION_ROUTES). До этого — под замком у
 * кузнеца: единственный путь до legendary иначе доступен раньше, чем игрок прошёл хоть одну зону.
 */
export function isFuseUnlocked(completedAreas: string[]): boolean {
  return Object.values(FACTION_ROUTES).every((route) => completedAreas.includes(route[0]));
}

// Сколько эссенции целевого тира стоит улучшение (см. docs/meta-progression.md).
const UPGRADE_ESSENCE_AMOUNT = 10;

/** Улучшение до тира T тратит 10 ед. эссенции этого тира. */
export function upgradeEssenceCost(target: Rarity): EssencePool {
  const pool = emptyEssence();
  const idx = ESSENCE_TIERS.indexOf(target as EssenceTier);
  if (idx >= 0) pool[ESSENCE_TIERS[idx]] = UPGRADE_ESSENCE_AMOUNT;
  return pool;
}

export type CraftKind = 'upgrade';

/**
 * Результат расчёта крафта для одного слота. Чистый, без побочек —
 * UI рисует слот результата и кнопку, ориентируясь на эти поля.
 */
export interface CraftPreview {
  /** Что получится, либо null если улучшение невозможно. */
  result: ItemInstance | null;
  kind: CraftKind | null;
  /** Эссенция-ингредиент улучшения; null если result == null. */
  essenceCost: EssencePool | null;
  /** Готовый текст ошибки для подсказки/кнопки, либо null если крафт возможен. */
  error: string | null;
}

const EMPTY: Omit<CraftPreview, 'error'> = { result: null, kind: null, essenceCost: null };

/**
 * Считает результат улучшения одного предмета: следующая редкость + стоимость эссенции.
 * Крафт из двух предметов (рецепты) удалён — остаётся только улучшение редкости.
 */
export function craftPreview(
  a: ItemInstance | null,
  b: ItemInstance | null,
): CraftPreview {
  const single = a ?? b;
  if (!single) return { ...EMPTY, error: t('craft_error_add_item') };
  if (a && b) return { ...EMPTY, error: t('craft_error_single_item_only') };

  const up = NEXT_RARITY[single.rarity];
  if (!up) return { ...EMPTY, error: t('craft_error_already_legendary') };
  if (rarityIndex(up) > rarityIndex(CRAFT_RARITY_CAP)) {
    return { ...EMPTY, error: t('craft_error_legendary_find_only') };
  }
  const result: ItemInstance = { item_id: single.item_id, rarity: up };
  return {
    result, kind: 'upgrade',
    essenceCost: upgradeEssenceCost(up), error: null,
  };
}

/** Сколько предметов нужно для слияния. */
export const FUSE_COUNT = 3;

export interface FusePreview {
  /** Целевая редкость, если слияние возможно прямо сейчас; иначе null. */
  nextRarity: Rarity | null;
  error: string | null;
}

/**
 * Проверка готовности слияния: 3 предмета одной редкости → следующая редкость.
 * В отличие от craftPreview — без эссенции и без CRAFT_RARITY_CAP (единственный путь
 * скрафтить legendary). Сам предмет-результат здесь не выбирается — это делает fuseItems()
 * в момент подтверждения, а не превью, потому что результат случаен.
 */
export function fusePreview(items: (ItemInstance | null)[]): FusePreview {
  const filled = items.filter((i): i is ItemInstance => !!i);
  if (filled.length < FUSE_COUNT) return { nextRarity: null, error: t('craft_error_need_n_items', { count: FUSE_COUNT }) };
  const rarity = filled[0].rarity;
  if (filled.some((i) => i.rarity !== rarity)) return { nextRarity: null, error: t('msg_rarity_must_match') };
  const up = NEXT_RARITY[rarity];
  if (!up) return { nextRarity: null, error: t('craft_error_already_legendary_fuse') };
  return { nextRarity: up, error: null };
}

/**
 * Итог слияния: тип предмета — случайно один из трёх вложенных, редкость — на ступень выше.
 * Поэтому 3 одинаковых предмета гарантируют улучшение именно этого предмета.
 */
export function fuseItems(items: ItemInstance[]): ItemInstance {
  const picked = items[Math.floor(Math.random() * items.length)];
  return { item_id: picked.item_id, rarity: NEXT_RARITY[picked.rarity]! };
}
