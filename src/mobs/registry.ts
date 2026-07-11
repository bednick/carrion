import type { MobConfig } from '../zones/types';
import raisedInfantryCfg from './raised_infantry/config.json';
import skeletonCfg from './skeleton/config.json';
import ratCfg from './rat/config.json';
import giantRatCfg from './giant_rat/config.json';
import scavengerCfg from './scavenger/config.json';
import henchmanCfg from './henchman/config.json';
import sergeantCfg from './sergeant/config.json';
import headlessKnightCfg from './headless_knight/config.json';
import ratKingCfg from './rat_king/config.json';
import dumpBossCfg from './dump_boss/config.json';
import runeSkeletonCfg from './rune_skeleton/config.json';
import runeHoundCfg from './rune_hound/config.json';
import runeArcherCfg from './rune_archer/config.json';
import boneWallCfg from './bone_wall/config.json';
import boneConstructCfg from './bone_construct/config.json';
import boneCentipedeCfg from './bone_centipede/config.json';
import boneStubCfg from './bone_stub/config.json';
import boneBattlemageCfg from './bone_battlemage/config.json';
import boneSummonerCfg from './bone_summoner/config.json';
import ghoulCfg from './ghoul/config.json';
import manyArmedDeadCfg from './many_armed_dead/config.json';
import buriedKnightCfg from './buried_knight/config.json';
import unquietDeadCfg from './unquiet_dead/config.json';
import unquietRisenCfg from './unquiet_risen/config.json';
import buriedShadeCfg from './buried_shade/config.json';
import wailerCfg from './wailer/config.json';
import embalmerCfg from './embalmer/config.json';
import swaddledHorrorCfg from './swaddled_horror/config.json';
import direWolfCfg from './dire_wolf/config.json';
import hyenaCfg from './hyena/config.json';
import pigletCfg from './piglet/config.json';
import boarCfg from './boar/config.json';
import sheWolfCfg from './she_wolf/config.json';
import beastDenCfg from './beast_den/config.json';
import packLeaderCfg from './pack_leader/config.json';
import wildHorseCfg from './wild_horse/config.json';
import foalCfg from './foal/config.json';
import maulerCfg from './mauler/config.json';
import prowlerCfg from './prowler/config.json';
import herdMareCfg from './herd_mare/config.json';
import herdStallionCfg from './herd_stallion/config.json';
import veteranCfg from './veteran/config.json';
import armoredVeteranCfg from './armored_veteran/config.json';
import spikedVeteranCfg from './spiked_veteran/config.json';
import macemanCfg from './maceman/config.json';
import stubbornVeteranCfg from './stubborn_veteran/config.json';
import stubbornVeteranRisenCfg from './stubborn_veteran_risen/config.json';
import armoredAvengerCfg from './armored_avenger/config.json';
import cataphractCfg from './cataphract/config.json';
import campCommanderCfg from './camp_commander/config.json';
import campCommanderLightCfg from './camp_commander_light/config.json';
import armedMarauderCfg from './armed_marauder/config.json';
import flayerCfg from './flayer/config.json';
import skinnerCfg from './skinner/config.json';
import executionerCfg from './executioner/config.json';
import armoredHerderCfg from './armored_herder/config.json';
import cleaverCfg from './cleaver/config.json';
import cleaverEnragedCfg from './cleaver_enraged/config.json';
import overseerCfg from './overseer/config.json';
import brigadierCfg from './brigadier/config.json';
import brigadierLightCfg from './brigadier_light/config.json';

