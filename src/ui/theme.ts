export interface FontOption {
  id: string;
  family: string;
}

// Дев-инструмент сравнения шрифтов (FontPickerPopup, кнопка в CampScene за import.meta.env.DEV).
// lambda — прод-дефолт; badcomic — второй вариант для сравнения, тоже подключён всегда (не только в dev).
export const FONT_OPTIONS: FontOption[] = [
  { id: 'lambda', family: '"Lambda", monospace' },
  { id: 'badcomic', family: '"Bad Comic", monospace' },
];

const DEFAULT_FONT_ID = 'lambda';
const LS_DEV_FONT = 'carrion.devFont';

function readPersistedFontId(): string | null {
  if (!import.meta.env.DEV) return null;
  return localStorage.getItem(LS_DEV_FONT);
}

let currentFontId = readPersistedFontId() ?? DEFAULT_FONT_ID;

/** Мутируется через setFontId — все ~20 мест импорта читают значение заново при каждом add.text() после scene.restart(). */
export let FONT_FAMILY = (FONT_OPTIONS.find((f) => f.id === currentFontId) ?? FONT_OPTIONS[0]).family;

export function getFontId(): string {
  return currentFontId;
}

/** Только для дев-инструмента выбора шрифта — в проде выбор не сохраняется и не читается. */
export function setFontId(id: string): void {
  const option = FONT_OPTIONS.find((f) => f.id === id);
  if (!option) return;
  currentFontId = id;
  FONT_FAMILY = option.family;
  if (import.meta.env.DEV) localStorage.setItem(LS_DEV_FONT, id);
}

// Canvas-текст Phaser не перерисовывается сам при догрузке веб-шрифта,
// поэтому ждём его готовности до старта игры — иначе первый рендер
// молча останется на fallback-шрифте.
export async function loadFonts(): Promise<void> {
  await document.fonts.load(`16px ${FONT_FAMILY}`);
  await document.fonts.ready;
}
