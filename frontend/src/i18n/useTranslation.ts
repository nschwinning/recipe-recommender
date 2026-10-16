import { useAppSettings } from '../api/settings';
import { resolveLanguage, translations, type Language, type Translation } from './translations';

/**
 * Resolve the active UI translation from the app's configured language.
 *
 * While the settings query is loading we fall back to German (the app default),
 * so the first paint is never blank or in the wrong language.
 */
export function useTranslation(): { language: Language; t: Translation } {
  const { data } = useAppSettings();
  const language = resolveLanguage(data?.language);
  return { language, t: translations[language] };
}
