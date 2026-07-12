import battleStaff from './battle_staff/icon.svg';
import robeScrap from './robe_scrap/icon.svg';
import crackedAmulet from './cracked_amulet/icon.svg';
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
  robe_scrap: robeScrap,
  cracked_amulet: crackedAmulet,
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