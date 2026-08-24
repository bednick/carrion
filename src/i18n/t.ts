import { getLocale } from '../core/Locale';
import { UI } from './ui';

/** Подставляет `{param}` в строку значениями из `params`. */
function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (m, key) => (key in params ? String(params[key]) : m));
}

export function t(key: keyof typeof UI, params?: Record<string, string | number>): string {
  const entry = UI[key];
  if (!entry) throw new Error(`Unknown UI string key: ${key}`);
  return interpolate(entry[getLocale()], params);
}
