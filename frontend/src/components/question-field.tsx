'use client';

import type { QuestionType } from '@/services/quizzes';
import { TYPE_CONFIG } from '@/lib/question-types';
import { CheckboxOptions, type OptionDraft } from './checkbox-options';
import { ArrowDownIcon, ArrowUpIcon, TrashIcon } from './icons';

export interface QuestionDraft {
  id: string;
  type: QuestionType;
  text: string;
  options: OptionDraft[];
}

interface QuestionFieldProps {
  question: QuestionDraft;
  index: number;
  totalQuestions: number;
  onUpdateQuestion: (patch: Partial<QuestionDraft>) => void;
  onRemoveQuestion: () => void;
  onMoveQuestion: (direction: 'up' | 'down') => void;
  onAddOption: () => void;
  onUpdateOption: (optionId: string, patch: Partial<OptionDraft>) => void;
  onRemoveOption: (optionId: string) => void;
}

export function QuestionField({
  question,
  index,
  totalQuestions,
  onUpdateQuestion,
  onRemoveQuestion,
  onMoveQuestion,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
}: QuestionFieldProps) {
  const config = TYPE_CONFIG[question.type];
  const inputId = `q-text-${question.id}`;

  return (
    <div className="question-card">
      <div className="question-card-header">
        <div className="question-badge-group">
          <span className="question-order-badge">Q{index + 1}</span>
          <span className={`question-type-badge ${config.badgeClass}`}>
            {config.label}
          </span>
        </div>

        <div className="question-card-actions">
          <button
            type="button"
            className="btn-icon"
            title="Move question up"
            disabled={index === 0}
            onClick={() => onMoveQuestion('up')}
          >
            <ArrowUpIcon />
          </button>
          <button
            type="button"
            className="btn-icon"
            title="Move question down"
            disabled={index === totalQuestions - 1}
            onClick={() => onMoveQuestion('down')}
          >
            <ArrowDownIcon />
          </button>
          <button
            type="button"
            className="btn-icon btn-danger-hover"
            title="Remove question"
            aria-label={`Remove question ${index + 1}`}
            onClick={onRemoveQuestion}
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor={inputId}>
          Question text <span className="required-star">*</span>
        </label>
        <input
          id={inputId}
          className="form-input"
          type="text"
            placeholder="Enter the question text here..."
          value={question.text}
          onChange={(e) => onUpdateQuestion({ text: e.target.value })}
        />
      </div>

      {question.type === 'BOOLEAN' && (
        <div className="boolean-preview-notice">
          <span className="info-icon">💡</span>
          <span>
            Participants will choose between fixed <strong>True</strong> and{' '}
            <strong>False</strong> options.
          </span>
        </div>
      )}

      {question.type === 'INPUT' && (
        <div className="input-preview-notice">
          <span className="info-icon">✍️</span>
          <span>
            Participants will see a free-form short text field to type their
            answer.
          </span>
        </div>
      )}

      {question.type === 'CHECKBOX' && (
        <CheckboxOptions
          questionId={question.id}
          options={question.options}
          onAddOption={onAddOption}
          onUpdateOption={onUpdateOption}
          onRemoveOption={onRemoveOption}
        />
      )}
    </div>
  );
}
