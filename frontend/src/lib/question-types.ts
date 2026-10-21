import type { QuestionType } from '@/services/quizzes';

export interface QuestionTypeConfig {
  label: string;
  badgeClass: string;
  desc: string;
}

export const TYPE_CONFIG: Record<QuestionType, QuestionTypeConfig> = {
  BOOLEAN: {
    label: 'True / False',
    badgeClass: 'badge-boolean',
    desc: 'Binary choice question',
  },
  INPUT: {
    label: 'Short answer',
    badgeClass: 'badge-input',
    desc: 'Open text response',
  },
  CHECKBOX: {
    label: 'Multiple choice',
    badgeClass: 'badge-checkbox',
    desc: 'Options with correct answers',
  },
};
