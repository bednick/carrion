import type { ItemBehavior } from '../behavior';
import { HEAL_COLOR } from '../statColors';

// Аварийный хил: РАЗ ЗА ЗАБЕГ лечит героя, если удар оставил HP ниже порога. Порог фиксирован
// (R5: один профильный стат — величина хила, не порог), флаг «уже сработал» живёт в per-run
// стейт-бэге (RunStateBag.emergencyHeal, см. src/combat/runState.ts) — не восстанавливается к
// новому бою экспедиции, только к новому заходу в зону. Хил задан плоскими HP, а не долей от
// maxHp: величина предмета не должна ползти вслед за будущим ростом maxHp героя.
// legendary не крафтится, но шаг +5 продолжается ровно — таблица линейная (docs/content.items.amulet.md).
const THRESHOLD_RATIO = 0.2;
const HEAL_FLAT: Record<import('../types').Rarity, number> = { common: 10, uncommon: 15, rare: 20, epic: 25, legendary: 30 };

const behavior: ItemBehavior = {
  name: 'Оберег на волоске',
  slots: ['amulet'],
  type: 'accessory',
  tags: ['accessory', 'last_stand'],
  emergencyHeal: (rarity) => ({ thresholdRatio: THRESHOLD_RATIO, healFlat: HEAL_FLAT[rarity] }),
  stats: (rarity) => [
    {
      text: `Аварийный хил при HP < ${Math.round(THRESHOLD_RATIO * 100)}%: ${HEAL_FLAT[rarity]} HP (раз за забег)`,
      color: HEAL_COLOR,
    },
  ],
};

export default behavior;
