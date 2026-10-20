import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import Card from '../components/UI/Card';
import { useAppSettings, useUpdateLanguage, useUpdatePreferences } from '../api/settings';
import { useTranslation } from '../i18n/useTranslation';
import type { Translation } from '../i18n/translations';
import classes from './SettingsPage.module.css';

/** Editor for an ordered list of ingredient strings (liked/disliked). */
function IngredientList({
  label,
  hint,
  items,
  onChange,
  t,
}: {
  label: string;
  hint: string;
  items: string[];
  onChange: (next: string[]) => void;
  t: Translation;
}) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const value = draft.trim();
    if (!value) {
      return;
    }
    const exists = items.some((item) => item.toLowerCase() === value.toLowerCase());
    if (!exists) {
      onChange([...items, value]);
    }
    setDraft('');
  };

  return (
    <div className={classes.field}>
      <span className={classes.label}>{label}</span>
      {items.length > 0 && (
        <ul className={classes.chips}>
          {items.map((item) => (
            <li key={item} className={classes.chip}>
              <span>{item}</span>
              <button
                type="button"
                className={classes.chipRemove}
                aria-label={t.removeIngredient(item)}
                onClick={() => onChange(items.filter((other) => other !== item))}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className={classes.chipAdd}>
        <input
          type="text"
          className={classes.input}
          value={draft}
          placeholder={t.addIngredientPlaceholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className={classes.secondary} onClick={add}>
          {t.addIngredientButton}
        </button>
      </div>
      <p className={classes.hint}>{hint}</p>
    </div>
  );
}

const SettingsPage = () => {
  const { t } = useTranslation();
  const { data: settings, isLoading } = useAppSettings();
  const updateLanguage = useUpdateLanguage();
  const updatePreferences = useUpdatePreferences();

  const [selected, setSelected] = useState<string>('');
  const [servings, setServings] = useState<string>('');
  const [diet, setDiet] = useState<string>('none');
  const [liked, setLiked] = useState<string[]>([]);
  const [disliked, setDisliked] = useState<string[]>([]);

  // Keep the controls in sync with the loaded/updated server value.
  useEffect(() => {
    if (settings) {
      setSelected(settings.language);
      setServings(settings.servings != null ? String(settings.servings) : '');
      setDiet(settings.diet);
      setLiked(settings.liked_ingredients);
      setDisliked(settings.disliked_ingredients);
    }
  }, [settings]);

  const languageDirty = settings != null && selected !== settings.language;

  const prefsDirty =
    settings != null &&
    (servings !== (settings.servings != null ? String(settings.servings) : '') ||
      diet !== settings.diet ||
      JSON.stringify(liked) !== JSON.stringify(settings.liked_ingredients) ||
      JSON.stringify(disliked) !== JSON.stringify(settings.disliked_ingredients));

  const handleLanguageSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (languageDirty) {
      updateLanguage.mutate(selected);
    }
  };

  const handlePreferencesSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!prefsDirty) {
      return;
    }
    const parsed = servings.trim() === '' ? null : Number(servings);
    updatePreferences.mutate({
      servings: parsed != null && Number.isFinite(parsed) ? parsed : null,
      diet,
      liked_ingredients: liked,
      disliked_ingredients: disliked,
    });
  };

  return (
    <section className={classes.wrapper}>
      <Card>
        <form className={classes.form} onSubmit={handleLanguageSubmit}>
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
              disabled={!languageDirty || updateLanguage.isPending}
            >
              {updateLanguage.isPending ? t.saving : t.save}
            </button>
            <Link to="/" className={classes.back}>
              {t.backHome}
            </Link>
          </div>

          {updateLanguage.isSuccess && !languageDirty && (
            <p className={classes.success}>{t.saved}</p>
          )}
          {updateLanguage.isError && <p className={classes.error}>{t.saveError}</p>}
        </form>
      </Card>

      <Card>
        <form className={classes.form} onSubmit={handlePreferencesSubmit}>
          <h2 className={classes.title}>{t.preferencesTitle}</h2>
          <p className={classes.intro}>{t.preferencesIntro}</p>

          <label className={classes.label} htmlFor="servings">
            {t.servingsLabel}
          </label>
          <input
            id="servings"
            type="number"
            min={1}
            max={50}
            className={classes.input}
            value={servings}
            placeholder={t.servingsPlaceholder}
            disabled={isLoading || !settings}
            onChange={(event) => setServings(event.target.value)}
          />
          <p className={classes.hint}>{t.servingsHint}</p>

          <label className={classes.label} htmlFor="diet">
            {t.dietLabel}
          </label>
          <select
            id="diet"
            className={classes.select}
            value={diet}
            disabled={isLoading || !settings}
            onChange={(event) => setDiet(event.target.value)}
          >
            {settings?.available_diets.map((code) => (
              <option key={code} value={code}>
                {t.dietName(code)}
              </option>
            ))}
          </select>
          <p className={classes.hint}>{t.dietHint}</p>

          <IngredientList
            label={t.likedLabel}
            hint={t.likedHint}
            items={liked}
            onChange={setLiked}
            t={t}
          />
          <IngredientList
            label={t.dislikedLabel}
            hint={t.dislikedHint}
            items={disliked}
            onChange={setDisliked}
            t={t}
          />

          <div className={classes.actions}>
            <button
              type="submit"
              className={classes.button}
              disabled={!prefsDirty || updatePreferences.isPending}
            >
              {updatePreferences.isPending ? t.saving : t.save}
            </button>
          </div>

          {updatePreferences.isSuccess && !prefsDirty && (
            <p className={classes.success}>{t.preferencesSaved}</p>
          )}
          {updatePreferences.isError && <p className={classes.error}>{t.preferencesSaveError}</p>}
        </form>
      </Card>
    </section>
  );
};

export default SettingsPage;
