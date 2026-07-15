import type { ItemBehavior } from './behavior';

import battleStaffBeh from './battle_staff/behavior';
import gleamingPlateBeh from './gleaming_plate/behavior';
import spikedCuirassBeh from './spiked_cuirass/behavior';
import desperatePlateBeh from './desperate_plate/behavior';
import heavyPlateBeh from './heavy_plate/behavior';
import vultureAmuletBeh from './vulture_amulet/behavior';
import barrierAmuletBeh from './barrier_amulet/behavior';
import threadCharmBeh from './thread_charm/behavior';
import shortSpearBeh from './short_spear/behavior';
import daggerBeh from './dagger/behavior';
import heavyShieldBeh from './heavy_shield/behavior';
import spikedShieldBeh from './spiked_shield/behavior';
import heavyGlovesBeh from './heavy_gloves/behavior';
import lightGlovesBeh from './light_gloves/behavior';
import comfortableGlovesBeh from './comfortable_gloves/behavior';
import shortSwordBeh from './short_sword/behavior';
import leechBeadBeh from './leech_bead/behavior';
import bucklerBeh from './buckler/behavior';
import broadaxeBeh from './broadaxe/behavior';
import rapierBeh from './rapier/behavior';
import warPickBeh from './war_pick/behavior';

export const ITEM_BEHAVIORS: Record<string, ItemBehavior> = {
  battle_staff: battleStaffBeh,
  gleaming_plate: gleamingPlateBeh,
  spiked_cuirass: spikedCuirassBeh,
  desperate_plate: desperatePlateBeh,
  heavy_plate: heavyPlateBeh,
  vulture_amulet: vultureAmuletBeh,
  barrier_amulet: barrierAmuletBeh,
  thread_charm: threadCharmBeh,
  short_spear: shortSpearBeh,
  dagger: daggerBeh,
  heavy_shield: heavyShieldBeh,
  spiked_shield: spikedShieldBeh,
  heavy_gloves: heavyGlovesBeh,
  light_gloves: lightGlovesBeh,
  comfortable_gloves: comfortableGlovesBeh,
  short_sword: shortSwordBeh,
  leech_bead: leechBeadBeh,
  buckler: bucklerBeh,
  broadaxe: broadaxeBeh,
  rapier: rapierBeh,
  war_pick: warPickBeh,
};

export function getItemBehavior(item_id: string): ItemBehavior {
  const beh = ITEM_BEHAVIORS[item_id];
  if (!beh) throw new Error(`Unknown item: ${item_id}`);
  return beh;
}

export function hasItemBehavior(item_id: string): boolean {
  return item_id in ITEM_BEHAVIORS;
}
