import type { ItemBehavior } from '../behavior';
import { OFFENSE_COLOR, WEAPON_COLOR } from '../statColors';

// damage/interval — явная таблица по редкости: одноцелевой DPS (`damage/interval`) растёт ×1.3 за
// уровень от анкора common (3.0); damage подобран под целые числа, interval — остаточная подгонка
// точности (прошив второй цели даёт тот же `damage` бесплатно, в анкор не входит).
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

// Прошив: бьёт основную цель и живого врага в строго соседней ячейке позади неё (по board-слоту,
// не по индексу массива). Пустая ячейка между целями блокирует прошив. Обе цели получают одинаковый
// урон. Таргетинг — engine-owned (resolution.ts:authorAttack), предмет декларирует только форму.
const behavior: ItemBehavior = {
  name: 'Короткое копьё',
  slots: ['hand_right'],
  type: 'weapon',
  tags: ['weapon', 'pierce', 'slow'],
  weapon: (rarity) => ({ interval: interval(rarity), baseDamage: damage(rarity), shape: 'pierce' }),
  stats: (rarity) => [
    { text: `Урон: ${damage(rarity)}`, color: WEAPON_COLOR },
    { text: `Перезарядка: ${interval(rarity).toFixed(1)}`, color: WEAPON_COLOR },
    { text: `Наносит урон стоящему за целью противнику`, color: OFFENSE_COLOR },
  ],
};

export default behavior;
