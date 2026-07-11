import { standardWeapon } from '../factories';

// Лёгкое: интервал падает с редкостью, урон растёт умеренно.
export default standardWeapon({ damage: 2, interval: 0.5, scale: { damage: 1.3, interval: 0.9 } });
