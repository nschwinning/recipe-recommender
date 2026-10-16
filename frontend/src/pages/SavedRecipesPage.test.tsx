import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UseQueryResult } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import SavedRecipesPage from './SavedRecipesPage';
import { useSavedRecipes } from '../api/recipes';
import { translations } from '../i18n/translations';
import type { Recipe } from '../types/api';

vi.mock('../api/recipes', () => ({
  useSavedRecipes: vi.fn(),
}));

// Pin the UI language to English so assertions are stable (no QueryClient needed).
vi.mock('../i18n/useTranslation', () => ({
  useTranslation: () => ({ language: 'en', t: translations.en }),
}));

const mockedHook = vi.mocked(useSavedRecipes);

function makeRecipe(overrides: Partial<Recipe>): Recipe {
  return {
    id: 1,
    title: 'Recipe',
    summary: 'A summary.',
    cuisine: 'Italian',
    prep_minutes: 10,
    cook_minutes: 20,
    servings: 2,
    ingredients: ['ingredient'],
    steps: ['step'],
    tags: [],
    language: 'en',
    source: 'recipe_of_the_day',
    generated_by: 'stub',
    created_at: '2026-10-15T00:00:00Z',
    ...overrides,
  };
}

function queryResult(overrides: Partial<UseQueryResult<Recipe[]>>): UseQueryResult<Recipe[]> {
  return {
    data: undefined,
    isLoading: false,
    isError: false,
    ...overrides,
  } as UseQueryResult<Recipe[]>;
}

const recipes: Recipe[] = [
  makeRecipe({ id: 1, title: 'Lemon Chicken', tags: ['quick', 'dinner'] }),
  makeRecipe({ id: 2, title: 'Bean Stew', tags: ['vegetarian', 'dinner'] }),
  makeRecipe({ id: 3, title: 'Fruit Salad', tags: ['vegetarian', 'quick'] }),
];

describe('SavedRecipesPage', () => {
  it('shows a loading message while fetching', () => {
    mockedHook.mockReturnValue(queryResult({ isLoading: true }));

    render(<SavedRecipesPage />);

    expect(screen.getByText(translations.en.savedLoading)).toBeInTheDocument();
  });

  it('shows an error message when the request fails', () => {
    mockedHook.mockReturnValue(queryResult({ isError: true }));

    render(<SavedRecipesPage />);

    expect(screen.getByText(translations.en.savedError)).toBeInTheDocument();
  });

  it('shows an empty state when there are no saved recipes', () => {
    mockedHook.mockReturnValue(queryResult({ data: [] }));

    render(<SavedRecipesPage />);

    expect(screen.getByText(translations.en.savedEmpty)).toBeInTheDocument();
  });

  it('lists every saved recipe and its tag filters', () => {
    mockedHook.mockReturnValue(queryResult({ data: recipes }));

    render(<SavedRecipesPage />);

    expect(screen.getByRole('heading', { name: 'Lemon Chicken' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Bean Stew' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Fruit Salad' })).toBeInTheDocument();

    // One toggle button per distinct tag (dinner, quick, vegetarian).
    expect(screen.getByRole('button', { name: 'dinner' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'quick' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'vegetarian' })).toBeInTheDocument();
    expect(screen.getByText(translations.en.savedCount(3))).toBeInTheDocument();
  });

  it('filters the list by all selected tags (AND)', async () => {
    mockedHook.mockReturnValue(queryResult({ data: recipes }));

    render(<SavedRecipesPage />);
    const user = userEvent.setup();

    // Select "vegetarian" → Bean Stew + Fruit Salad.
    await user.click(screen.getByRole('button', { name: 'vegetarian' }));
    expect(screen.getByRole('heading', { name: 'Bean Stew' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Fruit Salad' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Lemon Chicken' })).not.toBeInTheDocument();

    // Add "quick" → only Fruit Salad has both.
    await user.click(screen.getByRole('button', { name: 'quick' }));
    expect(screen.getByRole('heading', { name: 'Fruit Salad' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Bean Stew' })).not.toBeInTheDocument();
    expect(screen.getByText(translations.en.savedCount(1))).toBeInTheDocument();
  });

  it('shows a no-matches message and clears filters', async () => {
    // Two recipes that never share a tag → selecting both yields nothing.
    const disjoint: Recipe[] = [
      makeRecipe({ id: 1, title: 'Only Quick', tags: ['quick'] }),
      makeRecipe({ id: 2, title: 'Only Slow', tags: ['slow'] }),
    ];
    mockedHook.mockReturnValue(queryResult({ data: disjoint }));

    render(<SavedRecipesPage />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'quick' }));
    await user.click(screen.getByRole('button', { name: 'slow' }));
    expect(screen.getByText(translations.en.noMatches)).toBeInTheDocument();

    // Clearing restores the full list.
    await user.click(screen.getByRole('button', { name: translations.en.clearFilters }));
    expect(screen.getByRole('heading', { name: 'Only Quick' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Only Slow' })).toBeInTheDocument();
  });

  it('reveals ingredients and steps behind the disclosure', async () => {
    mockedHook.mockReturnValue(
      queryResult({
        data: [makeRecipe({ id: 1, title: 'Soup', ingredients: ['water'], steps: ['boil'] })],
      }),
    );

    render(<SavedRecipesPage />);

    const card = screen.getByRole('heading', { name: 'Soup' }).closest('article');
    expect(card).not.toBeNull();
    const toggle = within(card as HTMLElement).getByText(translations.en.showRecipe);
    await userEvent.setup().click(toggle);

    expect(within(card as HTMLElement).getByText('water')).toBeInTheDocument();
    expect(within(card as HTMLElement).getByText('boil')).toBeInTheDocument();
  });
});
