'use client';

import { QUIZ_LIMITS } from '@/lib/quiz-limits';
import { PlusIcon, TrashIcon } from './icons';

export interface OptionDraft {
  id: string;
  label: string;
  isCorrect: boolean;
}

interface CheckboxOptionsProps {
  questionId: string;
  options: OptionDraft[];
  onAddOption: () => void;
  onUpdateOption: (optionId: string, patch: Partial<OptionDraft>) => void;
  onRemoveOption: (optionId: string) => void;
}

export function CheckboxOptions({
  questionId,
  options,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
}: CheckboxOptionsProps) {
  const isMaxOptions = options.length >= QUIZ_LIMITS.MAX_OPTIONS_PER_CHECKBOX;

  return (
    <div className="options-builder">
      <label className="form-label">
        Answer Options <span className="required-star">*</span>
        <span className="label-subtext">
          (Check the box next to correct options)
        </span>
      </label>

      <div className="options-list">
        {options.map((opt, oIdx) => {
          const inputId = `opt-input-${questionId}-${opt.id}`;
          return (
            <div key={opt.id} className="option-row">
              <label
                className={`option-check-toggle ${opt.isCorrect ? 'is-checked' : ''}`}
                title={opt.isCorrect ? 'Correct answer' : 'Mark as correct'}
              >
                <input
                  type="checkbox"
                  checked={opt.isCorrect}
                  onChange={(e) =>
                    onUpdateOption(opt.id, { isCorrect: e.target.checked })
                  }
                />
                <span>{opt.isCorrect ? 'Correct' : 'Mark'}</span>
              </label>

              <input
                id={inputId}
                className="form-input"
                type="text"
                maxLength={QUIZ_LIMITS.MAX_OPTION_LABEL_LENGTH}
                placeholder={`Option ${oIdx + 1} label`}
                value={opt.label}
                onChange={(e) =>
                  onUpdateOption(opt.id, { label: e.target.value })
                }
              />

              {options.length > 2 && (
                <button
                  type="button"
                  className="btn-icon btn-danger-hover"
                  aria-label={`Remove option ${oIdx + 1}`}
                  title="Remove option"
                  onClick={() => onRemoveOption(opt.id)}
                >
                  <TrashIcon />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginTop: '0.85rem',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          className="btn btn-secondary btn-sm add-option-btn"
          style={{ marginTop: 0 }}
          disabled={isMaxOptions}
          onClick={onAddOption}
        >
          <PlusIcon /> Add another option
        </button>
        {isMaxOptions && (
          <span
            className="label-subtext"
            style={{ color: 'var(--text-muted)' }}
          >
            Maximum {QUIZ_LIMITS.MAX_OPTIONS_PER_CHECKBOX} options reached
          </span>
        )}
      </div>
    </div>
  );
}
