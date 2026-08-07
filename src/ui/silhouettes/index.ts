import head from './head.svg';
import handRight from './hand_right.svg';
import handLeft from './hand_left.svg';
import body from './body.svg';
import ring from './ring.svg';
import amulet from './amulet.svg';
import legs from './legs.svg';
import lock from './lock.svg';
import lockOpen from './lock-open.svg';
import warrior from './warrior.svg';
import backpackSil from './backpack.svg';
import anvil from './anvil.svg';
import belt from './belt.svg';
import plus from './plus.svg';
import questionMark from './question-mark.svg';

// Декоративные силуэты-«водяные знаки» под ячейками зон нижней панели.
export const ZONE_DECOR_URLS: Record<string, string> = {
  warrior,
  backpack: backpackSil,
  anvil,
  belt,
};

export function zoneDecorKey(id: string): string {
  return `zone_decor_${id}`;
}

export const SLOT_SILHOUETTE_URLS: Record<string, string> = {
  head,
  hand_right: handRight,
  hand_left: handLeft,
  body,
  ring,
  amulet,
  legs,
  lock,
  'lock-open': lockOpen,
};

export function slotSilhouetteKey(slotId: string): string {
  return `slot_sil_${slotId}`;
}

// Фоновые иконки пустых ячеек панели улучшения (вход/результат).
export const UPGRADE_ICON_URLS: Record<string, string> = {
  plus,
  question_mark: questionMark,
};

export function upgradeIconKey(id: 'plus' | 'question_mark'): string {
  return `upgrade_icon_${id}`;
}
