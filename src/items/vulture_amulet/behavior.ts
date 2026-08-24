import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';
import { HEAL_COLOR } from '../statColors';
import { t } from '../../i18n/t';

// Лечение за убийство: величина фиксирована (от maxHp убитого больше не зависит — иначе жирный
// босс лечил бы кратно сильнее рядового моба), а редкость скейлит ЧИСЛО срабатываний за забег.
// Это конечный ресурс, а не канал: запас живёт в per-run стейт-бэге (RunStateBag.killHeal,
// src/combat/runState.ts) и между боями экспедиции не восстанавливается — стадия движка
// (CombatEngine.handleDamage) тратит по заряду на килл, пока они есть.
const HEAL_AMOUNT = 5;
const CHARGES: Record<Rarity, number> = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };

const behavior: ItemBehavior = {
  slots: ['amulet'],
  type: 'accessory',
  tags: ['accessory', 'on_kill', 'lifesteal'],
  killHeal: (rarity) => ({ amount: HEAL_AMOUNT, charges: CHARGES[rarity] }),
  stats: (rarity) => [
    { text: t('stat_heal_on_kill', { amount: HEAL_AMOUNT, charges: CHARGES[rarity] }), color: HEAL_COLOR },
  ],
};

export default behavior;
