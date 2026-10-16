import { useMemo, useState } from 'react';

import SavedRecipeCard from '../components/Recipe/SavedRecipeCard';
import { useSavedRecipes } from '../api/recipes';
import { useTranslation } from '../i18n/useTranslation';
import type { Recipe } from '../types/api';
import classes from './SavedRecipesPage.module.css';

/** Collect the distinct tags across all recipes, keyed case-insensitively and
 * sorted alphabetically. The first spelling encountered is used for display. */
function collectTags(recipes: Recipe[]): string[] {
  const byKey = new Map<string, string>();
  for (const recipe of recipes) {
    for (const tag of recipe.tags) {
      const key = tag.toLowerCase();
      if (!byKey.has(key)) {
        byKey.set(key, tag);
      }
    }
  }
  return [...byKey.values()].sort((a, b) => a.localeCompare(b));
}

const SavedRecipesPage = () => {
  const { t } = useTranslation();
  const { data: recipes, isLoading, isError } = useSavedRecipes();

  // Selected tags are stored lowercased so matching is case-insensitive.
  const [selected, setSelected] = useState<string[]>([]);

  const allTags = useMemo(() => collectTags(recipes ?? []), [recipes]);

  const visible = useMemo(() => {
    const list = recipes ?? [];
    if (selected.length === 0) {
      return list;
    }
    return list.filter((recipe) => {
      const tagKeys = recipe.tags.map((tag) => tag.toLowerCase());
      return selected.every((key) => tagKeys.includes(key));
    });
  }, [recipes, selected]);

  const toggleTag = (tag: string) => {
    const key = tag.toLowerCase();
    setSelected((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  };

  if (isLoading) {
    return (
      <section className={classes.status}>
        <p>{t.savedLoading}</p>
      </section>
    );
  }

  if (isError || !recipes) {
    return (
      <section className={classes.status}>
        <p>{t.savedError}</p>
      </section>
    );
  }

  return (
    <section className={classes.wrapper}>
      <header className={classes.head}>
        <h2 className={classes.title}>{t.savedTitle}</h2>
        <p className={classes.intro}>{t.savedIntro}</p>
      </header>

      {recipes.length === 0 ? (
        <p className={classes.empty}>{t.savedEmpty}</p>
      ) : (
        <>
          {allTags.length > 0 && (
            <div className={classes.filter}>
              <div className={classes.filterHead}>
                <span className={classes.filterLabel}>{t.filterByTag}</span>
                {selected.length > 0 && (
                  <button
                    type="button"
                    className={classes.clear}
                    onClick={() => setSelected([])}
                  >
                    {t.clearFilters}
                  </button>
                )}
              </div>
              <ul className={classes.filterTags}>
                {allTags.map((tag) => {
                  const active = selected.includes(tag.toLowerCase());
                  return (
                    <li key={tag}>
                      <button
                        type="button"
                        className={`${classes.filterTag} ${active ? classes.filterTagActive : ''}`}
                        onClick={() => toggleTag(tag)}
                        aria-pressed={active}
                      >
                        {tag}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <p className={classes.count}>{t.savedCount(visible.length)}</p>

          {visible.length === 0 ? (
            <p className={classes.empty}>{t.noMatches}</p>
          ) : (
            <div className={classes.list}>
              {visible.map((recipe) => (
                <SavedRecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default SavedRecipesPage;
