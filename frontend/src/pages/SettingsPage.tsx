import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import Card from '../components/UI/Card';
import { useAppSettings, useUpdateLanguage } from '../api/settings';
import { useTranslation } from '../i18n/useTranslation';
import classes from './SettingsPage.module.css';

const SettingsPage = () => {
  const { t } = useTranslation();
  const { data: settings, isLoading } = useAppSettings();
  const updateLanguage = useUpdateLanguage();

  const [selected, setSelected] = useState<string>('');

  // Keep the dropdown in sync with the loaded/updated server value.
  useEffect(() => {
    if (settings) {
      setSelected(settings.language);
    }
  }, [settings]);

  const dirty = settings != null && selected !== settings.language;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (dirty) {
      updateLanguage.mutate(selected);
    }
  };

  return (
    <section className={classes.wrapper}>
      <Card>
        <form className={classes.form} onSubmit={handleSubmit}>
          <h2 className={classes.title}>{t.settingsTitle}</h2>
          <p className={classes.intro}>{t.settingsIntro}</p>

          <label className={classes.label} htmlFor="language">
            {t.languageLabel}
          </label>
          <select
            id="language"
            className={classes.select}
            value={selected}
            disabled={isLoading || !settings}
            onChange={(event) => setSelected(event.target.value)}
          >
            {settings?.available_languages.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
          <p className={classes.hint}>{t.languageHint}</p>

          <div className={classes.actions}>
            <button
              type="submit"
              className={classes.button}
              disabled={!dirty || updateLanguage.isPending}
            >
              {updateLanguage.isPending ? t.saving : t.save}
            </button>
            <Link to="/" className={classes.back}>
              {t.backHome}
            </Link>
          </div>

          {updateLanguage.isSuccess && !dirty && (
            <p className={classes.success}>{t.saved}</p>
          )}
          {updateLanguage.isError && <p className={classes.error}>{t.saveError}</p>}
        </form>
      </Card>
    </section>
  );
};

export default SettingsPage;
