import type { SlotType, ItemInstance } from './types';
import { getItemBehavior } from './registry';

/** Суммарный вклад надетой экипировки в мета-петлю. */
export function sumMeta(equipment: Partial<Record<SlotType, ItemInstance>>): {
  magicFind: number;
  fightDelta: number;
} {
  let magicFind = 0;
  let fightDelta = 0;
  for (const inst of Object.values(equipment)) {
    if (!inst) continue;
    const m = getItemBehavior(inst.item_id).meta?.(inst.rarity);
    if (!m) continue;
    if (m.magicFind) magicFind += m.magicFind;
    if (m.fightDelta) fightDelta += m.fightDelta;
  }
  return { magicFind, fightDelta };
}
