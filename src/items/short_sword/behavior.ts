import { standardWeapon } from '../factories';

// Сбалансированное: средние урон и темп, умеренный скейл обеих осей.
export default standardWeapon({ damage: 4, interval: 0.75, scale: { damage: 1.4, interval: 0.95 } });
