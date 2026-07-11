import { standardWeapon } from '../factories';

// Сбалансированное: средние урон и темп, умеренный скейл обеих осей.
export default standardWeapon({ damage: 3, interval: 1.5, scale: { damage: 1.4, interval: 0.95 } });
