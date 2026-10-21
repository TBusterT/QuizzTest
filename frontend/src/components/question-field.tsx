'use client';

import type { QuestionType } from '@/services/quizzes';
import { TYPE_CONFIG } from '@/lib/question-types';
import { QUIZ_LIMITS } from '@/lib/quiz-limits';
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
  const previewId = `answer-preview-${question.id}`;
  const previewDescriptionId = `${previewId}-description`;

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
          maxLength={QUIZ_LIMITS.MAX_QUESTION_TEXT_LENGTH}
          placeholder="Enter the question text here..."
          value={question.text}
          onChange={(e) => onUpdateQuestion({ text: e.target.value })}
        />
      </div>

      {question.type === 'BOOLEAN' && (
        <fieldset
          className="answer-preview"
          aria-describedby={previewDescriptionId}
        >
          <legend className="form-label">Answer preview</legend>
          <div className="question-options-preview">
            <label className="preview-choice-pill">
              <input type="radio" name={previewId} value="true" disabled />
              <span>True</span>
            </label>
            <label className="preview-choice-pill">
              <input type="radio" name={previewId} value="false" disabled />
              <span>False</span>
            </label>
          </div>
          <p id={previewDescriptionId} className="answer-preview-description">
            Participants will choose True or False.
          </p>
        </fieldset>
      )}

      {question.type === 'INPUT' && (
        <div className="answer-preview">
          <label className="form-label" htmlFor={previewId}>
            Answer preview
          </label>
          <div className="input-preview-box">
            <input
              id={previewId}
              className="form-input"
              type="text"
              placeholder="Short answer..."
              aria-describedby={previewDescriptionId}
              disabled
            />
          </div>
          <p id={previewDescriptionId} className="answer-preview-description">
            Participants will enter a short text answer.
          </p>
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
