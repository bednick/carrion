export const FONT_FAMILY = '"Tagesschrift Cyrillic", monospace';

// Canvas-текст Phaser не перерисовывается сам при догрузке веб-шрифта,
// поэтому ждём его готовности до старта игры — иначе первый рендер
// молча останется на fallback-шрифте.
export async function loadFonts(): Promise<void> {
  await document.fonts.load(`16px ${FONT_FAMILY}`);
  await document.fonts.ready;
}
