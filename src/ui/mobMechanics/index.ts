import evade from './evade.svg';
import block from './block.svg';
import armor from './armor.svg';
import thorns from './thorns.svg';
import summon from './summon.svg';
import phase from './phase.svg';

export type MechanicId = 'evade' | 'block' | 'armor' | 'thorns' | 'summon' | 'phase';

export const MOB_MECHANIC_ICON_URLS: Record<MechanicId, string> = {
  evade,
  block,
  armor,
  thorns,
  summon,
  phase,
};

export function mobMechanicIconKey(id: MechanicId): string {
  return `mob_mechanic_${id}`;
}

/**
 * `color` — та же палитра, что и у статов моба в тултипе при наведении (`ExpeditionScene`,
 * `DEF_COLOR`/`THORNS_COLOR`): броня, уворот и блок там все «защитная» группа (синий), шипы —
 * оранжевые. У призыва/фазы своего цвета в тултипе не было (эти механики там вообще не показывались) —
 * здесь заведены новые: фиолетовый (как у полосок призыва рядом с мобом) и бирюзовый.
 */
export const MOB_MECHANIC_DEFS: Record<MechanicId, { title: string; description: string; color: string }> = {
  evade: { title: 'Уворот', description: 'Шанс полностью избежать урона от удара.', color: '#44aaff' },
  block: { title: 'Блок', description: 'Шанс полностью заблокировать удар.', color: '#44aaff' },
  armor: { title: 'Защита', description: 'Снижает получаемый урон на фиксированное число очков.', color: '#44aaff' },
  thorns: { title: 'Шипы', description: 'Отражает часть полученного урона обратно атакующему.', color: '#ff8844' },
  summon: { title: 'Призыв', description: 'Вызывает на поле дополнительных противников.', color: '#cc55ff' },
  phase: { title: 'Смена фазы', description: 'После гибели переходит в новую форму и продолжает бой.', color: '#44ddaa' },
};

/**
 * Раскладка гнёзд панели «Механики» (`ExpeditionScene.buildMechanicNests`) — 5 позиций, а не 6, потому
 * что `evade`/`block` делят первое гнездо: обе — «шанс полностью избежать удара», просто разных фракций
 * (Нежить/Мародёры, см. `docs/factions.md`), взаимоисключающие по лору. Внутри общего гнезда порядок —
 * приоритет отображения: если в текущем бою встретился хоть один моб с `block`, гнездо показывает блок,
 * иначе — уворот (первый присутствующий в `discoveredMechanics` побеждает).
 *
 * Порядок гнёзд дублирует порядок применения защиты моба dodge → block → armor → thorns
 * (`docs/combat-events.md` §6), затем summon/phase — в порядке их разделов в
 * `docs/content.mobs.format.md`.
 */
export const MOB_MECHANIC_NEST_ORDER: MechanicId[][] = [
  ['block', 'evade'],
  ['armor'],
  ['thorns'],
  ['summon'],
  ['phase'],
];

/** Тот же цвет числом — для заливки/обводки Phaser (тот же приём, что RARITY_COLORS в src/items/rarity.ts). */
export const MOB_MECHANIC_COLOR_NUM: Record<MechanicId, number> = Object.fromEntries(
  Object.entries(MOB_MECHANIC_DEFS).map(([id, d]) => [id, parseInt(d.color.slice(1), 16)])
) as Record<MechanicId, number>;
