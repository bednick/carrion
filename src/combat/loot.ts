import type { EssenceLoot, LootEntry, LootTable } from '../zones/types';
import type { EssenceTier, ItemInstance, Rarity } from '../items/types';
import type { Rng } from '../core/rng';

export interface LootResult {
  gold: number;
  items: ItemInstance[];
}

/** Один из 5 вариантов гарант-награды после босса (см. buildRewardOptions). */
export type RewardOption =
  | { kind: 'gold'; gold: number }
  | { kind: 'essence'; essence: Partial<Record<EssenceTier, number>> }
  | { kind: 'item'; item: ItemInstance };

/**
 * Взвешенный обязательный выбор одного предмета из записей лута (`chance` = вес).
 * Уже выбранные item_id (`used`) исключаются, чтобы карточки не повторялись.
 * Возвращает null, если брать нечего.
 */
function pickWeightedItem(entries: LootEntry[], used: Set<string>, rng: Rng): ItemInstance | null {
  const pool = entries.filter((e) => !used.has(e.item_id));
  const total = pool.reduce((s, e) => s + e.chance, 0);
  if (pool.length === 0 || total <= 0) return null;
  let r = rng.frac() * total;
  let idx = 0;
  for (; idx < pool.length - 1; idx++) {
    r -= pool[idx].chance;
    if (r <= 0) break;
  }
  const entry = pool[idx];
  used.add(entry.item_id);
  return { item_id: entry.item_id, rarity: entry.rarity ?? 'common' };
}

/** Роллит каждый заданный тир эссенции в его [min,max]. */
function rollEssence(cfg: EssenceLoot, rng: Rng): Partial<Record<EssenceTier, number>> {
  const out: Partial<Record<EssenceTier, number>> = {};
  for (const tier of Object.keys(cfg) as EssenceTier[]) {
    const range = cfg[tier]!;
    out[tier] = rng.int(range.min, range.max);
  }
  return out;
}

function itemOrNull(item: ItemInstance | null): RewardOption | null {
  return item ? { kind: 'item', item } : null;
}

/**
 * До пяти вариантов гарант-награды после победы над боссом (игрок берёт один):
 * [золото, предмет·mob, предмет·boss(центр), предмет·mob, эссенция].
 * - Золото — ролл boss.loot.gold; эссенция — ролл boss.loot.essence.
 * - Центральный предмет — взвешенно из boss.loot.items; боковые два — из mob_loot.items без повторов.
 * - Любой недостающий источник (нет лута/эссенции/предметов) просто не показывается карточкой.
 * См. docs/mechanics.md. `rng` обязателен — драфт обязан воспроизводиться при рестарте сцены.
 */
export function buildRewardOptions(bossLoot: LootTable | undefined, mobLoot: LootTable | undefined, rng: Rng): RewardOption[] {
  const used = new Set<string>();

  const gold: RewardOption | null = bossLoot
    ? { kind: 'gold', gold: rng.int(bossLoot.gold.min, bossLoot.gold.max) }
    : null;

  // Центр выбираем первым, чтобы боковые mob-предметы не дублировали его item_id.
  const center = itemOrNull(bossLoot ? pickWeightedItem(bossLoot.items, used, rng) : null);
  const left = itemOrNull(mobLoot ? pickWeightedItem(mobLoot.items, used, rng) : null);
  const right = itemOrNull(mobLoot ? pickWeightedItem(mobLoot.items, used, rng) : null);

  const essenceRoll = bossLoot?.essence ? rollEssence(bossLoot.essence, rng) : null;
  const essence: RewardOption | null =
    essenceRoll && Object.values(essenceRoll).some((v) => (v ?? 0) > 0)
      ? { kind: 'essence', essence: essenceRoll }
      : null;

  return [gold, left, center, right, essence].filter((o): o is RewardOption => o !== null);
}

const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

/**
 * magic_find: каждый успешный ролл поднимает редкость на тир (геометрически), вплоть до
 * легендарного. magicFind ≤ 0 — без изменений.
 */
function upgradeRarity(item: ItemInstance, magicFind: number, rng: Rng): ItemInstance {
  if (magicFind <= 0) return item;
  const startIdx = RARITY_ORDER.indexOf(item.rarity);
  const maxIdx = RARITY_ORDER.length - 1;
  let idx = startIdx;
  while (idx < maxIdx && rng.frac() < magicFind) idx++;
  return idx === startIdx ? item : { ...item, rarity: RARITY_ORDER[idx] };
}

/** `rng` обязателен — лут боя обязан воспроизводиться при рестарте сцены (см. src/core/rng.ts). */
export function rollLootTable(table: LootTable, magicFind: number, rng: Rng): LootResult {
  const gold = rng.int(table.gold.min, table.gold.max);

  const items: ItemInstance[] = [];
  for (const entry of table.items) {
    if (rng.frac() < entry.chance) {
      items.push(upgradeRarity({ item_id: entry.item_id, rarity: entry.rarity ?? 'common' }, magicFind, rng));
    }
  }

  return { gold, items };
}
