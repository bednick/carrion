import type { ZoneConfig } from './types';
import deadFieldsCfg from './dead-fields/config.json';
import trampledMeadowsCfg from './trampled-meadows/config.json';
import armorDumpCfg from './armor-dump/config.json';
import beastLairCfg from './beast-lair/config.json';
import abandonedCampCfg from './abandoned-camp/config.json';
import cryptCfg from './crypt/config.json';
import mageRuinsCfg from './mage-ruins/config.json';
import predatorPastureCfg from './predator-pasture/config.json';
import marauderLairCfg from './marauder-lair/config.json';
import battlefieldCfg from './battlefield/config.json';

export const ZONE_CONFIGS: Record<string, ZoneConfig> = {
  'dead-fields': deadFieldsCfg as unknown as ZoneConfig,
  'trampled-meadows': trampledMeadowsCfg as unknown as ZoneConfig,
  'armor-dump': armorDumpCfg as unknown as ZoneConfig,
  'beast-lair': beastLairCfg as unknown as ZoneConfig,
  'abandoned-camp': abandonedCampCfg as unknown as ZoneConfig,
  'crypt': cryptCfg as unknown as ZoneConfig,
  'mage-ruins': mageRuinsCfg as unknown as ZoneConfig,
  'predator-pasture': predatorPastureCfg as unknown as ZoneConfig,
  'marauder-lair': marauderLairCfg as unknown as ZoneConfig,
  'battlefield': battlefieldCfg as unknown as ZoneConfig,
};

export function getZoneConfig(zoneId: string): ZoneConfig {
  const cfg = ZONE_CONFIGS[zoneId];
  if (!cfg) throw new Error(`Unknown zone: ${zoneId}`);
  return cfg;
}

/** Уникальные item_id, которые могут выпасть в зоне (mob_loot + boss.loot, без дублей). */
export function getZoneLootItemIds(zoneId: string): string[] {
  const cfg = getZoneConfig(zoneId);
  const ids = [
    ...(cfg.mob_loot?.items ?? []).map(e => e.item_id),
    ...(cfg.boss.loot?.items ?? []).map(e => e.item_id),
  ];
  return [...new Set(ids)];
}

export const ALL_ZONE_IDS = [
  'dead-fields',
  'trampled-meadows',
  'armor-dump',
  'mage-ruins',
  'crypt',
  'beast-lair',
  'predator-pasture',
  'abandoned-camp',
  'marauder-lair',
  'battlefield',
];

export type BgLayer = 'far' | 'mid' | 'near' | 'fore';
export const BG_LAYERS: BgLayer[] = ['far', 'mid', 'near', 'fore'];

/**
 * Сколько вариантов каждого слоя есть у папки `public/backgrounds/zones/<id>/`.
 * Файлы: `<layer>.<n>.png`, n = 1..count. Ключ = id зоны. Слой можно не указывать (его нет).
 * При старте экспедиции для каждого слоя выбирается случайный вариант.
 * ВАЖНО: добавил файлы — обнови счётчик здесь (public нельзя перечислить автоматически).
 */
export const ZONE_BG_VARIANTS: Record<string, Partial<Record<BgLayer, number>>> = {
  'dead-fields': { far: 2, mid: 2, near: 2, fore: 2 },
  'armor-dump': { far: 2, near: 2 },
  'trampled-meadows': { far: 2, near: 2 },
  'beast-lair': { far: 2, mid: 2, near: 2, fore: 2 },
  'abandoned-camp': { far: 2, near: 2 },
  'crypt': { far: 2, near: 1 },
  'mage-ruins': { far: 2, near: 2 },
  'predator-pasture': { far: 2, near: 2 },
  'marauder-lair': { far: 2, near: 2 },
  'battlefield': { far: 2, near: 2 },
};

/** Ключ текстуры конкретного варианта слоя фона зоны. */
export function zoneBgKey(folder: string, layer: BgLayer, variant: number): string {
  return `zonebg-${folder}-${layer}-${variant}`;
}

export const WIP_ZONE_IDS = new Set<string>([]);
