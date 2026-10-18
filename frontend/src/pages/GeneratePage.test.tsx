import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { UseMutationResult } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import GeneratePage from './GeneratePage';
import { useCreateRecipe, useSuggestRecipe } from '../api/recipes';
import { translations } from '../i18n/translations';
import type { Recipe, RecipeCreate, RecipeDraft } from '../types/api';

const navigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigate };
});

vi.mock('../api/recipes', () => ({
  useSuggestRecipe: vi.fn(),
  useCreateRecipe: vi.fn(),
}));

// Pin the UI language to English so assertions are stable.
vi.mock('../i18n/useTranslation', () => ({
  useTranslation: () => ({ language: 'en', t: translations.en }),
}));

const mockedSuggest = vi.mocked(useSuggestRecipe);
const mockedCreate = vi.mocked(useCreateRecipe);

const sampleDraft: RecipeDraft = {
  title: 'Quick Veggie Stir-Fry',
  summary: 'Fast and fresh.',
  cuisine: 'Asian',
  prep_minutes: 10,
  cook_minutes: 15,
  servings: 2,
  ingredients: ['1 bell pepper', '1 head broccoli'],
  steps: ['Chop.', 'Stir-fry.'],
  tags: ['vegetarian'],
  language: 'en',
  generated_by: 'stub',
};

const suggestMutate = vi.fn((_prompt: string, opts?: { onSuccess?: (d: RecipeDraft) => void }) =>
  opts?.onSuccess?.(sampleDraft),
);
const createMutate = vi.fn((_payload: RecipeCreate, opts?: { onSuccess?: (r: Recipe) => void }) =>
  opts?.onSuccess?.({} as Recipe),
);

function suggestHook(overrides: Record<string, unknown> = {}) {
  return {
    mutate: suggestMutate,
    isPending: false,
    isError: false,
    reset: vi.fn(),
    ...overrides,
  } as unknown as UseMutationResult<RecipeDraft, Error, string>;
}

function createHook(overrides: Record<string, unknown> = {}) {
  return {
    mutate: createMutate,
    isPending: false,
    isError: false,
    reset: vi.fn(),
    ...overrides,
  } as unknown as UseMutationResult<Recipe, Error, RecipeCreate>;
}

function renderPage() {
  render(
    <MemoryRouter>
      <GeneratePage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  navigate.mockReset();
  suggestMutate.mockClear();
  createMutate.mockClear();
  mockedSuggest.mockReturnValue(suggestHook());
  mockedCreate.mockReturnValue(createHook());
});

describe('GeneratePage', () => {
  it('generates a recipe from the prompt and renders the result', async () => {
    renderPage();
    const user = userEvent.setup();

    await user.type(
      screen.getByPlaceholderText(translations.en.promptPlaceholder),
      'something vegetarian',
    );
    await user.click(screen.getByRole('button', { name: translations.en.generateButton }));

    expect(suggestMutate).toHaveBeenCalledWith('something vegetarian', expect.anything());
    expect(screen.getByText('Quick Veggie Stir-Fry')).toBeInTheDocument();
    expect(screen.getByText('1 bell pepper')).toBeInTheDocument();
  });

  it('disables the generate button when the prompt is empty', () => {
    renderPage();
    expect(
      screen.getByRole('button', { name: translations.en.generateButton }),
    ).toBeDisabled();
  });

  it('saves the generated recipe as ai_generated and navigates to the library', async () => {
    renderPage();
    const user = userEvent.setup();

    await user.type(
      screen.getByPlaceholderText(translations.en.promptPlaceholder),
      'something vegetarian',
    );
    await user.click(screen.getByRole('button', { name: translations.en.generateButton }));
    await user.click(screen.getByRole('button', { name: translations.en.addToRecipes }));

    expect(createMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Quick Veggie Stir-Fry',
        source: 'ai_generated',
        generated_by: 'stub',
        language: 'en',
        ingredients: ['1 bell pepper', '1 head broccoli'],
        steps: ['Chop.', 'Stir-fry.'],
        tags: ['vegetarian'],
      }),
      expect.anything(),
    );
    expect(navigate).toHaveBeenCalledWith('/saved');
  });

  it('shows an error when generation fails', () => {
    mockedSuggest.mockReturnValue(suggestHook({ isError: true }));
    renderPage();
    expect(screen.getByText(translations.en.generateError)).toBeInTheDocument();
  });
});
