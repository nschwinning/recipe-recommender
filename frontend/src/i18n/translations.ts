/** UI copy for every supported language. Recipe content is translated by the AI
 * backend; these dictionaries cover only the app's own chrome and labels. */

export type Language = 'de' | 'en';

export interface Translation {
  appTitle: string;
  badge: string;
  settingsLink: string;
  loading: string;
  error: string;
  ingredients: string;
  steps: string;
  like: string;
  liked: string;
  prep: (minutes: number) => string;
  cook: (minutes: number) => string;
  serves: (servings: number) => string;
  settingsTitle: string;
  settingsIntro: string;
  languageLabel: string;
  languageHint: string;
  save: string;
  saving: string;
  saved: string;
  saveError: string;
  backHome: string;
}

export const translations: Record<Language, Translation> = {
  de: {
    appTitle: 'KI-Küche',
    badge: 'Rezept des Tages',
    settingsLink: 'Einstellungen',
    loading: 'Das heutige Rezept wird zubereitet …',
    error: 'Beim Laden des heutigen Rezepts ist etwas schiefgelaufen.',
    ingredients: 'Zutaten',
    steps: 'Zubereitung',
    like: 'Rezept speichern',
    liked: 'Gespeichert',
    prep: (m) => `Vorbereitung ${m} Min.`,
    cook: (m) => `Kochen ${m} Min.`,
    serves: (s) => `Für ${s} Portionen`,
    settingsTitle: 'Einstellungen',
    settingsIntro:
      'Wähle die Sprache der App. Das heutige Rezept wird sofort in der neuen Sprache neu erstellt.',
    languageLabel: 'Sprache',
    languageHint: 'Legt die Sprache der Oberfläche und der Rezepte fest.',
    save: 'Speichern',
    saving: 'Wird gespeichert …',
    saved: 'Einstellungen gespeichert.',
    saveError: 'Die Einstellungen konnten nicht gespeichert werden.',
    backHome: 'Zurück zum Rezept',
  },
  en: {
    appTitle: 'AI Kitchen',
    badge: 'Recipe of the Day',
    settingsLink: 'Settings',
    loading: "Cooking up today's recipe …",
    error: "Something went wrong fetching today's recipe.",
    ingredients: 'Ingredients',
    steps: 'Steps',
    like: 'Save recipe',
    liked: 'Saved',
    prep: (m) => `Prep ${m} min`,
    cook: (m) => `Cook ${m} min`,
    serves: (s) => `Serves ${s}`,
    settingsTitle: 'Settings',
    settingsIntro:
      "Choose the language of the app. Today's recipe will be regenerated immediately in the new language.",
    languageLabel: 'Language',
    languageHint: 'Sets the language of the interface and the recipes.',
    save: 'Save',
    saving: 'Saving …',
    saved: 'Settings saved.',
    saveError: 'Could not save settings.',
    backHome: 'Back to the recipe',
  },
};

/** Fall back to the default language for any unrecognised code. */
export function resolveLanguage(code: string | undefined): Language {
  return code === 'en' ? 'en' : 'de';
}
