import type { EssenceTier, Rarity } from '../items/types';

/** Существующие портреты НПС лагеря (текстуры `npc-dealer`/`npc-smith`, см. CampScene.buildNPCs). */
export type DialogNpc = 'dealer' | 'smith';

/**
 * Фрагмент реплики: обычный текст, либо неразрывный токен «иконка + слово», окрашенный и
 * подчёркнутый цветом редкости (см. NpcDialogBox — там же перенос строк, почленная печать и
 * тултип по наведению). У эссенции `label` — готовая словоформа (падеж зависит от фразы:
 * винительный «неси редкую», родительный мн.ч. «три необычных», поэтому не выводится автоматически
 * из общего словаря эссенций). У предмета названия совпадают с винительным падежом (неодушевлённые:
 * «Кинжал», «Латы отчаяния»), поэтому имя берётся из `itemDisplayName(item)` — наводка на токен
 * показывает тултип предмета. Третий вид — просто слово, окрашенное в цвет редкости, без иконки/
 * подчёркивания/тултипа: когда реплика называет саму редкость, а не конкретный предмет/эссенцию
 * (напр. «до легендарного уровня»).
 */
export type DialogSegment =
  | { text: string }
  | { essence: EssenceTier; label: string }
  | { item: string; rarity: Rarity }
  | { rarity: Rarity; label: string };

export interface DialogEntry {
  npc: DialogNpc;
  text: string | DialogSegment[];
}

/** Содержимое реплик (RU/EN) — см. `src/i18n/content/dialogs.ts`; здесь только типы, показ —
 *  `src/core/DialogSystem.ts`, рендер — `src/ui/NpcDialogBox.ts`. */
