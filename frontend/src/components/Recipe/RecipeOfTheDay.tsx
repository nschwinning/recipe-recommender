import { useState } from 'react';

import Card from '../UI/Card';
import { useRecipeOfTheDay, useToggleLike, useUpdateTags } from '../../api/recipes';
import { useTranslation } from '../../i18n/useTranslation';
import classes from './RecipeOfTheDay.module.css';

const formatDate = (iso: string, locale: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const RecipeOfTheDay = () => {
  const { data: recipe, isLoading, isError } = useRecipeOfTheDay();
  const { language, t } = useTranslation();
  const toggleLike = useToggleLike();
  const updateTags = useUpdateTags();
  const [newTag, setNewTag] = useState('');

  if (isLoading) {
    return (
      <section className={classes.status}>
        <p>{t.loading}</p>
      </section>
    );
  }

  if (isError || !recipe) {
    return (
      <section className={classes.status}>
        <p>{t.error}</p>
      </section>
    );
  }

  const meta = [
    recipe.cuisine,
    recipe.prep_minutes != null ? t.prep(recipe.prep_minutes) : null,
    recipe.cook_minutes != null ? t.cook(recipe.cook_minutes) : null,
    recipe.servings != null ? t.serves(recipe.servings) : null,
  ].filter((item): item is string => Boolean(item));

  const liked = recipe.saved_recipe_id != null;
  const tags = recipe.tags;

  const addTag = () => {
    const value = newTag.trim();
    if (!value || updateTags.isPending) {
      return;
    }
    // Case-insensitive guard against adding a tag that already exists.
    if (!tags.some((tag) => tag.toLowerCase() === value.toLowerCase())) {
      updateTags.mutate([...tags, value]);
    }
    setNewTag('');
  };

  const removeTag = (tag: string) => {
    if (!updateTags.isPending) {
      updateTags.mutate(tags.filter((item) => item !== tag));
    }
  };

  return (
    <section className={classes.wrapper}>
      <Card>
        <article className={classes.recipe}>
          <button
            type="button"
            className={`${classes.like} ${liked ? classes.liked : ''}`}
            onClick={() => toggleLike.mutate(liked)}
            disabled={toggleLike.isPending}
            aria-pressed={liked}
          >
            <span aria-hidden="true">{liked ? '♥' : '♡'}</span>
            {liked ? t.liked : t.like}
          </button>
          <p className={classes.date}>{formatDate(recipe.recipe_date, language)}</p>
          <h2 className={classes.title}>{recipe.title}</h2>
          <p className={classes.summary}>{recipe.summary}</p>

          {meta.length > 0 && (
            <ul className={classes.meta}>
              {meta.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}

          <div className={classes.tagsSection}>
            <span className={classes.tagsLabel}>{t.tagsLabel}</span>
            <ul className={classes.tags}>
              {tags.map((tag) => (
                <li key={tag} className={classes.tag}>
                  {tag}
                  <button
                    type="button"
                    className={classes.tagRemove}
                    onClick={() => removeTag(tag)}
                    disabled={updateTags.isPending}
                    aria-label={t.removeTag(tag)}
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </li>
              ))}
            </ul>
            <form
              className={classes.tagForm}
              onSubmit={(event) => {
                event.preventDefault();
                addTag();
              }}
            >
              <input
                type="text"
                className={classes.tagInput}
                value={newTag}
                onChange={(event) => setNewTag(event.target.value)}
                placeholder={t.addTagPlaceholder}
                aria-label={t.addTagPlaceholder}
              />
              <button
                type="submit"
                className={classes.tagAdd}
                disabled={!newTag.trim() || updateTags.isPending}
              >
                {t.addTag}
              </button>
            </form>
          </div>

          <div className={classes.columns}>
            <div>
              <h3>{t.ingredients}</h3>
              <ul className={classes.ingredients}>
                {recipe.ingredients.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>{t.steps}</h3>
              <ol className={classes.steps}>
                {recipe.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        </article>
      </Card>
    </section>
  );
};

export default RecipeOfTheDay;
