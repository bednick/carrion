import { standardWeapon } from '../factories';

// Слабое тяжёлое древко.
export default standardWeapon({ damage: 2, interval: 3.0, scale: { damage: 1.5, interval: 1.0 } });
