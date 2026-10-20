import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from './client';
import { recipeKeys } from './recipes';
import type { AppSettings, CookingPreferencesUpdate } from '../types/api';

/** Typed query keys for settings queries. */
export const settingsKeys = {
  all: ['settings'] as const,
};

/** Fetch the current application settings (language + available languages). */
export async function getAppSettings(): Promise<AppSettings> {
  const { data } = await apiClient.get<AppSettings>('/api/v1/settings');
  return data;
}

/** Update the application language; the backend regenerates today's recipe. */
export async function updateLanguage(language: string): Promise<AppSettings> {
  const { data } = await apiClient.put<AppSettings>('/api/v1/settings', { language });
  return data;
}

/** Update the cooking preferences that steer AI recipe generation. */
export async function updatePreferences(
  payload: CookingPreferencesUpdate,
): Promise<AppSettings> {
  const { data } = await apiClient.put<AppSettings>('/api/v1/settings/preferences', payload);
  return data;
}

/** React Query hook for the application settings. */
export function useAppSettings() {
  return useQuery<AppSettings>({
    queryKey: settingsKeys.all,
    queryFn: getAppSettings,
  });
}

/**
 * Mutation to change the app language. On success it refreshes both the settings
 * and the recipe query so the UI and today's recipe reflect the new language.
 */
export function useUpdateLanguage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateLanguage,
    onSuccess: (data) => {
      queryClient.setQueryData(settingsKeys.all, data);
      queryClient.invalidateQueries({ queryKey: recipeKeys.ofTheDay });
    },
  });
}

/**
 * Mutation to update the cooking preferences. These influence future AI
 * generations, so only the settings cache needs refreshing — today's recipe
 * is deliberately left untouched.
 */
export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePreferences,
    onSuccess: (data) => {
      queryClient.setQueryData(settingsKeys.all, data);
    },
  });
}
