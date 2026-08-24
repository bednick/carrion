import type { ItemBehavior } from '../behavior';
import { CRIT_COLOR, WEAPON_COLOR } from '../statColors';
import { t } from '../../i18n/t';

// Крит: профильный стат — множитель крита (растёт с редкостью), шанс крита фиксирован (R5 — ровно
// один профильный стат).
//
// Крит теперь общий агрегированный канал движка (см. resolution.ts:authorAttack) — этот предмет
// лишь декларирует вклад (crit_chance/crit_mult), сам бросок и применение живут в движке,
// одинаково для любого оружия. С heavy_gloves бонусы складываются НАД базой (единый бросок на
// удар), а не два независимых броска, как раньше — см. docs/combat-events.md.
//
// damage/interval — явная таблица по редкости (не формула-скейл): средний DPS с учётом крита
// (`damage · (1 - crit_chance + crit_chance · crit_mult) / interval`) растёт ×1.3 за уровень редкости
// от анкора common (4.0). damage подобран под целые числа, interval — остаточная подгонка точности.
const CRIT_CHANCE = 0.3;
const CRIT_MULT_BY_RARITY: Record<import('../types').Rarity, number> = {
  common: 1.5,
  uncommon: 1.5,
  rare: 1.5,
  epic: 1.5,
  legendary: 1.5,
};
const DAMAGE_BY_RARITY: Record<import('../types').Rarity, number> = {
  common: 6,
  uncommon: 8,
  rare: 10,
  epic: 12,
  legendary: 16,
};
const INTERVAL_BY_RARITY: Record<import('../types').Rarity, number> = {
  common: 1.73,
  uncommon: 1.75,
  rare: 1.70,
  epic: 1.57,
  legendary: 1.61,
};

const damage = (rarity: import('../types').Rarity) => DAMAGE_BY_RARITY[rarity];
const interval = (rarity: import('../types').Rarity) => INTERVAL_BY_RARITY[rarity];
const critMult = (rarity: import('../types').Rarity) => CRIT_MULT_BY_RARITY[rarity];

const behavior: ItemBehavior = {
  slots: ['hand_right'],
  type: 'weapon',
  tags: ['weapon', 'heavy', 'slow', 'crit'],
  weapon: (rarity) => ({ interval: interval(rarity), baseDamage: damage(rarity), shape: 'single' }),
  channels: (rarity) => [
    { channel: 'crit_chance', tier: 'flat', value: CRIT_CHANCE },
    { channel: 'crit_mult', tier: 'flat', value: critMult(rarity) - 1 },
  ],
  stats: (rarity) => [
    { text: `${t('stat_damage')}: ${damage(rarity)}`, color: WEAPON_COLOR },
    { text: `${t('stat_interval')}: ${interval(rarity).toFixed(1)}`, color: WEAPON_COLOR },
    { text: `${t('stat_crit_chance')}: ${Math.round(CRIT_CHANCE * 100)}%`, color: CRIT_COLOR },
    { text: `${t('stat_crit_mult')}: ×${critMult(rarity)}`, color: CRIT_COLOR },
  ],
};

export default behavior;
