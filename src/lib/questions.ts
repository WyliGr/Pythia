/** Shared question model — safe to import from client and server code. */

export const QUESTION_TYPES = [
  'short_text',
  'long_text',
  'single_choice',
  'multi_select',
  'dropdown',
  'rating',
  'date',
  'email',
  'number'
] as const;

export interface Question {
  id: string;
  type: (typeof QUESTION_TYPES)[number];
  label: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  /** Choice types only. */
  options?: string[];
  /** Rating only. */
  maxRating?: number;
}

/** Switch a question's type, seeding per-type fields. Leftover fields are kept
 *  (the server schema tolerates them) so toggling types back and forth is lossless. */
export function migrateQuestionType(q: Question, type: Question['type']): Question {
  const next: Question = { ...q, type };
  if (type === 'rating' && (next.maxRating === undefined || next.maxRating < 2)) next.maxRating = 5;
  if (
    ['single_choice', 'multi_select', 'dropdown'].includes(type) &&
    (!next.options || next.options.length === 0)
  ) {
    next.options = [''];
  }
  return next;
}

export interface QuestionSnapshot {
  id: string;
  label: string;
  type: Question['type'];
}
