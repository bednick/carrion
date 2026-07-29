import type { ItemInstance, Rarity, EssenceTier, EssencePool } from './types';

// Единый источник правды о крафте — обе сцены (лагерь/экспедиция) считают результат,
// стоимость (эссенция) и разбор через этот модуль, чтобы правила не расходились.
// Крафт = только улучшение редкости + разбор. Рецептов больше нет (см. docs/mechanics.md).

export const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

export const NEXT_RARITY: Record<Rarity, Rarity | null> = {
  common: 'uncommon', uncommon: 'rare', rare: 'epic', epic: 'legendary', legendary: null,
};

export const RARITY_NAMES: Record<Rarity, string> = {
  common: 'обычный', uncommon: 'необычный', rare: 'редкий', epic: 'эпический', legendary: 'легендарный',
};

// Эссенция — ингредиент повышения редкости. Тиров три: обычного (упразднён) и
// легендарного (снаряжение только находится) нет.
export const ESSENCE_TIERS: EssenceTier[] = ['uncommon', 'rare', 'epic'];

export const ESSENCE_NAMES: Record<EssenceTier, string> = {
  uncommon: 'необычная', rare: 'редкая', epic: 'эпическая',
};

const ESSENCE_SHORT: Record<EssenceTier, string> = {
  uncommon: 'нб', rare: 'рд', epic: 'эп',
};

/** Потолок крафта: улучшить или скрафтить выше эпика нельзя — легендарное только находится. */
export const CRAFT_RARITY_CAP: Rarity = 'epic';

function rarityIdx(r: Rarity): number {
  return RARITY_ORDER.indexOf(r);
}

export function emptyEssence(): EssencePool {
  return { uncommon: 0, rare: 0, epic: 0 };
}

// Сколько эссенции даёт разбор: 4 своего тира + 1 на тир выше (см. docs/meta-progression.md).
const SALVAGE_SELF = 4;
const SALVAGE_HIGHER = 1;

/**
 * Разбор предмета → эссенция (пул). Правила экономики (docs/meta-progression.md):
 * - common → 1 uncommon (обычной эссенции нет, минимальный возврат);
 * - uncommon/rare → 4 своего тира + 1 на тир выше;
 * - epic/legendary → 5 эпической (тира выше epic нет — «+1» упирается в потолок).
 */
export function salvageEssence(item: ItemInstance): EssencePool {
  const pool = emptyEssence();
  if (item.rarity === 'common') {
    pool.uncommon = 1;
    return pool;
  }
  const selfIdx = item.rarity === 'legendary' ? ESSENCE_TIERS.length - 1 : ESSENCE_TIERS.indexOf(item.rarity as EssenceTier);
  pool[ESSENCE_TIERS[selfIdx]] += SALVAGE_SELF;
  const higherIdx = Math.min(selfIdx + 1, ESSENCE_TIERS.length - 1);
  pool[ESSENCE_TIERS[higherIdx]] += SALVAGE_HIGHER;
  return pool;
}

/** Суммарный пул за разбор набора предметов. */
export function sumSalvageEssence(items: ItemInstance[]): EssencePool {
  const total = emptyEssence();
  for (const item of items) {
    const pool = salvageEssence(item);
    for (const tier of ESSENCE_TIERS) total[tier] += pool[tier];
  }
  return total;
}

/**
 * Индексы предметов сундука, которые лишние: для каждого item_id оставляем один экземпляр
 * максимальной редкости среди сундука и надетого. Надетое само по себе не разбирается,
 * но занимает место «оставленного» — тогда все копии этого item_id из сундука уходят в разбор.
 */
export function findDuplicateChestIndices(chest: ItemInstance[], equipped: ItemInstance[]): number[] {
  // Максимальная редкость по всем предметам игрока — и в сундуке, и на стойках.
  const best = new Map<string, number>();
  for (const item of [...chest, ...equipped]) {
    const idx = rarityIdx(item.rarity);
    if (idx > (best.get(item.item_id) ?? -1)) best.set(item.item_id, idx);
  }

  // Надетый экземпляр максимальной редкости уже «занимает» право остаться за свой item_id.
  const kept = new Set<string>();
  for (const item of equipped) {
    if (rarityIdx(item.rarity) === best.get(item.item_id)) kept.add(item.item_id);
  }

  const dupes: number[] = [];
  chest.forEach((item, i) => {
    if (rarityIdx(item.rarity) < (best.get(item.item_id) ?? -1)) { dupes.push(i); return; }
    if (kept.has(item.item_id)) { dupes.push(i); return; }
    kept.add(item.item_id); // первый встреченный максимум остаётся в сундуке
  });
  return dupes;
}

// Обмен дорогой эссенции на дешёвую — специально невыгодный курс, нужен только чтобы
// разменять излишек одного тира на нехватку другого, а не как основной источник ресурса.
export const ESSENCE_EXCHANGE_RATE = 3;

/** Тир, на который меняется данный (на один шаг вниз); null — меняться уже некуда. */
export const ESSENCE_EXCHANGE_TARGET: Record<EssenceTier, EssenceTier | null> = {
  uncommon: null, rare: 'uncommon', epic: 'rare',
};

// Сколько эссенции целевого тира стоит улучшение (см. docs/meta-progression.md).
const UPGRADE_ESSENCE_AMOUNT = 10;

/** Улучшение до тира T тратит 10 ед. эссенции этого тира. */
export function upgradeEssenceCost(target: Rarity): EssencePool {
  const pool = emptyEssence();
  const idx = ESSENCE_TIERS.indexOf(target as EssenceTier);
  if (idx >= 0) pool[ESSENCE_TIERS[idx]] = UPGRADE_ESSENCE_AMOUNT;
  return pool;
}

/** Компактная запись стоимости эссенции: «1рд 2нб 2об» (ненулевые тиры, по убыванию). */
export function formatEssence(pool: EssencePool): string {
  const parts: string[] = [];
  for (let i = ESSENCE_TIERS.length - 1; i >= 0; i--) {
    const tier = ESSENCE_TIERS[i];
    if (pool[tier] > 0) parts.push(`${pool[tier]}${ESSENCE_SHORT[tier]}`);
  }
  return parts.join(' ');
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
  if (!single) return { ...EMPTY, error: 'Добавьте предмет' };
  if (a && b) return { ...EMPTY, error: 'Улучшается один предмет' };

  const up = NEXT_RARITY[single.rarity];
  if (!up) return { ...EMPTY, error: 'Легендарный — выше некуда' };
  if (rarityIdx(up) > rarityIdx(CRAFT_RARITY_CAP)) {
    return { ...EMPTY, error: 'Легендарное только находится' };
  }
  const result: ItemInstance = { item_id: single.item_id, rarity: up };
  return {
    result, kind: 'upgrade',
    essenceCost: upgradeEssenceCost(up), error: null,
  };
}
