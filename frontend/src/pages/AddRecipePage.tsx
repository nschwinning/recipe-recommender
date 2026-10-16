import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Card from '../components/UI/Card';
import { useCreateRecipe, useParseRecipe } from '../api/recipes';
import { useTranslation } from '../i18n/useTranslation';
import type { RecipeCreate, RecipeDraft } from '../types/api';
import classes from './AddRecipePage.module.css';

/** The editable review form holds numbers as strings so inputs stay controlled
 * and can be cleared; they are parsed back to numbers on save. */
interface DraftForm {
  title: string;
  summary: string;
  cuisine: string;
  prep_minutes: string;
  cook_minutes: string;
  servings: string;
  ingredients: string[];
  steps: string[];
  tags: string[];
  language: string;
  generated_by: string;
}

const numberToField = (value: number | null): string => (value == null ? '' : String(value));

const fieldToNumber = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const toDraftForm = (draft: RecipeDraft): DraftForm => ({
  title: draft.title,
  summary: draft.summary,
  cuisine: draft.cuisine ?? '',
  prep_minutes: numberToField(draft.prep_minutes),
  cook_minutes: numberToField(draft.cook_minutes),
  servings: numberToField(draft.servings),
  ingredients: draft.ingredients.length > 0 ? draft.ingredients : [''],
  steps: draft.steps.length > 0 ? draft.steps : [''],
  tags: draft.tags,
  language: draft.language,
  generated_by: draft.generated_by,
});

const toPayload = (form: DraftForm): RecipeCreate => ({
  title: form.title.trim(),
  summary: form.summary.trim(),
  cuisine: form.cuisine.trim() || null,
  prep_minutes: fieldToNumber(form.prep_minutes),
  cook_minutes: fieldToNumber(form.cook_minutes),
  servings: fieldToNumber(form.servings),
  ingredients: form.ingredients.map((item) => item.trim()).filter(Boolean),
  steps: form.steps.map((item) => item.trim()).filter(Boolean),
  tags: form.tags,
  language: form.language,
  source: 'ai_parsed',
  generated_by: form.generated_by,
});

const AddRecipePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const parseRecipe = useParseRecipe();
  const createRecipe = useCreateRecipe();

  const [text, setText] = useState('');
  const [form, setForm] = useState<DraftForm | null>(null);
  const [newTag, setNewTag] = useState('');

  const handleParse = (event: React.FormEvent) => {
    event.preventDefault();
    const value = text.trim();
    if (!value || parseRecipe.isPending) return;
    parseRecipe.mutate(value, {
      onSuccess: (draft) => setForm(toDraftForm(draft)),
    });
  };

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form || !form.title.trim() || createRecipe.isPending) return;
    createRecipe.mutate(toPayload(form), {
      onSuccess: () => navigate('/saved'),
    });
  };

  const startOver = () => {
    setForm(null);
    setText('');
    parseRecipe.reset();
    createRecipe.reset();
  };

  // --- Field helpers (only called once a form exists) ---
  const setField = <K extends keyof DraftForm>(key: K, value: DraftForm[K]) =>
    setForm((current) => (current ? { ...current, [key]: value } : current));

  const setListItem = (key: 'ingredients' | 'steps', index: number, value: string) =>
    setForm((current) => {
      if (!current) return current;
      const next = [...current[key]];
      next[index] = value;
      return { ...current, [key]: next };
    });

  const addListItem = (key: 'ingredients' | 'steps') =>
    setForm((current) => (current ? { ...current, [key]: [...current[key], ''] } : current));

  const removeListItem = (key: 'ingredients' | 'steps', index: number) =>
    setForm((current) =>
      current ? { ...current, [key]: current[key].filter((_, i) => i !== index) } : current,
    );

  const addTag = () => {
    const value = newTag.trim();
    setNewTag('');
    if (!value || !form) return;
    if (form.tags.some((tag) => tag.toLowerCase() === value.toLowerCase())) return;
    setField('tags', [...form.tags, value]);
  };

  const removeTag = (tag: string) =>
    setForm((current) =>
      current ? { ...current, tags: current.tags.filter((item) => item !== tag) } : current,
    );

  if (!form) {
    return (
      <section className={classes.wrapper}>
        <Card>
          <form className={classes.pasteForm} onSubmit={handleParse}>
            <h2 className={classes.title}>{t.importTitle}</h2>
            <p className={classes.intro}>{t.importIntro}</p>

            <label className={classes.label} htmlFor="recipe-text">
              {t.pasteLabel}
            </label>
            <textarea
              id="recipe-text"
              className={classes.textarea}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={t.pastePlaceholder}
              rows={12}
            />

            {parseRecipe.isError && <p className={classes.error}>{t.parseError}</p>}

            <button
              type="submit"
              className={classes.primary}
              disabled={!text.trim() || parseRecipe.isPending}
            >
              {parseRecipe.isPending ? t.parsing : t.parseButton}
            </button>
          </form>
        </Card>
      </section>
    );
  }

  return (
    <section className={classes.wrapper}>
      <Card>
        <form className={classes.reviewForm} onSubmit={handleSave}>
          <h2 className={classes.title}>{t.reviewTitle}</h2>
          <p className={classes.intro}>{t.reviewIntro}</p>

          <label className={classes.label} htmlFor="field-title">
            {t.fieldTitle}
          </label>
          <input
            id="field-title"
            className={classes.input}
            value={form.title}
            onChange={(event) => setField('title', event.target.value)}
          />

          <label className={classes.label} htmlFor="field-summary">
            {t.fieldSummary}
          </label>
          <textarea
            id="field-summary"
            className={classes.textareaSmall}
            value={form.summary}
            onChange={(event) => setField('summary', event.target.value)}
            rows={3}
          />

          <div className={classes.grid}>
            <div>
              <label className={classes.label} htmlFor="field-cuisine">
                {t.fieldCuisine}
              </label>
              <input
                id="field-cuisine"
                className={classes.input}
                value={form.cuisine}
                onChange={(event) => setField('cuisine', event.target.value)}
              />
            </div>
            <div>
              <label className={classes.label} htmlFor="field-servings">
                {t.fieldServings}
              </label>
              <input
                id="field-servings"
                className={classes.input}
                type="number"
                min={0}
                value={form.servings}
                onChange={(event) => setField('servings', event.target.value)}
              />
            </div>
            <div>
              <label className={classes.label} htmlFor="field-prep">
                {t.fieldPrep}
              </label>
              <input
                id="field-prep"
                className={classes.input}
                type="number"
                min={0}
                value={form.prep_minutes}
                onChange={(event) => setField('prep_minutes', event.target.value)}
              />
            </div>
            <div>
              <label className={classes.label} htmlFor="field-cook">
                {t.fieldCook}
              </label>
              <input
                id="field-cook"
                className={classes.input}
                type="number"
                min={0}
                value={form.cook_minutes}
                onChange={(event) => setField('cook_minutes', event.target.value)}
              />
            </div>
          </div>

          <fieldset className={classes.listGroup}>
            <legend className={classes.label}>{t.ingredients}</legend>
            {form.ingredients.map((item, index) => (
              <div key={index} className={classes.listRow}>
                <input
                  className={classes.input}
                  value={item}
                  aria-label={`${t.ingredients} ${index + 1}`}
                  onChange={(event) => setListItem('ingredients', index, event.target.value)}
                />
                <button
                  type="button"
                  className={classes.remove}
                  onClick={() => removeListItem('ingredients', index)}
                  aria-label={t.removeItem}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              className={classes.addLine}
              onClick={() => addListItem('ingredients')}
            >
              + {t.addIngredient}
            </button>
          </fieldset>

          <fieldset className={classes.listGroup}>
            <legend className={classes.label}>{t.steps}</legend>
            {form.steps.map((item, index) => (
              <div key={index} className={classes.listRow}>
                <input
                  className={classes.input}
                  value={item}
                  aria-label={`${t.steps} ${index + 1}`}
                  onChange={(event) => setListItem('steps', index, event.target.value)}
                />
                <button
                  type="button"
                  className={classes.remove}
                  onClick={() => removeListItem('steps', index)}
                  aria-label={t.removeItem}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              className={classes.addLine}
              onClick={() => addListItem('steps')}
            >
              + {t.addStep}
            </button>
          </fieldset>

          <div className={classes.tagsSection}>
            <span className={classes.label}>{t.tagsLabel}</span>
            <ul className={classes.tags}>
              {form.tags.map((tag) => (
                <li key={tag} className={classes.tag}>
                  {tag}
                  <button
                    type="button"
                    className={classes.tagRemove}
                    onClick={() => removeTag(tag)}
                    aria-label={t.removeTag(tag)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <div className={classes.tagForm}>
              <input
                className={classes.input}
                value={newTag}
                onChange={(event) => setNewTag(event.target.value)}
                placeholder={t.addTagPlaceholder}
                aria-label={t.addTagPlaceholder}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addTag();
                  }
                }}
              />
              <button type="button" className={classes.addLine} onClick={addTag}>
                {t.addTag}
              </button>
            </div>
          </div>

          {createRecipe.isError && <p className={classes.error}>{t.saveRecipeError}</p>}

          <div className={classes.actions}>
            <button
              type="submit"
              className={classes.primary}
              disabled={!form.title.trim() || createRecipe.isPending}
            >
              {createRecipe.isPending ? t.savingRecipe : t.saveRecipe}
            </button>
            <button type="button" className={classes.secondary} onClick={startOver}>
              {t.startOver}
            </button>
          </div>
        </form>
      </Card>
    </section>
  );
};

export default AddRecipePage;
