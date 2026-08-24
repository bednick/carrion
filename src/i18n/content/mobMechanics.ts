import type { MechanicId } from '../../ui/mobMechanics/index';

/** Заголовки/описания механик мобов на обоих языках. Ключ — MechanicId (см.
 *  `src/ui/mobMechanics/index.ts`, поля `title`/`description` там больше нет). */
export const MOB_MECHANIC_TEXT: Record<MechanicId, { title: { ru: string; en: string }; description: { ru: string; en: string } }> = {
  evade: {
    title: { ru: 'Уворот', en: 'Evade' },
    description: { ru: 'Шанс полностью избежать урона от удара.', en: 'A chance to fully avoid damage from a hit.' },
  },
  block: {
    title: { ru: 'Блок', en: 'Block' },
    description: { ru: 'Шанс полностью заблокировать удар.', en: 'A chance to fully block a hit.' },
  },
  armor: {
    title: { ru: 'Защита', en: 'Armor' },
    description: { ru: 'Снижает получаемый урон на фиксированное число очков.', en: 'Reduces incoming damage by a fixed number of points.' },
  },
  thorns: {
    title: { ru: 'Шипы', en: 'Thorns' },
    description: { ru: 'Отражает часть полученного урона обратно атакующему.', en: 'Reflects part of the damage taken back at the attacker.' },
  },
  summon: {
    title: { ru: 'Призыв', en: 'Summon' },
    description: { ru: 'Вызывает на поле дополнительных противников.', en: 'Summons extra enemies onto the field.' },
  },
  phase: {
    title: { ru: 'Смена фазы', en: 'Phase Shift' },
    description: { ru: 'После гибели переходит в новую форму и продолжает бой.', en: 'Upon death, shifts into a new form and continues the fight.' },
  },
};
