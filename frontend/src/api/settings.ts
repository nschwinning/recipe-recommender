import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from './client';
import { recipeKeys } from './recipes';
import type { AppSettings } from '../types/api';

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