const MOB_CONFIGS: Record<string, MobConfig> = {
  raised_infantry: raisedInfantryCfg as unknown as MobConfig,
  skeleton: skeletonCfg as unknown as MobConfig,
  rat: ratCfg as unknown as MobConfig,
  giant_rat: giantRatCfg as unknown as MobConfig,
  scavenger: scavengerCfg as unknown as MobConfig,
  henchman: henchmanCfg as unknown as MobConfig,
  sergeant: sergeantCfg as unknown as MobConfig,
  headless_knight: headlessKnightCfg as unknown as MobConfig,
  rat_king: ratKingCfg as unknown as MobConfig,
  dump_boss: dumpBossCfg as unknown as MobConfig,
  rune_skeleton: runeSkeletonCfg as unknown as MobConfig,
  rune_hound: runeHoundCfg as unknown as MobConfig,
  rune_archer: runeArcherCfg as unknown as MobConfig,
  bone_wall: boneWallCfg as unknown as MobConfig,
  bone_construct: boneConstructCfg as unknown as MobConfig,
  bone_centipede: boneCentipedeCfg as unknown as MobConfig,
  bone_stub: boneStubCfg as unknown as MobConfig,
  bone_battlemage: boneBattlemageCfg as unknown as MobConfig,
  bone_summoner: boneSummonerCfg as unknown as MobConfig,
  ghoul: ghoulCfg as unknown as MobConfig,
  many_armed_dead: manyArmedDeadCfg as unknown as MobConfig,
  buried_knight: buriedKnightCfg as unknown as MobConfig,
  unquiet_dead: unquietDeadCfg as unknown as MobConfig,
  unquiet_risen: unquietRisenCfg as unknown as MobConfig,
  buried_shade: buriedShadeCfg as unknown as MobConfig,
  wailer: wailerCfg as unknown as MobConfig,
  embalmer: embalmerCfg as unknown as MobConfig,
  swaddled_horror: swaddledHorrorCfg as unknown as MobConfig,
  dire_wolf: direWolfCfg as unknown as MobConfig,
  hyena: hyenaCfg as unknown as MobConfig,
  piglet: pigletCfg as unknown as MobConfig,
  boar: boarCfg as unknown as MobConfig,
  she_wolf: sheWolfCfg as unknown as MobConfig,
  beast_den: beastDenCfg as unknown as MobConfig,
  pack_leader: packLeaderCfg as unknown as MobConfig,
  wild_horse: wildHorseCfg as unknown as MobConfig,
  foal: foalCfg as unknown as MobConfig,
  mauler: maulerCfg as unknown as MobConfig,
  prowler: prowlerCfg as unknown as MobConfig,
  herd_mare: herdMareCfg as unknown as MobConfig,
  herd_stallion: herdStallionCfg as unknown as MobConfig,
  veteran: veteranCfg as unknown as MobConfig,
  armored_veteran: armoredVeteranCfg as unknown as MobConfig,
  spiked_veteran: spikedVeteranCfg as unknown as MobConfig,
  maceman: macemanCfg as unknown as MobConfig,
  stubborn_veteran: stubbornVeteranCfg as unknown as MobConfig,
  stubborn_veteran_risen: stubbornVeteranRisenCfg as unknown as MobConfig,
  armored_avenger: armoredAvengerCfg as unknown as MobConfig,
  cataphract: cataphractCfg as unknown as MobConfig,
  camp_commander: campCommanderCfg as unknown as MobConfig,
  camp_commander_light: campCommanderLightCfg as unknown as MobConfig,
  armed_marauder: armedMarauderCfg as unknown as MobConfig,
  flayer: flayerCfg as unknown as MobConfig,
  skinner: skinnerCfg as unknown as MobConfig,
  executioner: executionerCfg as unknown as MobConfig,
  armored_herder: armoredHerderCfg as unknown as MobConfig,
  cleaver: cleaverCfg as unknown as MobConfig,
  cleaver_enraged: cleaverEnragedCfg as unknown as MobConfig,
  overseer: overseerCfg as unknown as MobConfig,
  brigadier: brigadierCfg as unknown as MobConfig,
  brigadier_light: brigadierLightCfg as unknown as MobConfig,
};

export const ALL_MOB_IDS = Object.keys(MOB_CONFIGS);

export function getMobConfig(mobId: string): MobConfig {
  const cfg = MOB_CONFIGS[mobId];
  if (!cfg) throw new Error(`Unknown mob: ${mobId}`);
  return cfg;
}
