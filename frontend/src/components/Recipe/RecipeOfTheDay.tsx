import Card from '../UI/Card';
import { useRecipeOfTheDay } from '../../api/recipes';
import classes from './RecipeOfTheDay.module.css';

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const RecipeOfTheDay = () => {
  const { data: recipe, isLoading, isError } = useRecipeOfTheDay();

  if (isLoading) {
    return (
      <section className={classes.status}>
        <p>Cooking up today&apos;s recipe...</p>
      </section>
    );
  }

  if (isError || !recipe) {
    return (
      <section className={classes.status}>
        <p>Something went wrong fetching today&apos;s recipe.</p>
      </section>
    );
  }

  const meta = [
    recipe.cuisine,
    recipe.prep_minutes != null ? `Prep ${recipe.prep_minutes} min` : null,
    recipe.cook_minutes != null ? `Cook ${recipe.cook_minutes} min` : null,
    recipe.servings != null ? `Serves ${recipe.servings}` : null,
  ].filter((item): item is string => Boolean(item));

  return (
    <section className={classes.wrapper}>
      <Card>
        <article className={classes.recipe}>
          <p className={classes.date}>{formatDate(recipe.recipe_date)}</p>
          <h2 className={classes.title}>{recipe.title}</h2>
          <p className={classes.summary}>{recipe.summary}</p>

          {meta.length > 0 && (
            <ul className={classes.meta}>
              {meta.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}

          <div className={classes.columns}>
            <div>
              <h3>Ingredients</h3>
              <ul className={classes.ingredients}>
                {recipe.ingredients.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Steps</h3>
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
