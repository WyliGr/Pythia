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

export interface QuestionSnapshot {
  id: string;
  label: string;
  type: Question['type'];
}
