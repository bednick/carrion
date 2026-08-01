export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type SlotType = 'head' | 'body' | 'legs' | 'hand_left' | 'hand_right' | 'ring' | 'amulet';
export type ItemType = 'weapon' | 'armor' | 'shield' | 'accessory' | 'gloves';

/**
 * Тиры эссенции — ресурса обычного улучшения (upgradeEssenceCost в items/craft.ts) и обмена
 * между тирами. Источник — только награды зональных квестов (см. docs/meta-progression.md).
 * Обычного (common) тира нет — улучшение начинается с uncommon; легендарного тоже нет —
 * эссенцией до legendary не поднять, единственный путь туда — слияние (fuseItems), которое
 * эссенцию не тратит вовсе.
 */
export type EssenceTier = 'uncommon' | 'rare' | 'epic';
export type EssencePool = Record<EssenceTier, number>;

export interface ItemInstance {
  item_id: string;
  rarity: Rarity;
}
