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
  generated_by: string;
  created_at: string;
}
