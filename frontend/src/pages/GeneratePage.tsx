import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Card from '../components/UI/Card';
import RecipeView from '../components/Recipe/RecipeView';
import { useCreateRecipe, useRefineRecipe, useSuggestRecipe } from '../api/recipes';
import { useTranslation } from '../i18n/useTranslation';
import type { RecipeCreate, RecipeDraft } from '../types/api';
import classes from './GeneratePage.module.css';

/** One entry in the chat transcript: a user request or an AI recipe reply. */
type ChatEntry =
  | { role: 'user'; text: string }
  | { role: 'assistant'; draft: RecipeDraft };

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
  const refineRecipe = useRefineRecipe();
  const createRecipe = useCreateRecipe();

  const [input, setInput] = useState('');
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  // The most recent recipe is what further messages refine and what gets saved.
  const latestDraft = [...entries]
    .reverse()
    .find((entry): entry is Extract<ChatEntry, { role: 'assistant' }> => entry.role === 'assistant')
    ?.draft;

  const isPending = suggestRecipe.isPending || refineRecipe.isPending;
  const isError = suggestRecipe.isError || refineRecipe.isError;

  // Keep the newest message in view as the conversation grows.
  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
  }, [entries.length, isPending]);

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault();
    const value = input.trim();
    if (!value || isPending) return;

    setEntries((prev) => [...prev, { role: 'user', text: value }]);
    setInput('');

    const onSuccess = (draft: RecipeDraft) =>
      setEntries((prev) => [...prev, { role: 'assistant', draft }]);

    if (latestDraft) {
      refineRecipe.mutate({ message: value, previous: latestDraft }, { onSuccess });
    } else {
      suggestRecipe.mutate(value, { onSuccess });
    }
  };

  const handleSave = () => {
    if (!latestDraft || createRecipe.isPending) return;
    createRecipe.mutate(toPayload(latestDraft), {
      onSuccess: () => navigate('/saved'),
    });
  };

  const startOver = () => {
    setEntries([]);
    setInput('');
    suggestRecipe.reset();
    refineRecipe.reset();
    createRecipe.reset();
  };

  const hasConversation = entries.length > 0;

  return (
    <section className={classes.wrapper}>
      <Card>
        <div className={classes.chat}>
          <div className={classes.intro}>
            <h2 className={classes.title}>{t.generateTitle}</h2>
            <p className={classes.introText}>{t.generateIntro}</p>
          </div>

          {hasConversation && (
            <div className={classes.transcript}>
              {entries.map((entry, index) =>
                entry.role === 'user' ? (
                  <div key={index} className={classes.userRow}>
                    <div className={classes.userBubble}>
                      <span className={classes.bubbleLabel}>{t.youLabel}</span>
                      {entry.text}
                    </div>
                  </div>
                ) : (
                  <div key={index} className={classes.assistantRow}>
                    <RecipeView recipe={entry.draft} />
                  </div>
                ),
              )}

              {isPending && <p className={classes.pending}>{t.generating}</p>}
              {isError && <p className={classes.error}>{t.generateError}</p>}

              <div ref={endRef} />
            </div>
          )}

          {latestDraft && !isPending && (
            <div className={classes.actions}>
              <button
                type="button"
                className={classes.primary}
                onClick={handleSave}
                disabled={createRecipe.isPending}
              >
                {createRecipe.isPending ? t.savingRecipe : t.addToRecipes}
              </button>
              <button type="button" className={classes.secondary} onClick={startOver}>
                {t.tryAnother}
              </button>
            </div>
          )}

          {createRecipe.isError && <p className={classes.error}>{t.saveRecipeError}</p>}

          <form className={classes.composer} onSubmit={handleSend}>
            <textarea
              className={classes.textarea}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={hasConversation ? t.refinePlaceholder : t.promptPlaceholder}
              aria-label={t.promptLabel}
              rows={hasConversation ? 2 : 3}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  handleSend(event);
                }
              }}
            />
            <button type="submit" className={classes.send} disabled={!input.trim() || isPending}>
              {isPending ? t.generating : hasConversation ? t.sendMessage : t.generateButton}
            </button>
          </form>
        </div>
      </Card>
    </section>
  );
};

export default GeneratePage;
