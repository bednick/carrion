import { getLocale } from '../../core/Locale';
import { MOB_NAMES } from './mobs';
import { ZONE_TEXT } from './zones';
import { ITEM_NAMES } from './items';
import { QUEST_TEXT } from './quests';
import { MOB_MECHANIC_TEXT } from './mobMechanics';
import type { MechanicId } from '../../ui/mobMechanics/index';

export function mobName(mobId: string): string {
  const entry = MOB_NAMES[mobId];
  if (!entry) throw new Error(`No i18n name for mob: ${mobId}`);
  return entry[getLocale()];
}

export function zoneName(zoneId: string): string {
  const entry = ZONE_TEXT[zoneId];
  if (!entry) throw new Error(`No i18n text for zone: ${zoneId}`);
  return entry.name[getLocale()];
}

export function zoneDescription(zoneId: string): string {
  const entry = ZONE_TEXT[zoneId];
  if (!entry) throw new Error(`No i18n text for zone: ${zoneId}`);
  return entry.description[getLocale()];
}

export function itemDisplayName(itemId: string): string {
  const entry = ITEM_NAMES[itemId];
  if (!entry) throw new Error(`No i18n name for item: ${itemId}`);
  return entry[getLocale()];
}

export function questTitle(questId: string): string {
  const entry = QUEST_TEXT[questId];
  if (!entry) throw new Error(`No i18n text for quest: ${questId}`);
  return entry.title[getLocale()];
}

export function questDescription(questId: string): string {
  const entry = QUEST_TEXT[questId];
  if (!entry) throw new Error(`No i18n text for quest: ${questId}`);
  return entry.description[getLocale()];
}

export function mechanicTitle(id: MechanicId): string {
  return MOB_MECHANIC_TEXT[id].title[getLocale()];
}

export function mechanicDescription(id: MechanicId): string {
  return MOB_MECHANIC_TEXT[id].description[getLocale()];
}
