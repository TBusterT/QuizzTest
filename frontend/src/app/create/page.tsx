'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import {
  createQuiz,
  type QuestionOptionPayload,
  type QuestionPayload,
  type QuestionType,
} from '@/services/quizzes';
import { TYPE_CONFIG } from '@/lib/question-types';
import { QUIZ_LIMITS } from '@/lib/quiz-limits';
import { ArrowLeftIcon, PlusIcon } from '@/components/icons';
import { QuestionField, type QuestionDraft } from '@/components/question-field';
import type { OptionDraft } from '@/components/checkbox-options';

interface FormError {
  type: 'validation' | 'api';
  message: string;
}

export default function CreateQuizPage() {
  const router = useRouter();

  const nextQuestionId = useRef(2);
  const nextOptionId = useRef(1);

  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<QuestionDraft[]>([
    { id: 'q-1', type: 'BOOLEAN', text: '', options: [] },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<FormError | null>(null);

  function createOptionDraft(label = '', isCorrect = false): OptionDraft {
    const id = `opt-${nextOptionId.current++}`;
    return { id, label, isCorrect };
  }

  function addQuestion(type: QuestionType) {
    if (questions.length >= QUIZ_LIMITS.MAX_QUESTIONS) return;
    const id = `q-${nextQuestionId.current++}`;
    const initialOptions: OptionDraft[] =
      type === 'CHECKBOX'
        ? [createOptionDraft('', true), createOptionDraft('', false)]
        : [];
    setQuestions((prev) => [
      ...prev,
      { id, type, text: '', options: initialOptions },
    ]);
  }

  function removeQuestion(questionId: string) {
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
  }

  function moveQuestion(index: number, direction: 'up' | 'down') {
    setQuestions((prev) => {
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return copy;
    });
  }

  function updateQuestion(questionId: string, patch: Partial<QuestionDraft>) {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, ...patch } : q)),
    );
  }

  function addOption(questionId: string) {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        if (q.options.length >= QUIZ_LIMITS.MAX_OPTIONS_PER_CHECKBOX) return q;
        return {
          ...q,
          options: [...q.options, createOptionDraft('', false)],
        };
      }),
    );
  }

  function updateOption(
    questionId: string,
    optionId: string,
    patch: Partial<OptionDraft>,
  ) {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((o) =>
                o.id === optionId ? { ...o, ...patch } : o,
              ),
            }
          : q,
      ),
    );
  }

  function removeOption(questionId: string, optionId: string) {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? { ...q, options: q.options.filter((o) => o.id !== optionId) }
          : q,
      ),
    );
  }

  function validate(): string | null {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return 'Please provide a quiz title.';
    if (trimmedTitle.length > QUIZ_LIMITS.MAX_TITLE_LENGTH) {
      return `Quiz title cannot exceed ${QUIZ_LIMITS.MAX_TITLE_LENGTH} characters.`;
    }
    if (questions.length < QUIZ_LIMITS.MIN_QUESTIONS) {
      return 'Please add at least one question to the quiz.';
    }
    if (questions.length > QUIZ_LIMITS.MAX_QUESTIONS) {
      return `A quiz cannot have more than ${QUIZ_LIMITS.MAX_QUESTIONS} questions.`;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const trimmedText = q.text.trim();
      if (!trimmedText) {
        return `Question #${i + 1}: question text cannot be empty.`;
      }
      if (trimmedText.length > QUIZ_LIMITS.MAX_QUESTION_TEXT_LENGTH) {
        return `Question #${i + 1}: question text cannot exceed ${QUIZ_LIMITS.MAX_QUESTION_TEXT_LENGTH} characters.`;
      }
      if (q.type === 'CHECKBOX') {
        if (q.options.length < QUIZ_LIMITS.MIN_OPTIONS_PER_CHECKBOX) {
          return `Question #${i + 1}: multiple choice questions require at least ${QUIZ_LIMITS.MIN_OPTIONS_PER_CHECKBOX} options.`;
        }
        if (q.options.length > QUIZ_LIMITS.MAX_OPTIONS_PER_CHECKBOX) {
          return `Question #${i + 1}: multiple choice questions cannot exceed ${QUIZ_LIMITS.MAX_OPTIONS_PER_CHECKBOX} options.`;
        }
        if (q.options.some((o) => !o.label.trim())) {
          return `Question #${i + 1}: all option labels must be filled out.`;
        }
        if (
          q.options.some(
            (o) => o.label.trim().length > QUIZ_LIMITS.MAX_OPTION_LABEL_LENGTH,
          )
        ) {
          return `Question #${i + 1}: option labels cannot exceed ${QUIZ_LIMITS.MAX_OPTION_LABEL_LENGTH} characters.`;
        }
        if (!q.options.some((o) => o.isCorrect)) {
          return `Question #${i + 1}: mark at least one option as correct.`;
        }
      }
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validationMsg = validate();
    if (validationMsg) {
      setError({ type: 'validation', message: validationMsg });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        questions: questions.map((q): QuestionPayload => ({
          type: q.type,
          text: q.text.trim(),
          options:
            q.type === 'CHECKBOX'
              ? q.options.map((o): QuestionOptionPayload => ({
                  label: o.label.trim(),
                  isCorrect: o.isCorrect,
                }))
              : undefined,
        })),
      };

      await createQuiz(payload);
      router.push('/quizzes');
    } catch (err) {
      setError({
        type: 'api',
        message: err instanceof Error ? err.message : 'Failed to create quiz.',
      });
      setSubmitting(false);
    }
  }

  const isMaxQuestions = questions.length >= QUIZ_LIMITS.MAX_QUESTIONS;

  return (
    <section className="page-card animate-fade-in">
      <div className="detail-top-nav">
        <Link href="/quizzes" className="back-link">
          <ArrowLeftIcon /> Back to quizzes
        </Link>
      </div>

      <div className="page-header">
        <div>
          <h1>Create a new quiz</h1>
          <p className="page-subtitle">
            Configure your quiz title, questions, and scoring criteria.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="quiz-form" noValidate>
        <div className="form-group form-card">
          <label className="form-label" htmlFor="quiz-title">
            Quiz title <span className="required-star">*</span>
          </label>
          <input
            id="quiz-title"
            className="form-input form-input-lg"
            type="text"
            maxLength={QUIZ_LIMITS.MAX_TITLE_LENGTH}
            placeholder="e.g. World Capitals & Geography"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="questions-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Questions ({questions.length})</h2>
              <p className="section-desc">
                Add one or more questions. Mix and match question types as
                needed.
              </p>
            </div>
          </div>

          {questions.length === 0 ? (
            <div className="empty-questions-notice">
              <p>
                No questions added yet. Use the buttons below to add your first
                question.
              </p>
            </div>
          ) : (
            <div className="questions-list">
              {questions.map((q, qIdx) => (
                <QuestionField
                  key={q.id}
                  question={q}
                  index={qIdx}
                  totalQuestions={questions.length}
                  onUpdateQuestion={(patch) => updateQuestion(q.id, patch)}
                  onRemoveQuestion={() => removeQuestion(q.id)}
                  onMoveQuestion={(dir) => moveQuestion(qIdx, dir)}
                  onAddOption={() => addOption(q.id)}
                  onUpdateOption={(optId, patch) =>
                    updateOption(q.id, optId, patch)
                  }
                  onRemoveOption={(optId) => removeOption(q.id, optId)}
                />
              ))}
            </div>
          )}

          <div className="add-question-bar">
            <span className="add-question-label">Add a question:</span>
            <div className="add-question-buttons">
              {(['BOOLEAN', 'INPUT', 'CHECKBOX'] as QuestionType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className="btn btn-secondary add-type-btn"
                  disabled={isMaxQuestions}
                  onClick={() => addQuestion(t)}
                >
                  <PlusIcon /> {TYPE_CONFIG[t].label}
                </button>
              ))}
            </div>
            {isMaxQuestions && (
              <span
                className="label-subtext"
                style={{ color: 'var(--text-muted)' }}
              >
                Maximum {QUIZ_LIMITS.MAX_QUESTIONS} questions reached
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="error-banner animate-shake" role="alert">
            <strong>
              {error.type === 'validation' ? 'Validation:' : 'Error:'}
            </strong>{' '}
            {error.message}
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary btn-lg shadow-glow"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="btn-spinner" /> Saving quiz...
              </>
            ) : (
              'Save and publish quiz'
            )}
          </button>
          <Link href="/quizzes" className="btn btn-secondary btn-lg">
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
