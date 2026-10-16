import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { UseMutationResult } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AddRecipePage from './AddRecipePage';
import { useCreateRecipe, useParseRecipe } from '../api/recipes';
import { translations } from '../i18n/translations';
import type { Recipe, RecipeCreate, RecipeDraft } from '../types/api';

const navigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigate };
});

vi.mock('../api/recipes', () => ({
  useParseRecipe: vi.fn(),
  useCreateRecipe: vi.fn(),
}));

// Pin the UI language to English so assertions are stable.
vi.mock('../i18n/useTranslation', () => ({
  useTranslation: () => ({ language: 'en', t: translations.en }),
}));

const mockedParse = vi.mocked(useParseRecipe);
const mockedCreate = vi.mocked(useCreateRecipe);

const sampleDraft: RecipeDraft = {
  title: 'Tomato Soup',
  summary: 'Cozy soup.',
  cuisine: 'Italian',
  prep_minutes: 10,
  cook_minutes: 20,
  servings: 4,
  ingredients: ['2 tomatoes', '1 onion'],
  steps: ['Chop.', 'Simmer.'],
  tags: ['soup'],
  language: 'en',
  generated_by: 'stub',
};

// mutate(text, { onSuccess }) immediately resolves with the canned draft.
const parseMutate = vi.fn((_text: string, opts?: { onSuccess?: (d: RecipeDraft) => void }) =>
  opts?.onSuccess?.(sampleDraft),
);
const createMutate = vi.fn((_payload: RecipeCreate, opts?: { onSuccess?: (r: Recipe) => void }) =>
  opts?.onSuccess?.({} as Recipe),
);

function parseHook(overrides: Record<string, unknown> = {}) {
  return {
    mutate: parseMutate,
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
      <AddRecipePage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  navigate.mockReset();
  parseMutate.mockClear();
  createMutate.mockClear();
  mockedParse.mockReturnValue(parseHook());
  mockedCreate.mockReturnValue(createHook());
});

describe('AddRecipePage', () => {
  it('parses pasted text and shows the review form prefilled', async () => {
    renderPage();
    const user = userEvent.setup();

    await user.type(
      screen.getByPlaceholderText(translations.en.pastePlaceholder),
      'some recipe text',
    );
    await user.click(screen.getByRole('button', { name: translations.en.parseButton }));

    expect(parseMutate).toHaveBeenCalledWith('some recipe text', expect.anything());
    // Review form now shows the parsed fields, editable.
    expect(screen.getByText(translations.en.reviewTitle)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tomato Soup')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2 tomatoes')).toBeInTheDocument();
    expect(screen.getByText('soup')).toBeInTheDocument();
  });

  it('does not parse when the textarea is empty', async () => {
    renderPage();
    // The parse button is disabled with no text.
    expect(screen.getByRole('button', { name: translations.en.parseButton })).toBeDisabled();
  });

  it('saves the reviewed recipe as ai_parsed and navigates to the library', async () => {
    renderPage();
    const user = userEvent.setup();

    await user.type(
      screen.getByPlaceholderText(translations.en.pastePlaceholder),
      'some recipe text',
    );
    await user.click(screen.getByRole('button', { name: translations.en.parseButton }));

    // Edit the title during review, then save.
    const titleInput = screen.getByLabelText(translations.en.fieldTitle);
    await user.clear(titleInput);
    await user.type(titleInput, 'Best Tomato Soup');
    await user.click(screen.getByRole('button', { name: translations.en.saveRecipe }));

    expect(createMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Best Tomato Soup',
        source: 'ai_parsed',
        generated_by: 'stub',
        language: 'en',
        ingredients: ['2 tomatoes', '1 onion'],
        steps: ['Chop.', 'Simmer.'],
        tags: ['soup'],
      }),
      expect.anything(),
    );
    expect(navigate).toHaveBeenCalledWith('/saved');
  });

  it('shows an error when parsing fails', () => {
    mockedParse.mockReturnValue(parseHook({ isError: true }));
    renderPage();
    expect(screen.getByText(translations.en.parseError)).toBeInTheDocument();
  });
});
