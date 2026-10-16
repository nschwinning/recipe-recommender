/** UI copy for every supported language. Recipe content is translated by the AI
 * backend; these dictionaries cover only the app's own chrome and labels. */

export type Language = 'de' | 'en';

export interface Translation {
  appTitle: string;
  badge: string;
  settingsLink: string;
  savedLink: string;
  importLink: string;
  loading: string;
  error: string;
  ingredients: string;
  steps: string;
  like: string;
  liked: string;
  tagsLabel: string;
  addTagPlaceholder: string;
  addTag: string;
  removeTag: (tag: string) => string;
  prep: (minutes: number) => string;
  cook: (minutes: number) => string;
  serves: (servings: number) => string;
  savedTitle: string;
  savedIntro: string;
  savedLoading: string;
  savedError: string;
  savedEmpty: string;
  filterByTag: string;
  clearFilters: string;
  noMatches: string;
  savedCount: (count: number) => string;
  showRecipe: string;
  importTitle: string;
  importIntro: string;
  pasteLabel: string;
  pastePlaceholder: string;
  parseButton: string;
  parsing: string;
  parseError: string;
  reviewTitle: string;
  reviewIntro: string;
  fieldTitle: string;
  fieldSummary: string;
  fieldCuisine: string;
  fieldPrep: string;
  fieldCook: string;
  fieldServings: string;
  addIngredient: string;
  addStep: string;
  removeItem: string;
  saveRecipe: string;
  savingRecipe: string;
  saveRecipeError: string;
  startOver: string;
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
    savedLink: 'Gespeichert',
    importLink: 'Importieren',
    loading: 'Das heutige Rezept wird zubereitet …',
    error: 'Beim Laden des heutigen Rezepts ist etwas schiefgelaufen.',
    ingredients: 'Zutaten',
    steps: 'Zubereitung',
    like: 'Rezept speichern',
    liked: 'Gespeichert',
    tagsLabel: 'Tags',
    addTagPlaceholder: 'Tag hinzufügen …',
    addTag: 'Hinzufügen',
    removeTag: (tag) => `Tag „${tag}" entfernen`,
    prep: (m) => `Vorbereitung ${m} Min.`,
    cook: (m) => `Kochen ${m} Min.`,
    serves: (s) => `Für ${s} Portionen`,
    savedTitle: 'Gespeicherte Rezepte',
    savedIntro: 'Deine gelikten Rezepte – nach Tags filtern.',
    savedLoading: 'Gespeicherte Rezepte werden geladen …',
    savedError: 'Die gespeicherten Rezepte konnten nicht geladen werden.',
    savedEmpty:
      'Du hast noch keine Rezepte gespeichert. Speichere das Rezept des Tages, um es hier zu sammeln.',
    filterByTag: 'Nach Tags filtern',
    clearFilters: 'Filter zurücksetzen',
    noMatches: 'Keine Rezepte passen zu diesen Tags.',
    savedCount: (count) => `${count} ${count === 1 ? 'Rezept' : 'Rezepte'}`,
    showRecipe: 'Rezept anzeigen',
    importTitle: 'Rezept importieren',
    importIntro:
      'Füge einen Rezepttext ein. Die KI zerlegt ihn in Felder, die du vor dem Speichern prüfst.',
    pasteLabel: 'Rezepttext',
    pastePlaceholder: 'Füge hier dein Rezept ein …',
    parseButton: 'Analysieren',
    parsing: 'Wird analysiert …',
    parseError: 'Der Text konnte nicht analysiert werden. Bitte erneut versuchen.',
    reviewTitle: 'Überprüfen & speichern',
    reviewIntro: 'Prüfe die erkannten Felder und passe sie an, bevor du speicherst.',
    fieldTitle: 'Titel',
    fieldSummary: 'Beschreibung',
    fieldCuisine: 'Küche',
    fieldPrep: 'Vorbereitung (Min.)',
    fieldCook: 'Kochzeit (Min.)',
    fieldServings: 'Portionen',
    addIngredient: 'Zutat hinzufügen',
    addStep: 'Schritt hinzufügen',
    removeItem: 'Entfernen',
    saveRecipe: 'In Bibliothek speichern',
    savingRecipe: 'Wird gespeichert …',
    saveRecipeError: 'Das Rezept konnte nicht gespeichert werden.',
    startOver: 'Neu beginnen',
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
    savedLink: 'Saved',
    importLink: 'Import',
    loading: "Cooking up today's recipe …",
    error: "Something went wrong fetching today's recipe.",
    ingredients: 'Ingredients',
    steps: 'Steps',
    like: 'Save recipe',
    liked: 'Saved',
    tagsLabel: 'Tags',
    addTagPlaceholder: 'Add a tag …',
    addTag: 'Add',
    removeTag: (tag) => `Remove tag "${tag}"`,
    prep: (m) => `Prep ${m} min`,
    cook: (m) => `Cook ${m} min`,
    serves: (s) => `Serves ${s}`,
    savedTitle: 'Saved recipes',
    savedIntro: 'Your liked recipes — filter them by tag.',
    savedLoading: 'Loading your saved recipes …',
    savedError: 'Could not load your saved recipes.',
    savedEmpty:
      "You haven't saved any recipes yet. Save the recipe of the day to collect it here.",
    filterByTag: 'Filter by tag',
    clearFilters: 'Clear filters',
    noMatches: 'No recipes match these tags.',
    savedCount: (count) => `${count} ${count === 1 ? 'recipe' : 'recipes'}`,
    showRecipe: 'Show recipe',
    importTitle: 'Import a recipe',
    importIntro:
      'Paste a recipe text. The AI splits it into fields you review before saving.',
    pasteLabel: 'Recipe text',
    pastePlaceholder: 'Paste your recipe here …',
    parseButton: 'Parse',
    parsing: 'Parsing …',
    parseError: 'Could not parse the text. Please try again.',
    reviewTitle: 'Review & save',
    reviewIntro: 'Check the detected fields and adjust them before saving.',
    fieldTitle: 'Title',
    fieldSummary: 'Summary',
    fieldCuisine: 'Cuisine',
    fieldPrep: 'Prep (min)',
    fieldCook: 'Cook (min)',
    fieldServings: 'Servings',
    addIngredient: 'Add ingredient',
    addStep: 'Add step',
    removeItem: 'Remove',
    saveRecipe: 'Save to library',
    savingRecipe: 'Saving …',
    saveRecipeError: 'Could not save the recipe.',
    startOver: 'Start over',
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
