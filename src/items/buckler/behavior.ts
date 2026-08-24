import type { ItemBehavior } from '../behavior';
import type { Rarity } from '../types';
import type { TriggerDef } from '../../combat/triggers';
import { UNARMED_DAMAGE } from '../../combat/events';
import { DEFENSE_COLOR, REACTIVE_COLOR } from '../statColors';
import { t } from '../../i18n/t';

const BLOCK_CHANCE: Record<Rarity, number> = {
  common: 0.04,
  uncommon: 0.08,
  rare: 0.12,
  epic: 0.16,
  legendary: 0.20,
};
const COUNTER_CHANCE: Record<Rarity, number> = {
  common: 0.20,
  uncommon: 0.20,
  rare: 0.20,
  epic: 0.20,
  legendary: 0.20
};

// Блок — обычный вклад в общий канал block_chance (резолвится стадией движка, независимо от
// контрудара). Контрудар не сводится к каналу — это кастомный триггер, спавнящий настоящую атаку
// hand_right (читает mainWeaponBaseDamage кросс-slot через CombatView, ловит крит-канал наравне с
// обычным ударом) + презентационное событие `counter`. Исход блока и контрудара независим (R5-мотив
// «раздельный тюнинг частоты проков и вклада в выживание», docs/content.items.hand_left.md).
// Контрудар не реагирует на шипы врага (origin.from === 'enemy') — только на настоящие входящие
// атаки. Явная аннотация TriggerDef<'damage'> нужна, чтобы TS сузил тип события ИЗ неё, а не из
// широкого TriggerDef<any> в контракте ItemBehavior.triggers (список триггеров одного предмета
// неизбежно разнороден по типу события, см. behavior.ts).
const counterTrigger = (rarity: Rarity): TriggerDef<'damage'> => ({
  id: 'counter',
  event: 'damage',
  condition: (e, ctx) => e.target.side === 'hero' && e.origin.from !== 'enemy' && ctx.rng() < COUNTER_CHANCE[rarity],
  action: (e, ctx) => {
    const dmg = ctx.view.mainWeaponBaseDamage ?? UNARMED_DAMAGE;
    return {
      spawn: [
        { type: 'attack', source: { side: 'hero', slot: 'hand_right' }, target: e.source, amount: dmg, origin: { from: 'engine' } },
        { type: 'counter', source: { side: 'hero', slot: ctx.slot }, target: e.source, origin: { from: 'engine' } },
      ],
    };
  },
});

const behavior: ItemBehavior = {
  slots: ['hand_left'],
  type: 'shield',
  tags: ['shield', 'counter', 'block'],
  channels: (rarity) => [{ channel: 'block_chance', tier: 'flat', value: BLOCK_CHANCE[rarity] }],
  triggers: (rarity) => [counterTrigger(rarity)],
  stats: (rarity) => [
    { text: `${t('stat_block')}: ${Math.round(BLOCK_CHANCE[rarity] * 100)}%`, color: DEFENSE_COLOR },
    { text: `${t('stat_counter')}: ${Math.round(COUNTER_CHANCE[rarity] * 100)}%`, color: REACTIVE_COLOR },
  ],
};

export default behavior;
