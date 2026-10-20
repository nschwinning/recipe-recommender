import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import SettingsPage from './SettingsPage';
import { useAppSettings, useUpdateLanguage, useUpdatePreferences } from '../api/settings';
import { translations } from '../i18n/translations';
import type { AppSettings } from '../types/api';

vi.mock('../api/settings', () => ({
  useAppSettings: vi.fn(),
  useUpdateLanguage: vi.fn(),
  useUpdatePreferences: vi.fn(),
}));

vi.mock('../i18n/useTranslation', () => ({
  useTranslation: () => ({ language: 'de', t: translations.de }),
}));

const mockedSettings = vi.mocked(useAppSettings);
const mockedUpdate = vi.mocked(useUpdateLanguage);
const mockedUpdatePrefs = vi.mocked(useUpdatePreferences);

const settings: AppSettings = {
  language: 'de',
  available_languages: [
    { code: 'de', label: 'Deutsch' },
    { code: 'en', label: 'English' },
  ],
  servings: null,
  diet: 'none',
  liked_ingredients: [],
  disliked_ingredients: [],
  available_diets: ['none', 'vegetarian', 'vegan'],
};

function stubSettings(data: AppSettings = settings) {
  mockedSettings.mockReturnValue({ data, isLoading: false } as ReturnType<typeof useAppSettings>);
}

function stubLanguageMutation(mutate = vi.fn()) {
  mockedUpdate.mockReturnValue({
    mutate,
    isPending: false,
    isSuccess: false,
    isError: false,
  } as unknown as ReturnType<typeof useUpdateLanguage>);
}

function stubPrefsMutation(mutate = vi.fn()) {
  mockedUpdatePrefs.mockReturnValue({
    mutate,
    isPending: false,
    isSuccess: false,
    isError: false,
  } as unknown as ReturnType<typeof useUpdatePreferences>);
}

function renderPage() {
  render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>,
  );
}

describe('SettingsPage', () => {
  it('renders the language options with the current value selected', () => {
    stubSettings();
    stubLanguageMutation();
    stubPrefsMutation();

    renderPage();

    const select = screen.getByLabelText(translations.de.languageLabel) as HTMLSelectElement;
    expect(select.value).toBe('de');
    expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument();
  });

  it('submits the chosen language when changed', async () => {
    const mutate = vi.fn();
    stubSettings();
    stubLanguageMutation(mutate);
    stubPrefsMutation();

    renderPage();

    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText(translations.de.languageLabel), 'en');
    // The language card is the first form; its Save button leads the list.
    await user.click(screen.getAllByRole('button', { name: translations.de.save })[0]);

    expect(mutate).toHaveBeenCalledWith('en');
  });

  it('renders the cooking-preference controls with current values', () => {
    stubSettings({
      ...settings,
      servings: 4,
      diet: 'vegan',
      liked_ingredients: ['Tofu'],
      disliked_ingredients: ['Cilantro'],
    });
    stubLanguageMutation();
    stubPrefsMutation();

    renderPage();

    const servings = screen.getByLabelText(translations.de.servingsLabel) as HTMLInputElement;
    expect(servings.value).toBe('4');
    const diet = screen.getByLabelText(translations.de.dietLabel) as HTMLSelectElement;
    expect(diet.value).toBe('vegan');
    expect(screen.getByText('Tofu')).toBeInTheDocument();
    expect(screen.getByText('Cilantro')).toBeInTheDocument();
  });

  it('saves updated preferences including a newly added liked ingredient', async () => {
    const mutate = vi.fn();
    stubSettings();
    stubLanguageMutation();
    stubPrefsMutation(mutate);

    renderPage();

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(translations.de.servingsLabel), '6');
    await user.selectOptions(screen.getByLabelText(translations.de.dietLabel), 'vegan');

    // Add a liked ingredient via the first ingredient editor.
    const addInputs = screen.getAllByPlaceholderText(translations.de.addIngredientPlaceholder);
    await user.type(addInputs[0], 'Tofu');
    await user.click(screen.getAllByRole('button', { name: translations.de.addIngredientButton })[0]);

    // The preferences Save button is the last one on the page.
    const saveButtons = screen.getAllByRole('button', { name: translations.de.save });
    await user.click(saveButtons[saveButtons.length - 1]);

    expect(mutate).toHaveBeenCalledWith({
      servings: 6,
      diet: 'vegan',
      liked_ingredients: ['Tofu'],
      disliked_ingredients: [],
    });
  });
});
