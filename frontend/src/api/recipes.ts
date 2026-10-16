import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from './client';
import type { Recipe, RecipeOfTheDay } from '../types/api';

/** Typed query keys for recipe queries. */
export const recipeKeys = {
  all: ['recipes'] as const,
  ofTheDay: ['recipes', 'of-the-day'] as const,
  library: ['recipes', 'library'] as const,
};

/** Fetch today's recipe (the backend generates it on demand if needed). */
export async function getRecipeOfTheDay(): Promise<RecipeOfTheDay> {
  const { data } = await apiClient.get<RecipeOfTheDay>('/api/v1/recipe-of-the-day');
  return data;
}

/** Save today's recipe to the reusable library. */
export async function likeRecipeOfTheDay(): Promise<Recipe> {
  const { data } = await apiClient.post<Recipe>('/api/v1/recipe-of-the-day/like');
  return data;
}

/** Remove today's recipe from the library. */
export async function unlikeRecipeOfTheDay(): Promise<void> {
  await apiClient.delete('/api/v1/recipe-of-the-day/like');
}

/** React Query hook for the recipe of the day. */
export function useRecipeOfTheDay() {
  return useQuery<RecipeOfTheDay>({
    queryKey: recipeKeys.ofTheDay,
    queryFn: getRecipeOfTheDay,
  });
}

/**
 * Toggle whether today's recipe is saved in the library. Pass the current liked
 * state; the hook likes when not yet saved and unlikes when it is, then refreshes
 * the recipe (for its `saved_recipe_id`) and the library list.
 */
export function useToggleLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (currentlyLiked: boolean): Promise<void> => {
      if (currentlyLiked) {
        await unlikeRecipeOfTheDay();
      } else {
        await likeRecipeOfTheDay();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recipeKeys.ofTheDay });
      queryClient.invalidateQueries({ queryKey: recipeKeys.library });
    },
  });
}
