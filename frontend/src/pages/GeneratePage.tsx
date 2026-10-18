import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Card from '../components/UI/Card';
import RecipeView from '../components/Recipe/RecipeView';
import { useCreateRecipe, useSuggestRecipe } from '../api/recipes';
import { useTranslation } from '../i18n/useTranslation';
import type { RecipeCreate, RecipeDraft } from '../types/api';
import classes from './GeneratePage.module.css';

/** Turn a generated draft into a save payload tagged as AI-generated. */
const toPayload = (draft: RecipeDraft): RecipeCreate => ({
  title: draft.title,
  summary: draft.summary,
  cuisine: draft.cuisine,
  prep_minutes: draft.prep_minutes,
  cook_minutes: draft.cook_minutes,
  servings: draft.servings,
  ingredients: draft.ingredients,
  steps: draft.steps,
  tags: draft.tags,
  language: draft.language,
  source: 'ai_generated',
  generated_by: draft.generated_by,
});

const GeneratePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const suggestRecipe = useSuggestRecipe();
  const createRecipe = useCreateRecipe();

  const [prompt, setPrompt] = useState('');
  const [draft, setDraft] = useState<RecipeDraft | null>(null);

  const handleGenerate = (event: React.FormEvent) => {
    event.preventDefault();
    const value = prompt.trim();
    if (!value || suggestRecipe.isPending) return;
    suggestRecipe.mutate(value, {
      onSuccess: (result) => setDraft(result),
    });
  };

  const handleSave = () => {
    if (!draft || createRecipe.isPending) return;
    createRecipe.mutate(toPayload(draft), {
      onSuccess: () => navigate('/saved'),
    });
  };

  const tryAnother = () => {
    setDraft(null);
    suggestRecipe.reset();
    createRecipe.reset();
  };

  return (
    <section className={classes.wrapper}>
      <Card>
        <form className={classes.form} onSubmit={handleGenerate}>
          <h2 className={classes.title}>{t.generateTitle}</h2>
          <p className={classes.intro}>{t.generateIntro}</p>

          <label className={classes.label} htmlFor="recipe-prompt">
            {t.promptLabel}
          </label>
          <textarea
            id="recipe-prompt"
            className={classes.textarea}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={t.promptPlaceholder}
            rows={4}
          />

          {suggestRecipe.isError && <p className={classes.error}>{t.generateError}</p>}

          <button
            type="submit"
            className={classes.primary}
            disabled={!prompt.trim() || suggestRecipe.isPending}
          >
            {suggestRecipe.isPending ? t.generating : t.generateButton}
          </button>
        </form>
      </Card>

      {draft && (
        <Card>
          <div className={classes.result}>
            <RecipeView recipe={draft} />

            {createRecipe.isError && <p className={classes.error}>{t.saveRecipeError}</p>}

            <div className={classes.actions}>
              <button
                type="button"
                className={classes.primary}
                onClick={handleSave}
                disabled={createRecipe.isPending}
              >
                {createRecipe.isPending ? t.savingRecipe : t.addToRecipes}
              </button>
              <button type="button" className={classes.secondary} onClick={tryAnother}>
                {t.tryAnother}
              </button>
            </div>
          </div>
        </Card>
      )}
    </section>
  );
};

export default GeneratePage;
