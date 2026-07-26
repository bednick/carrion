import battleStaff from './battle_staff/icon.png';
import gleamingPlate from './gleaming_plate/icon.png';
import spikedCuirass from './spiked_cuirass/icon.png';
import desperatePlate from './desperate_plate/icon.png';
import heavyPlate from './heavy_plate/icon.png';
import vultureAmulet from './vulture_amulet/icon.png';
import barrierAmulet from './barrier_amulet/icon.png';
import threadCharm from './thread_charm/icon.png';
import shortSpear from './short_spear/icon.png';
import dagger from './dagger/icon.png';
import heavyShield from './heavy_shield/icon.png';
import spikedShield from './spiked_shield/icon.png';
import heavyGloves from './heavy_gloves/icon.svg';
import lightGloves from './light_gloves/icon.svg';
import comfortableGloves from './comfortable_gloves/icon.svg';
import shortSword from './short_sword/icon.png';
import leechBead from './leech_bead/icon.png';
import buckler from './buckler/icon.png';
import broadaxe from './broadaxe/icon.png';
import rapier from './rapier/icon.png';
import warPick from './war_pick/icon.png';

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