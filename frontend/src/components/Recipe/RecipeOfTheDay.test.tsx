import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import RecipeOfTheDay from './RecipeOfTheDay';
import { useRecipeOfTheDay, useToggleLike } from '../../api/recipes';
import { translations } from '../../i18n/translations';
import type { RecipeOfTheDay as Recipe } from '../../types/api';

vi.mock('../../api/recipes', () => ({
  useRecipeOfTheDay: vi.fn(),
  useToggleLike: vi.fn(),
}));

// Pin the UI language to English so assertions are stable (no QueryClient needed).
vi.mock('../../i18n/useTranslation', () => ({
  useTranslation: () => ({ language: 'en', t: translations.en }),
}));

const mockedHook = vi.mocked(useRecipeOfTheDay);
const mockedToggle = vi.mocked(useToggleLike);

const mutate = vi.fn();

beforeEach(() => {
  mutate.mockReset();
  mockedToggle.mockReturnValue({ mutate, isPending: false } as unknown as UseMutationResult<
    void,
    Error,
    boolean
  >);
});

const sampleRecipe: Recipe = {
  id: 1,
  recipe_date: '2026-10-15',
  title: 'Lemon Herb Chicken',
  summary: 'A bright one-pan dinner.',
  cuisine: 'Mediterranean',
  prep_minutes: 15,
  cook_minutes: 30,
  servings: 4,
  ingredients: ['4 chicken thighs', '1 lemon'],
  steps: ['Sear the chicken.', 'Roast until done.'],
  language: 'en',
  generated_by: 'stub',
  created_at: '2026-10-15T00:00:00Z',
  saved_recipe_id: null,
};

/** Build a minimal UseQueryResult shape for the states the component reads. */
function queryResult(
  overrides: Partial<UseQueryResult<Recipe>>,
): UseQueryResult<Recipe> {
  return {
    data: undefined,
    isLoading: false,
    isError: false,
    ...overrides,
  } as UseQueryResult<Recipe>;
}

describe('RecipeOfTheDay', () => {
  it('renders the recipe title, ingredients and steps', () => {
    mockedHook.mockReturnValue(queryResult({ data: sampleRecipe }));

    render(<RecipeOfTheDay />);

    expect(screen.getByText('Lemon Herb Chicken')).toBeInTheDocument();
    expect(screen.getByText('4 chicken thighs')).toBeInTheDocument();
    expect(screen.getByText('Sear the chicken.')).toBeInTheDocument();
    expect(screen.getByText('Serves 4')).toBeInTheDocument();
  });

  it('shows a loading message while fetching', () => {
    mockedHook.mockReturnValue(queryResult({ isLoading: true }));

    render(<RecipeOfTheDay />);

    expect(screen.getByText(/cooking up today/i)).toBeInTheDocument();
  });

  it('shows an error message when the request fails', () => {
    mockedHook.mockReturnValue(queryResult({ isError: true }));

    render(<RecipeOfTheDay />);

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('likes an unsaved recipe when the save button is clicked', async () => {
    mockedHook.mockReturnValue(queryResult({ data: sampleRecipe }));

    render(<RecipeOfTheDay />);

    const button = screen.getByRole('button', { name: new RegExp(translations.en.like, 'i') });
    expect(button).toHaveAttribute('aria-pressed', 'false');

    await userEvent.setup().click(button);
    // Passes the current liked state (false → will like).
    expect(mutate).toHaveBeenCalledWith(false);
  });

  it('shows the saved state and unlikes when already liked', async () => {
    mockedHook.mockReturnValue(
      queryResult({ data: { ...sampleRecipe, saved_recipe_id: 7 } }),
    );

    render(<RecipeOfTheDay />);

    const button = screen.getByRole('button', { name: new RegExp(translations.en.liked, 'i') });
    expect(button).toHaveAttribute('aria-pressed', 'true');

    await userEvent.setup().click(button);
    // Passes the current liked state (true → will unlike).
    expect(mutate).toHaveBeenCalledWith(true);
  });
});
