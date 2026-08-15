import type { ItemBehavior } from '../behavior';
import { OFFENSE_COLOR, WEAPON_COLOR } from '../statColors';

// Мультихит: один клинок, два честных укола за взмах — оба в ту же цель. Каждый — свой `damage`,
// лайфстил прокает дважды, каждый независимо катает общий крит-канал. damage фиксирован (2 на
// удар для всех редкостей), interval подогнан так, чтобы суммарный DPS двух ударов
// (`2·damage/interval`) рос ×1.3 за уровень редкости от анкора common (4.0).
const DAMAGE_BY_RARITY: Record<import('../types').Rarity, number> = {
  common: 2,
  uncommon: 2,
  rare: 2,
  epic: 2,
  legendary: 2,
};
const INTERVAL_BY_RARITY: Record<import('../types').Rarity, number> = {
  common: 1.0,
  uncommon: 0.769,
  rare: 0.5915,
  epic: 0.4552,
  legendary: 0.35,
};

const damage = (rarity: import('../types').Rarity) => DAMAGE_BY_RARITY[rarity];
const interval = (rarity: import('../types').Rarity) => INTERVAL_BY_RARITY[rarity];

const HITS = 2;

const behavior: ItemBehavior = {
  name: 'Рапира',
  slots: ['hand_right'],
  type: 'weapon',
  tags: ['weapon', 'light', 'fast', 'multihit'],
  weapon: (rarity) => ({
    interval: interval(rarity),
    baseDamage: damage(rarity),
    shape: 'multihit',
    shapeParams: { hits: HITS },
  }),
  stats: (rarity) => [
    { text: `Урон: ${damage(rarity)}`, color: WEAPON_COLOR },
    { text: `Перезарядка: ${interval(rarity).toFixed(1)}`, color: WEAPON_COLOR },
    { text: `Ударов за атаку: ${HITS}`, color: OFFENSE_COLOR },
  ],
};

export default behavior;
