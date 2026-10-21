/**
 * Client-side validation limits for quizzes.
 * These values MUST match the server-side constraints defined in backend/src/quizzes/dto/create-quiz.dto.ts.
 */
export const QUIZ_LIMITS = {
  MAX_TITLE_LENGTH: 200,
  MAX_QUESTION_TEXT_LENGTH: 500,
  MAX_OPTION_LABEL_LENGTH: 300,
  MIN_OPTIONS_PER_CHECKBOX: 2,
  MAX_OPTIONS_PER_CHECKBOX: 20,
  MIN_QUESTIONS: 1,
  MAX_QUESTIONS: 50,
} as const;
