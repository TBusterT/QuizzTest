'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { deleteQuiz, fetchQuizzes, type QuizSummary } from '@/services/quizzes';
import {
  EmptyFolderIcon,
  PlusIcon,
  QuestionIcon,
  TrashIcon,
} from '@/components/icons';

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchQuizzes(controller.signal)
      .then(setQuizzes)
      .catch((err: unknown) => {
        if (
          err instanceof Error &&
          (err.name === 'AbortError' ||
            err.message.toLowerCase().includes('aborted'))
        ) {
          return;
        }
        setError(
          err instanceof Error ? err.message : 'Failed to load quizzes.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, []);

  async function handleDelete(id: string, title: string) {
    if (
      !window.confirm(
        `Are you sure you want to delete "${title}"? This cannot be undone.`,
      )
    ) {
      return;
    }
    setDeletingId(id);
    setDeleteError(null);
    try {
      await deleteQuiz(id);
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : 'Failed to delete quiz.',
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="page-card animate-fade-in">
      <div className="page-header">
        <div>
          <div className="title-row">
            <h1>Quizzes</h1>
            {!loading && !error && (
              <span className="count-pill">
                {quizzes.length} {quizzes.length === 1 ? 'quiz' : 'quizzes'}
              </span>
            )}
          </div>
          <p className="page-subtitle">
            Browse all custom quizzes or create a new interactive quiz.
          </p>
        </div>
        <Link href="/create" className="btn btn-primary shadow-glow">
          <PlusIcon /> Create quiz
        </Link>
      </div>

      {loading && (
        <div className="state-container">
          <div className="spinner" />
          <span className="state-text">Loading quizzes...</span>
        </div>
      )}

      {!loading && error && (
        <div className="error-banner" role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}

      {deleteError && (
        <div className="error-banner animate-shake" role="alert">
          <strong>Error:</strong> {deleteError}
        </div>
      )}

      {!loading && !error && quizzes.length === 0 && (
        <div className="state-container empty-state">
          <EmptyFolderIcon />
          <h2 className="empty-title">No quizzes yet</h2>
          <p className="empty-description">
            Get started by creating your very first quiz with true/false, short
            answer, or multiple-choice questions.
          </p>
          <Link
            href="/create"
            className="btn btn-primary"
            style={{ marginTop: '0.75rem' }}
          >
            <PlusIcon /> Create your first quiz
          </Link>
        </div>
      )}

      {!loading && !error && quizzes.length > 0 && (
        <div className="quizzes-grid">
          {quizzes.map((quiz) => {
            const questionCount = quiz._count?.questions ?? 0;
            const isDeleting = deletingId === quiz.id;

            return (
              <div key={quiz.id} className="quiz-card">
                <div className="quiz-card-inner">
                  <Link
                    href={`/quizzes/${quiz.id}`}
                    className="quiz-card-title"
                  >
                    {quiz.title}
                  </Link>
                  <button
                    type="button"
                    className="btn-icon btn-danger-hover"
                    aria-label={`Delete quiz: ${quiz.title}`}
                    title="Delete quiz"
                    disabled={isDeleting}
                    onClick={() => handleDelete(quiz.id, quiz.title)}
                  >
                    {isDeleting ? (
                      <span className="btn-spinner" />
                    ) : (
                      <TrashIcon />
                    )}
                  </button>
                </div>

                <div className="quiz-card-footer">
                  <span className="quiz-card-meta">
                    <QuestionIcon />
                    {questionCount}{' '}
                    {questionCount === 1 ? 'question' : 'questions'}
                  </span>
                  <Link
                    href={`/quizzes/${quiz.id}`}
                    className="card-link-action"
                  >
                    View details &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
