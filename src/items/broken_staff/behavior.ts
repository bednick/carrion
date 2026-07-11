import { standardWeapon } from '../factories';

// Тяжёлое: урон растёт с редкостью, интервал фиксирован.
export default standardWeapon({ damage: 5, interval: 2.0, scale: { damage: 1.5, interval: 1.0 } });
