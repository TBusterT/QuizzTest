'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ApiError,
  fetchQuiz,
  type Question,
  type QuizDetail,
} from '@/services/quizzes';
import { TYPE_CONFIG } from '@/lib/question-types';
import { ArrowLeftIcon, CheckIcon } from '@/components/icons';

function QuestionView({
  question,
  index,
}: {
  question: Question;
  index: number;
}) {
  const config = TYPE_CONFIG[question.type];

  return (
    <div className="question-item">
      <div className="question-item-header">
        <div className="question-badge-group">
          <span className="question-order-badge">Q{index + 1}</span>
          <span className={`question-type-badge ${config.badgeClass}`}>
            {config.label}
          </span>
        </div>
      </div>

      <h3 className="question-item-text">{question.text}</h3>

      {question.type === 'BOOLEAN' && (
        <fieldset className="question-options-preview">
          <legend className="visually-hidden">
            Options for {question.text}
          </legend>
          <label className="preview-choice-pill">
            <input type="radio" name={`q-${question.id}`} disabled />
            <span>True</span>
          </label>
          <label className="preview-choice-pill">
            <input type="radio" name={`q-${question.id}`} disabled />
            <span>False</span>
          </label>
        </fieldset>
      )}

      {question.type === 'INPUT' && (
        <div className="input-preview-box">
          <input
            className="form-input"
            type="text"
            placeholder="Participant answer will be typed here..."
            disabled
          />
        </div>
      )}

      {question.type === 'CHECKBOX' && (
        <div className="question-options-list">
          {question.options?.map((opt) => (
            <div
              key={opt.id}
              className={`preview-option-card ${opt.isCorrect ? 'is-correct' : ''}`}
            >
              <div className="preview-option-left">
                <input
                  type="checkbox"
                  disabled
                  defaultChecked={opt.isCorrect}
                  className="preview-checkbox"
                />
                <span className="preview-option-label">{opt.label}</span>
              </div>
              {opt.isCorrect && (
                <span className="correct-tag">
                  <CheckIcon /> Correct answer
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function QuizDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [prevId, setPrevId] = useState<string | undefined>(id);
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (id !== prevId) {
    setPrevId(id);
    setQuiz(null);
    setLoading(true);
    setNotFound(false);
    setError(null);
  }

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();

    fetchQuiz(id, controller.signal)
      .then((data) => {
        setQuiz(data);
        setError(null);
        setNotFound(false);
      })
      .catch((err: unknown) => {
        if (
          err instanceof Error &&
          (err.name === 'AbortError' ||
            err.message.toLowerCase().includes('aborted'))
        ) {
          return;
        }
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load quiz.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [id]);

  if (loading) {
    return (
      <section className="page-card animate-fade-in">
        <div className="state-container">
          <div className="spinner" />
          <span className="state-text">Loading quiz details...</span>
        </div>
      </section>
    );
  }

  if (notFound) {
    return (
      <section className="page-card animate-fade-in">
        <div className="state-container empty-state">
          <div className="error-code">404</div>
          <h2 className="empty-title">Quiz not found</h2>
          <p className="empty-description">
            The quiz you are looking for does not exist or may have been
            deleted.
          </p>
          <Link
            href="/quizzes"
            className="btn btn-primary"
            style={{ marginTop: '1rem' }}
          >
            <ArrowLeftIcon /> Back to all quizzes
          </Link>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page-card animate-fade-in">
        <div className="error-banner" role="alert">
          <strong>Error:</strong> {error}
        </div>
        <Link href="/quizzes" className="back-link">
          <ArrowLeftIcon /> Back to all quizzes
        </Link>
      </section>
    );
  }

  if (!quiz) return null;

  const totalQuestions = quiz.questions?.length ?? 0;

  return (
    <section className="page-card animate-fade-in">
      <div className="detail-top-nav">
        <Link href="/quizzes" className="back-link">
          <ArrowLeftIcon /> Back to quizzes
        </Link>
      </div>

      <div className="detail-header">
        <div>
          <div className="title-row">
            <h1>{quiz.title}</h1>
            <span className="count-pill">
              {totalQuestions} {totalQuestions === 1 ? 'question' : 'questions'}
            </span>
          </div>
          <p className="page-subtitle">
            Preview of this quiz and its configured answer criteria.
          </p>
        </div>
      </div>

      <div className="quiz-detail-questions">
        {quiz.questions && quiz.questions.length > 0 ? (
          quiz.questions.map((q, i) => (
            <QuestionView key={q.id} question={q} index={i} />
          ))
        ) : (
          <p className="empty-description">No questions in this quiz.</p>
        )}
      </div>

      <div className="detail-footer">
        <Link href="/quizzes" className="btn btn-secondary">
          <ArrowLeftIcon /> Back to all quizzes
        </Link>
      </div>
    </section>
  );
}
