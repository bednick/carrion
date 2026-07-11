import type { ItemConfig } from './types';
import type { ItemBehavior } from './behavior';

import brokenStaffCfg from './broken_staff/config.json';
import robeScrapCfg from './robe_scrap/config.json';
import crackedAmuletCfg from './cracked_amulet/config.json';
import shaftCfg from './shaft/config.json';
import dentedHelmetCfg from './dented_helmet/config.json';
import leatherGreavesCfg from './leather_greaves/config.json';
import rustyKnifeCfg from './rusty_knife/config.json';
import plankShieldCfg from './plank_shield/config.json';
import bentBladeCfg from './bent_blade/config.json';
import leechBeadCfg from './leech_bead/config.json';
import bucklerCfg from './buckler/config.json';
import spikedCharmCfg from './spiked_charm/config.json';
import scavengerLensCfg from './scavenger_lens/config.json';
import deserterBootsCfg from './deserter_boots/config.json';
import marauderBootsCfg from './marauder_boots/config.json';
import wornPouchCfg from './worn_pouch/config.json';

import brokenStaffBeh from './broken_staff/behavior';
import robeScrapBeh from './robe_scrap/behavior';
import crackedAmuletBeh from './cracked_amulet/behavior';
import shaftBeh from './shaft/behavior';
import dentedHelmetBeh from './dented_helmet/behavior';
import leatherGreavesBeh from './leather_greaves/behavior';
import rustyKnifeBeh from './rusty_knife/behavior';
import plankShieldBeh from './plank_shield/behavior';
import bentBladeBeh from './bent_blade/behavior';
import leechBeadBeh from './leech_bead/behavior';
import bucklerBeh from './buckler/behavior';
import spikedCharmBeh from './spiked_charm/behavior';
import scavengerLensBeh from './scavenger_lens/behavior';
import deserterBootsBeh from './deserter_boots/behavior';
import marauderBootsBeh from './marauder_boots/behavior';
import wornPouchBeh from './worn_pouch/behavior';

export const ITEM_CONFIGS: Record<string, ItemConfig> = {
  broken_staff: brokenStaffCfg as ItemConfig,
  robe_scrap: robeScrapCfg as ItemConfig,
  cracked_amulet: crackedAmuletCfg as ItemConfig,
  shaft: shaftCfg as ItemConfig,
  dented_helmet: dentedHelmetCfg as ItemConfig,
  leather_greaves: leatherGreavesCfg as ItemConfig,
  rusty_knife: rustyKnifeCfg as ItemConfig,
  plank_shield: plankShieldCfg as ItemConfig,
  bent_blade: bentBladeCfg as ItemConfig,
  leech_bead: leechBeadCfg as ItemConfig,
  buckler: bucklerCfg as ItemConfig,
  spiked_charm: spikedCharmCfg as ItemConfig,
  scavenger_lens: scavengerLensCfg as ItemConfig,
  deserter_boots: deserterBootsCfg as ItemConfig,
  marauder_boots: marauderBootsCfg as ItemConfig,
  worn_pouch: wornPouchCfg as ItemConfig,
};

export const ITEM_BEHAVIORS: Record<string, ItemBehavior> = {
  broken_staff: brokenStaffBeh,
  robe_scrap: robeScrapBeh,
  cracked_amulet: crackedAmuletBeh,
  shaft: shaftBeh,
  dented_helmet: dentedHelmetBeh,
  leather_greaves: leatherGreavesBeh,
  rusty_knife: rustyKnifeBeh,
  plank_shield: plankShieldBeh,
  bent_blade: bentBladeBeh,
  leech_bead: leechBeadBeh,
  buckler: bucklerBeh,
  spiked_charm: spikedCharmBeh,
  scavenger_lens: scavengerLensBeh,
  deserter_boots: deserterBootsBeh,
  marauder_boots: marauderBootsBeh,
  worn_pouch: wornPouchBeh,
};

export function getItemConfig(item_id: string): ItemConfig {
  const cfg = ITEM_CONFIGS[item_id];
  if (!cfg) throw new Error(`Unknown item: ${item_id}`);
  return cfg;
}

export function hasItemConfig(item_id: string): boolean {
  return item_id in ITEM_CONFIGS;
}

export function getItemBehavior(item_id: string): ItemBehavior {
  return ITEM_BEHAVIORS[item_id] ?? {};
}
