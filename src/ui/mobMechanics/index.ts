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
 *
 * `color` — та же палитра, что и у статов моба в тултипе при наведении (`ExpeditionScene`,
 * `DEF_COLOR`/`THORNS_COLOR`): броня и уворот там оба синие («защитная» группа), шипы — оранжевые.
 * У призыва/фазы своего цвета в тултипе не было (эти механики там вообще не показывались) — здесь
 * заведены новые: фиолетовый (как у полосок призыва рядом с мобом) и бирюзовый.
 */
export const MOB_MECHANIC_DEFS: { id: MechanicId; title: string; description: string; color: string }[] = [
  { id: 'evade', title: 'Уворот', description: 'Шанс полностью избежать урона от удара.', color: '#44aaff' },
  { id: 'armor', title: 'Защита', description: 'Снижает получаемый урон на фиксированное число очков.', color: '#44aaff' },
  { id: 'thorns', title: 'Шипы', description: 'Отражает часть полученного урона обратно атакующему.', color: '#ff8844' },
  { id: 'summon', title: 'Призыв', description: 'Вызывает на поле дополнительных противников.', color: '#cc55ff' },
  { id: 'phase', title: 'Смена фазы', description: 'После гибели переходит в новую форму и продолжает бой.', color: '#44ddaa' },
];

/** Тот же цвет числом — для заливки/обводки Phaser (тот же приём, что RARITY_COLORS в src/items/rarity.ts). */
export const MOB_MECHANIC_COLOR_NUM: Record<MechanicId, number> = MOB_MECHANIC_DEFS.reduce((acc, d) => {
  acc[d.id] = parseInt(d.color.slice(1), 16);
  return acc;
}, {} as Record<MechanicId, number>);
