export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type SlotType = 'head' | 'body' | 'legs' | 'hand_left' | 'hand_right' | 'ring' | 'amulet';
export type ItemType = 'weapon' | 'armor' | 'shield' | 'accessory';

/**
 * Тиры эссенции — ресурса повышения редкости. Обычного (common) и легендарного тиров
 * нет: обычная эссенция упразднена (разбор common-предмета даёт 1 uncommon), а
 * легендарное снаряжение не крафтится (см. docs/meta-progression.md). Разбор epic и
 * legendary предметов даёт эпическую эссенцию (высший крафтовый тир).
 */
export type EssenceTier = 'uncommon' | 'rare' | 'epic';
export type EssencePool = Record<EssenceTier, number>;

/**
 * Идентичность + экономика предмета. Боевые статы и их скейл живут в `behavior.ts`
 * (фабрики `standardWeapon`/`standardArmor`/`standardShield`) — см. docs/combat-events.md §5.
 */
export interface ItemConfig {
  id: string;
  name: string;
  slots: SlotType[];
  type: ItemType;
  base_value: number;
  tags?: string[];
}

export interface ItemInstance {
  item_id: string;
  rarity: Rarity;
}
