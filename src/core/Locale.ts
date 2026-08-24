import { EventBus } from './EventBus';

export type Locale = 'ru' | 'en';

const LS_LOCALE = 'carrion.locale';

let current: Locale = (localStorage.getItem(LS_LOCALE) as Locale | null) ?? 'en';

export function getLocale(): Locale {
  return current;
}

/** Игрок явно выбирал язык хоть раз (ключ в localStorage реально стоит, а не дефолтный fallback). */
export function hasExplicitLocale(): boolean {
  return localStorage.getItem(LS_LOCALE) !== null;
}

/**
 * Забыть явный выбор языка — вызывается перед `MetaStore.resetAll()` (см. CampScene.confirmReset).
 * `resetAll()` делает `location.reload()` синхронно следом, поэтому модалку выбора языка на самом
 * сбросе показать нельзя (страница уходит на перезагрузку раньше первого кадра) — вместо этого
 * снимаем флаг «язык выбирался», и после reload сработает тот же путь, что на первом запуске игры
 * (см. CampScene.create(): `!hasExplicitLocale()` → showLanguageChooser()).
 */
export function resetLocale(): void {
  localStorage.removeItem(LS_LOCALE);
  current = 'en';
}

export function setLocale(locale: Locale): void {
  const changed = locale !== current;
  current = locale;
  localStorage.setItem(LS_LOCALE, locale);
  if (changed) EventBus.emit('locale_changed', locale);
}
