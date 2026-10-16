import Card from '../UI/Card';
import { useTranslation } from '../../i18n/useTranslation';
import type { Recipe } from '../../types/api';
import classes from './SavedRecipeCard.module.css';

interface SavedRecipeCardProps {
  recipe: Recipe;
}

/** A compact, read-only card for one recipe in the saved library. The full
 * ingredient and step lists live behind a native <details> disclosure so the
 * list stays scannable. */
const SavedRecipeCard = ({ recipe }: SavedRecipeCardProps) => {
  const { t } = useTranslation();

  const meta = [
    recipe.cuisine,
    recipe.prep_minutes != null ? t.prep(recipe.prep_minutes) : null,
    recipe.cook_minutes != null ? t.cook(recipe.cook_minutes) : null,
    recipe.servings != null ? t.serves(recipe.servings) : null,
  ].filter((item): item is string => Boolean(item));

  return (
    <Card>
      <article className={classes.recipe}>
        <h3 className={classes.title}>{recipe.title}</h3>
        <p className={classes.summary}>{recipe.summary}</p>

        {meta.length > 0 && (
          <ul className={classes.meta}>
            {meta.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}

        {recipe.tags.length > 0 && (
          <ul className={classes.tags}>
            {recipe.tags.map((tag) => (
              <li key={tag} className={classes.tag}>
                {tag}
              </li>
            ))}
          </ul>
        )}

        <details className={classes.details}>
          <summary className={classes.summaryToggle}>{t.showRecipe}</summary>
          <div className={classes.columns}>
            <div>
              <h4>{t.ingredients}</h4>
              <ul className={classes.ingredients}>
                {recipe.ingredients.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4>{t.steps}</h4>
              <ol className={classes.steps}>
                {recipe.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        </details>
      </article>
    </Card>
  );
};

export default SavedRecipeCard;
