import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from './client';
import type { Recipe, RecipeCreate, RecipeDraft, RecipeOfTheDay } from '../types/api';

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

/** Replace the tags on today's recipe (and its saved copy, if liked). */
export async function updateRecipeTags(tags: string[]): Promise<RecipeOfTheDay> {
  const { data } = await apiClient.patch<RecipeOfTheDay>(
    '/api/v1/recipe-of-the-day/tags',
    { tags },
  );
  return data;
}

/** Fetch all saved recipes in the library, newest first. */
export async function listSavedRecipes(): Promise<Recipe[]> {
  const { data } = await apiClient.get<Recipe[]>('/api/v1/recipes');
  return data;
}

/** Parse pasted recipe text into a structured draft (not yet saved). */
export async function parseRecipeText(text: string): Promise<RecipeDraft> {
  const { data } = await apiClient.post<RecipeDraft>('/api/v1/recipes/parse', { text });
  return data;
}

/** Generate a recipe from a free-form prompt (not yet saved). */
export async function suggestRecipe(prompt: string): Promise<RecipeDraft> {
  const { data } = await apiClient.post<RecipeDraft>('/api/v1/recipes/suggest', { prompt });
  return data;
}

/** Refine an in-progress recipe draft with a free-form change request (not yet saved). */
export async function refineRecipe(
  message: string,
  previous: RecipeDraft,
): Promise<RecipeDraft> {
  const { data } = await apiClient.post<RecipeDraft>('/api/v1/recipes/refine', {
    message,
    previous,
  });
  return data;
}

/** Save a reviewed recipe into the library. */
export async function createRecipe(payload: RecipeCreate): Promise<Recipe> {
  const { data } = await apiClient.post<Recipe>('/api/v1/recipes', payload);
  return data;
}

/** React Query hook for the recipe of the day. */
export function useRecipeOfTheDay() {
  return useQuery<RecipeOfTheDay>({
    queryKey: recipeKeys.ofTheDay,
    queryFn: getRecipeOfTheDay,
  });
}

/** React Query hook for the saved recipe library. */
export function useSavedRecipes() {
  return useQuery<Recipe[]>({
    queryKey: recipeKeys.library,
    queryFn: listSavedRecipes,
  });
}

/** Mutation to parse pasted recipe text into a reviewable draft. */
export function useParseRecipe() {
  return useMutation({ mutationFn: parseRecipeText });
}

/** Mutation to generate a recipe from a free-form prompt. */
export function useSuggestRecipe() {
  return useMutation({ mutationFn: suggestRecipe });
}

/** Mutation to refine an in-progress draft with a change request. */
export function useRefineRecipe() {
  return useMutation({
    mutationFn: ({ message, previous }: { message: string; previous: RecipeDraft }) =>
      refineRecipe(message, previous),
  });
}

/** Mutation to save a reviewed recipe, refreshing the library on success. */
export function useCreateRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recipeKeys.library });
    },
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

/** Mutation to replace today's recipe tags, refreshing the recipe and library. */
export function useUpdateTags() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRecipeTags,
    onSuccess: (data) => {
      queryClient.setQueryData(recipeKeys.ofTheDay, data);
      queryClient.invalidateQueries({ queryKey: recipeKeys.library });
    },
  });
}
