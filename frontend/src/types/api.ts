/** Shared types mirroring the backend API response schemas. */

export interface HealthResponse {
  status: string;
  database: string;
}

export interface RecipeOfTheDay {
  id: number;
  recipe_date: string;
  title: string;
  summary: string;
  cuisine: string | null;
  prep_minutes: number | null;
  cook_minutes: number | null;
  servings: number | null;
  ingredients: string[];
  steps: string[];
  language: string;
  generated_by: string;
  created_at: string;
  /** Id of the saved library copy once liked, otherwise null. */
  saved_recipe_id: number | null;
}

/** A reusable recipe stored in the saved library. */
export interface Recipe {
  id: number;
  title: string;
  summary: string;
  cuisine: string | null;
  prep_minutes: number | null;
  cook_minutes: number | null;
  servings: number | null;
  ingredients: string[];
  steps: string[];
  language: string;
  source: string;
  generated_by: string | null;
  created_at: string;
}

export interface LanguageOption {
  code: string;
  label: string;
}

export interface AppSettings {
  language: string;
  available_languages: LanguageOption[];
}
