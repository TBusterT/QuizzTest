import { API_BASE_URL } from './api-config';

// ─── Types ───────────────────────────────────────────────────────────────────

export type QuestionType = 'BOOLEAN' | 'INPUT' | 'CHECKBOX';

export interface QuestionOption {
  id: string;
  label: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  order: number;
  options: QuestionOption[];
}

export interface QuizSummary {
  id: string;
  title: string;
  createdAt: string;
  _count: { questions: number };
}

export interface QuizDetail {
  id: string;
  title: string;
  createdAt: string;
  questions: Question[];
}

export interface QuestionOptionPayload {
  label: string;
  isCorrect: boolean;
}

export interface QuestionPayload {
  type: QuestionType;
  text: string;
  options?: QuestionOptionPayload[];
}

export interface CreateQuizPayload {
  title: string;
  questions: QuestionPayload[];
}

// ─── Error class ─────────────────────────────────────────────────────────────

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const body = (await res.json()) as { message?: string | string[] };
      if (body.message) {
        message = Array.isArray(body.message)
          ? body.message.join('; ')
          : body.message;
      }
    } catch {
      // ignore JSON parse error
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function fetchQuizzes(
  signal?: AbortSignal,
): Promise<QuizSummary[]> {
  const res = await fetch(`${API_BASE_URL}/quizzes`, { signal });
  return handleResponse<QuizSummary[]>(res);
}

export async function fetchQuiz(
  id: string,
  signal?: AbortSignal,
): Promise<QuizDetail> {
  const res = await fetch(`${API_BASE_URL}/quizzes/${encodeURIComponent(id)}`, {
    signal,
  });
  return handleResponse<QuizDetail>(res);
}

export async function createQuiz(data: CreateQuizPayload): Promise<QuizDetail> {
  const res = await fetch(`${API_BASE_URL}/quizzes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<QuizDetail>(res);
}

export async function deleteQuiz(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/quizzes/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return handleResponse<void>(res);
}
