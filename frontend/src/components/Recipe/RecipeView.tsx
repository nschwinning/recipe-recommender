import { useTranslation } from '../../i18n/useTranslation';
import classes from './RecipeView.module.css';

/** The subset of recipe fields shared by a draft and a saved recipe. */
export interface RecipeViewData {
  title: string;
  summary: string;
  cuisine: string | null;
  prep_minutes: number | null;
  cook_minutes: number | null;
  servings: number | null;
  ingredients: string[];
  steps: string[];
  tags: string[];
}

interface RecipeViewProps {
  recipe: RecipeViewData;
}

/** Read-only presentation of a recipe's content (title, meta, tags, columns). */
const RecipeView = ({ recipe }: RecipeViewProps) => {
  const { t } = useTranslation();

  const meta = [
    recipe.cuisine,
    recipe.prep_minutes != null ? t.prep(recipe.prep_minutes) : null,
    recipe.cook_minutes != null ? t.cook(recipe.cook_minutes) : null,
    recipe.servings != null ? t.serves(recipe.servings) : null,
  ].filter((item): item is string => Boolean(item));

  return (
    <article className={classes.recipe}>
      <h3 className={classes.title}>{recipe.title}</h3>
      {recipe.summary && <p className={classes.summary}>{recipe.summary}</p>}

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
    </article>
  );
};

export default RecipeView;
