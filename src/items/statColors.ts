/**
 * Единственный источник правды по цветам строк тултипа (StatLine.color). Природа эффекта → цвет —
 * та же таблица, что в .claude/skills/item-tooltips/SKILL.md §«Цвет строки»; держать оба места
 * синхронными. Не заводи цвет локально в behavior.ts предмета — импортируй отсюда по имени.
 */
export const WEAPON_COLOR = '#ffbc44'; // профильная пара оружия: Урон, Перезарядка
export const OFFENSE_COLOR = '#ffd791'; // наступательное: райдеры формы 2/7, пробитие брони
export const CRIT_COLOR = '#cc88ff'; // крит: crit_chance/crit_mult
export const DEFENSE_COLOR = '#44aaff'; // защитное: блок, защита
export const REACTIVE_COLOR = '#ff8844'; // реактивное: шипы, контрудар
export const HEAL_COLOR = '#44ff88'; // лечение/лайфстил
export const UTILITY_COLOR = '#44ddaa'; // добавка к чужому потоку (не штраф)
export const PENALTY_COLOR = '#ff6666'; // штраф (R7)
export const RESOURCE_COLOR = '#66ccff'; // ресурс за бой (неуязвимость)
