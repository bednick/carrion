export type ZoneFactionKey = 'none' | 'all' | 'beasts' | 'undead' | 'marauders';

/** Ярлык фракции зоны — используется только dev-дашбордом (`src/balance/main.ts`) для группировки,
 *  игроку нигде не показывается (см. docs/content.zones.format.md). */
export const ZONE_FACTION_LABELS: Record<ZoneFactionKey, { ru: string; en: string }> = {
  none: { ru: 'Без фракции', en: 'No faction' },
  all: { ru: 'Все три фракции', en: 'All three factions' },
  beasts: { ru: 'Конница — Дикие звери', en: 'Cavalry — Wild Beasts' },
  undead: { ru: 'Магия — Нежить', en: 'Magic — Undead' },
  marauders: { ru: 'Мародёры — Броня', en: 'Marauders — Armor' },
};
