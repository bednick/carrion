import type { Rarity } from './types';

const RARITY_INDEX: Record<Rarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

export function scaleByRarity(base: number, rarity: Rarity, scale: number): number {
  return base * Math.pow(scale, RARITY_INDEX[rarity]);
}

/** Порядковый номер редкости (common=0 … legendary=4) для собственных кривых скейла. */
export function rarityIndex(rarity: Rarity): number {
  return RARITY_INDEX[rarity];
}
