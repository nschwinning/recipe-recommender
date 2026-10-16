import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import SettingsPage from './SettingsPage';
import { useAppSettings, useUpdateLanguage } from '../api/settings';
import { translations } from '../i18n/translations';
import type { AppSettings } from '../types/api';

vi.mock('../api/settings', () => ({
  useAppSettings: vi.fn(),
  useUpdateLanguage: vi.fn(),
}));

vi.mock('../i18n/useTranslation', () => ({
  useTranslation: () => ({ language: 'de', t: translations.de }),
}));

const mockedSettings = vi.mocked(useAppSettings);
const mockedUpdate = vi.mocked(useUpdateLanguage);

const settings: AppSettings = {
  language: 'de',
  available_languages: [
    { code: 'de', label: 'Deutsch' },
    { code: 'en', label: 'English' },
  ],
};

function renderPage() {
  render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>,
  );
}

describe('SettingsPage', () => {
  it('renders the language options with the current value selected', () => {
    mockedSettings.mockReturnValue({ data: settings, isLoading: false } as ReturnType<
      typeof useAppSettings
    >);
    mockedUpdate.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
      isError: false,
    } as unknown as ReturnType<typeof useUpdateLanguage>);

    renderPage();

    const select = screen.getByLabelText(translations.de.languageLabel) as HTMLSelectElement;
    expect(select.value).toBe('de');
    expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument();
  });

  it('submits the chosen language when changed', async () => {
    const mutate = vi.fn();
    mockedSettings.mockReturnValue({ data: settings, isLoading: false } as ReturnType<
      typeof useAppSettings
    >);
    mockedUpdate.mockReturnValue({
      mutate,
      isPending: false,
      isSuccess: false,
      isError: false,
    } as unknown as ReturnType<typeof useUpdateLanguage>);

    renderPage();

    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText(translations.de.languageLabel), 'en');
    await user.click(screen.getByRole('button', { name: translations.de.save }));

    expect(mutate).toHaveBeenCalledWith('en');
  });
});
