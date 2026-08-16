import type { ItemBehavior } from '../behavior';
import { OFFENSE_COLOR, WEAPON_COLOR } from '../statColors';

// Cleave: полный урон основной цели, сплеш затухает по дальности от неё (по board-слоту, не по
// индексу массива — те расходятся после призывов) — ближайший прочий живой враг получает 50%,
// следующий 35%, следующий 25%. Таргетинг — engine-owned (resolution.ts:authorAttack), предмет
// декларирует только форму и ступени сплеша. Профильный стат — урон основной цели, ступени сплеша
// фиксированы и не растут с редкостью. damage/interval — явная таблица по редкости: одноцелевой
// DPS (`damage/interval`) растёт ×1.3 за уровень от анкора common (3.0); damage подобран под целые
// числа, interval — остаточная подгонка.
const SPLASH_RATIOS = [0.5, 0.35, 0.25];

const DAMAGE_BY_RARITY: Record<import('../types').Rarity, number> = {
  common: 4,
  uncommon: 5,
  rare: 7,
  epic: 9,
  legendary: 11,
};
const INTERVAL_BY_RARITY: Record<import('../types').Rarity, number> = {
  common: 1.28,
  uncommon: 1.28,
  rare: 1.38,
  epic: 1.38,
  legendary: 1.28,
};

const damage = (rarity: import('../types').Rarity) => DAMAGE_BY_RARITY[rarity];
const interval = (rarity: import('../types').Rarity) => INTERVAL_BY_RARITY[rarity];

const behavior: ItemBehavior = {
  name: 'Секира',
  slots: ['hand_right'],
  type: 'weapon',
  tags: ['weapon', 'cleave', 'slow'],
  weapon: (rarity) => ({
    interval: interval(rarity),
    baseDamage: damage(rarity),
    shape: 'cleave',
    shapeParams: { splashRatios: SPLASH_RATIOS },
  }),
  stats: (rarity) => {
    const dmg = damage(rarity);
    return [
      { text: `Урон: ${dmg}`, color: WEAPON_COLOR },
      { text: `Перезарядка: ${interval(rarity).toFixed(1)}`, color: WEAPON_COLOR },
      { text: `Сплеш урон до ${Math.round(SPLASH_RATIOS[0] * 100)}%`, color: OFFENSE_COLOR },
    ];
  },
};

export default behavior;
