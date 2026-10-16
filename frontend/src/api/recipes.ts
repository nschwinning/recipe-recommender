import { useQuery } from '@tanstack/react-query';

import { apiClient } from './client';
import type { RecipeOfTheDay } from '../types/api';

/** Typed query keys for recipe queries. */
export const recipeKeys = {
  all: ['recipes'] as const,
  ofTheDay: ['recipes', 'of-the-day'] as const,
};

/** Fetch today's recipe (the backend generates it on demand if needed). */
export async function getRecipeOfTheDay(): Promise<RecipeOfTheDay> {
  const { data } = await apiClient.get<RecipeOfTheDay>('/api/v1/recipe-of-the-day');
  return data;
}

/** React Query hook for the recipe of the day. */
export function useRecipeOfTheDay() {
  return useQuery<RecipeOfTheDay>({
    queryKey: recipeKeys.ofTheDay,
    queryFn: getRecipeOfTheDay,
  });
}
