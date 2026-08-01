import evade from './evade.svg';
import armor from './armor.svg';
import thorns from './thorns.svg';
import summon from './summon.svg';
import phase from './phase.svg';

export type MechanicId = 'evade' | 'armor' | 'thorns' | 'summon' | 'phase';

export const MOB_MECHANIC_ICON_URLS: Record<MechanicId, string> = {
  evade,
  armor,
  thorns,
  summon,
  phase,
};

export function mobMechanicIconKey(id: MechanicId): string {
  return `mob_mechanic_${id}`;
}

/**
 * Порядок = канонический порядок гнёзд в бою (ExpeditionScene): дублирует порядок применения
 * защиты моба dodge → armor → thorns (docs/combat-events.md §6), затем summon/phase — в порядке
 * их разделов в docs/content.mobs.format.md.
 */
export const MOB_MECHANIC_DEFS: { id: MechanicId; title: string; description: string }[] = [
  { id: 'evade', title: 'Уворот', description: 'Шанс полностью избежать урона от удара.' },
  { id: 'armor', title: 'Защита', description: 'Снижает получаемый урон на фиксированное число очков.' },
  { id: 'thorns', title: 'Шипы', description: 'Отражает часть полученного урона обратно атакующему.' },
  { id: 'summon', title: 'Призыв', description: 'Вызывает на поле дополнительных противников.' },
  { id: 'phase', title: 'Смена фазы', description: 'После гибели переходит в новую форму и продолжает бой.' },
];
