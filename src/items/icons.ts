import brokenStaff from './broken_staff/icon.svg';
import robeScrap from './robe_scrap/icon.svg';
import crackedAmulet from './cracked_amulet/icon.svg';
import shaft from './shaft/icon.svg';
import dentedHelmet from './dented_helmet/icon.svg';
import leatherGreaves from './leather_greaves/icon.svg';
import rustyKnife from './rusty_knife/icon.svg';
import plankShield from './plank_shield/icon.svg';
import bentBlade from './bent_blade/icon.svg';
import leechBead from './leech_bead/icon.svg';
import buckler from './buckler/icon.svg';
import spikedCharm from './spiked_charm/icon.svg';
import scavengerLens from './scavenger_lens/icon.svg';
import deserterBoots from './deserter_boots/icon.svg';
import marauderBoots from './marauder_boots/icon.svg';
import wornPouch from './worn_pouch/icon.svg';

export const ITEM_ICON_URLS: Record<string, string> = {
  broken_staff: brokenStaff,
  robe_scrap: robeScrap,
  cracked_amulet: crackedAmulet,
  shaft: shaft,
  dented_helmet: dentedHelmet,
  leather_greaves: leatherGreaves,
  rusty_knife: rustyKnife,
  plank_shield: plankShield,
  bent_blade: bentBlade,
  leech_bead: leechBead,
  buckler: buckler,
  spiked_charm: spikedCharm,
  scavenger_lens: scavengerLens,
  deserter_boots: deserterBoots,
  marauder_boots: marauderBoots,
  worn_pouch: wornPouch,
};

export function itemIconKey(item_id: string): string {
  return `item_icon_${item_id}`;
}