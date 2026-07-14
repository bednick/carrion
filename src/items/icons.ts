import battleStaff from './battle_staff/icon.svg';
import gleamingPlate from './gleaming_plate/icon.svg';
import spikedCuirass from './spiked_cuirass/icon.svg';
import desperatePlate from './desperate_plate/icon.svg';
import heavyPlate from './heavy_plate/icon.svg';
import vultureAmulet from './vulture_amulet/icon.svg';
import barrierAmulet from './barrier_amulet/icon.svg';
import threadCharm from './thread_charm/icon.svg';
import shortSpear from './short_spear/icon.svg';
import dagger from './dagger/icon.svg';
import heavyShield from './heavy_shield/icon.svg';
import spikedShield from './spiked_shield/icon.svg';
import heavyGloves from './heavy_gloves/icon.svg';
import lightGloves from './light_gloves/icon.svg';
import comfortableGloves from './comfortable_gloves/icon.svg';
import shortSword from './short_sword/icon.svg';
import leechBead from './leech_bead/icon.svg';
import buckler from './buckler/icon.svg';
import broadaxe from './broadaxe/icon.svg';
import rapier from './rapier/icon.svg';
import warPick from './war_pick/icon.svg';

export const ITEM_ICON_URLS: Record<string, string> = {
  battle_staff: battleStaff,
  gleaming_plate: gleamingPlate,
  spiked_cuirass: spikedCuirass,
  desperate_plate: desperatePlate,
  heavy_plate: heavyPlate,
  vulture_amulet: vultureAmulet,
  barrier_amulet: barrierAmulet,
  thread_charm: threadCharm,
  short_spear: shortSpear,
  dagger: dagger,
  heavy_shield: heavyShield,
  spiked_shield: spikedShield,
  heavy_gloves: heavyGloves,
  light_gloves: lightGloves,
  comfortable_gloves: comfortableGloves,
  short_sword: shortSword,
  leech_bead: leechBead,
  buckler: buckler,
  broadaxe: broadaxe,
  rapier: rapier,
  war_pick: warPick,
};

export function itemIconKey(item_id: string): string {
  return `item_icon_${item_id}`;
}