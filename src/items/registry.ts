import type { ItemConfig } from './types';
import type { ItemBehavior } from './behavior';

import battleStaffCfg from './battle_staff/config.json';
import gleamingPlateCfg from './gleaming_plate/config.json';
import spikedCuirassCfg from './spiked_cuirass/config.json';
import desperatePlateCfg from './desperate_plate/config.json';
import heavyPlateCfg from './heavy_plate/config.json';
import crackedAmuletCfg from './cracked_amulet/config.json';
import barrierAmuletCfg from './barrier_amulet/config.json';
import threadCharmCfg from './thread_charm/config.json';
import shortSpearCfg from './short_spear/config.json';
import daggerCfg from './dagger/config.json';
import heavyShieldCfg from './heavy_shield/config.json';
import spikedShieldCfg from './spiked_shield/config.json';
import heavyGlovesCfg from './heavy_gloves/config.json';
import lightGlovesCfg from './light_gloves/config.json';
import comfortableGlovesCfg from './comfortable_gloves/config.json';
import shortSwordCfg from './short_sword/config.json';
import leechBeadCfg from './leech_bead/config.json';
import bucklerCfg from './buckler/config.json';
import broadaxeCfg from './broadaxe/config.json';
import rapierCfg from './rapier/config.json';
import warPickCfg from './war_pick/config.json';

import battleStaffBeh from './battle_staff/behavior';
import gleamingPlateBeh from './gleaming_plate/behavior';
import spikedCuirassBeh from './spiked_cuirass/behavior';
import desperatePlateBeh from './desperate_plate/behavior';
import heavyPlateBeh from './heavy_plate/behavior';
import crackedAmuletBeh from './cracked_amulet/behavior';
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

export const ITEM_CONFIGS: Record<string, ItemConfig> = {
  battle_staff: battleStaffCfg as ItemConfig,
  gleaming_plate: gleamingPlateCfg as ItemConfig,
  spiked_cuirass: spikedCuirassCfg as ItemConfig,
  desperate_plate: desperatePlateCfg as ItemConfig,
  heavy_plate: heavyPlateCfg as ItemConfig,
  cracked_amulet: crackedAmuletCfg as ItemConfig,
  barrier_amulet: barrierAmuletCfg as ItemConfig,
  thread_charm: threadCharmCfg as ItemConfig,
  short_spear: shortSpearCfg as ItemConfig,
  dagger: daggerCfg as ItemConfig,
  heavy_shield: heavyShieldCfg as ItemConfig,
  spiked_shield: spikedShieldCfg as ItemConfig,
  heavy_gloves: heavyGlovesCfg as ItemConfig,
  light_gloves: lightGlovesCfg as ItemConfig,
  comfortable_gloves: comfortableGlovesCfg as ItemConfig,
  short_sword: shortSwordCfg as ItemConfig,
  leech_bead: leechBeadCfg as ItemConfig,
  buckler: bucklerCfg as ItemConfig,
  broadaxe: broadaxeCfg as ItemConfig,
  rapier: rapierCfg as ItemConfig,
  war_pick: warPickCfg as ItemConfig,
};

export const ITEM_BEHAVIORS: Record<string, ItemBehavior> = {
  battle_staff: battleStaffBeh,
  gleaming_plate: gleamingPlateBeh,
  spiked_cuirass: spikedCuirassBeh,
  desperate_plate: desperatePlateBeh,
  heavy_plate: heavyPlateBeh,
  cracked_amulet: crackedAmuletBeh,
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
