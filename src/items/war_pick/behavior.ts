import type { ItemBehavior } from '../behavior';
import { CRIT_COLOR, OFFENSE_COLOR, WEAPON_COLOR } from '../statColors';

// Крит: профильный стат — множитель крита (растёт с редкостью), шанс крита фиксирован (R5 — ровно
// один профильный стат). Крит несёт rider `armorPierce` — снимает 3 очка брони цели на этот удар
// (броня мобов числовая, см. docs/mechanics.md §«Броня vs щит»). 3 — весь потолок брони Мародёров
// в зонах, где `war_pick` является якорем, то есть крит по факту проходит мимо брони целиком;
// против более бронированных целей он её вычитает, а не обнуляет. Пробитие — часть анти-Мародёры
// идентичности клевца (R6), см. docs/content.items.hand_right.md.
//
// Крит теперь общий агрегированный канал движка (см. resolution.ts:authorAttack) — этот предмет
// лишь декларирует вклад (crit_chance/crit_mult/crit_armor_pierce), сам бросок и применение живут
// в движке, одинаково для любого оружия. С heavy_gloves бонусы складываются НАД базой (единый
// бросок на удар), а не два независимых броска, как раньше — см. docs/combat-events.md.
//
// damage/interval — явная таблица по редкости (не формула-скейл): средний DPS с учётом крита
// (`damage · (1 - crit_chance + crit_chance · crit_mult) / interval`) растёт ×1.3 за уровень редкости
// от анкора common (4.0). damage подобран под целые числа, interval — остаточная подгонка точности.
const CRIT_CHANCE = 0.2;
const CRIT_ARMOR_PIERCE = 2;
const CRIT_MULT_BY_RARITY: Record<import('../types').Rarity, number> = {
  common: 2.0,
  uncommon: 2.5,
  rare: 3.0,
  epic: 3.5,
  legendary: 3.5,
};
const DAMAGE_BY_RARITY: Record<import('../types').Rarity, number> = {
  common: 6,
  uncommon: 8,
  rare: 10,
  epic: 13,
  legendary: 16,
};
const INTERVAL_BY_RARITY: Record<import('../types').Rarity, number> = {
  common: 1.8,
  uncommon: 2.0,
  rare: 2.072,
  epic: 2.219,
  legendary: 2.101,
};

const damage = (rarity: import('../types').Rarity) => DAMAGE_BY_RARITY[rarity];
const interval = (rarity: import('../types').Rarity) => INTERVAL_BY_RARITY[rarity];
const critMult = (rarity: import('../types').Rarity) => CRIT_MULT_BY_RARITY[rarity];

const behavior: ItemBehavior = {
  name: 'Клевец',
  slots: ['hand_right'],
  type: 'weapon',
  tags: ['weapon', 'heavy', 'slow', 'crit'],
  weapon: (rarity) => ({ interval: interval(rarity), baseDamage: damage(rarity), shape: 'single' }),
  channels: (rarity) => [
    { channel: 'crit_chance', tier: 'flat', value: CRIT_CHANCE },
    { channel: 'crit_mult', tier: 'flat', value: critMult(rarity) - 1 },
    { channel: 'crit_armor_pierce', tier: 'flat', value: CRIT_ARMOR_PIERCE },
  ],
  stats: (rarity) => [
    { text: `Урон: ${damage(rarity)}`, color: WEAPON_COLOR },
    { text: `Перезарядка: ${interval(rarity).toFixed(1)}`, color: WEAPON_COLOR },
    { text: `Пробитие брони: ${CRIT_ARMOR_PIERCE}`, color: OFFENSE_COLOR },
    { text: `Шанс крита: ${Math.round(CRIT_CHANCE * 100)}%`, color: CRIT_COLOR },
    { text: `Множитель крита: ×${critMult(rarity)}`, color: CRIT_COLOR },
  ],
};

export default behavior;
