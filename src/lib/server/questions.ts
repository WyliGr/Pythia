import { z } from 'zod';
import { QUESTION_TYPES, type Question, type QuestionSnapshot } from '$lib/questions';

export { QUESTION_TYPES };

const questionSchema = z.object({
  id: z.string().min(1).max(64),
  type: z.enum(QUESTION_TYPES),
  label: z.string().min(1).max(500),
  required: z.boolean(),
  placeholder: z.string().max(200).optional(),
  helpText: z.string().max(500).optional(),
  options: z.array(z.string().min(1).max(300)).max(200).optional(),
  maxRating: z.number().int().min(2).max(10).optional()
});

export const questionsSchema = z.array(questionSchema).max(200);

const CHOICE_TYPES = new Set(['single_choice', 'multi_select', 'dropdown']);

export function validateQuestions(questions: unknown): { ok: true; questions: Question[] } | { ok: false; error: string } {
  const parsed = questionsSchema.safeParse(questions);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid questions' };
  const seen = new Set<string>();
  for (const q of parsed.data) {
    if (seen.has(q.id)) return { ok: false, error: `Duplicate question id ${q.id}` };
    seen.add(q.id);
    if (CHOICE_TYPES.has(q.type) && (!q.options || q.options.length < 1)) {
      return { ok: false, error: `Question "${q.label}" needs at least one option` };
    }
  }
  return { ok: true, questions: parsed.data };
}

export function snapshotQuestions(questions: Question[]): QuestionSnapshot[] {
  return questions.map((q) => ({ id: q.id, label: q.label, type: q.type }));
}

/**
 * Validate one submission against the form's questions.
 * Returns normalized answers or the first error message.
 */
export function validateAnswers(
  questions: Question[],
  raw: Record<string, unknown>
): { ok: true; answers: Record<string, unknown> } | { ok: false; error: string } {
  const answers: Record<string, unknown> = {};
  for (const q of questions) {
    const value = raw[q.id];
    const empty =
      value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
    if (q.required && empty) return { ok: false, error: `"${q.label}" is required` };
    if (empty) {
      answers[q.id] = null;
      continue;
    }
    switch (q.type) {
      case 'short_text':
      case 'long_text': {
        if (typeof value !== 'string') return { ok: false, error: `"${q.label}" must be text` };
        if (value.length > 10000) return { ok: false, error: `"${q.label}" is too long` };
        answers[q.id] = value;
        break;
      }
      case 'email': {
        if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value))
          return { ok: false, error: `"${q.label}" must be a valid email address` };
        answers[q.id] = value;
        break;
      }
      case 'number': {
        const n = typeof value === 'number' ? value : Number(value);
        if (!Number.isFinite(n)) return { ok: false, error: `"${q.label}" must be a number` };
        answers[q.id] = n;
        break;
      }
      case 'date': {
        if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)))
          return { ok: false, error: `"${q.label}" must be a valid date` };
        answers[q.id] = value;
        break;
      }
      case 'rating': {
        const max = q.maxRating ?? 5;
        const n = Number(value);
        if (!Number.isInteger(n) || n < 1 || n > max)
          return { ok: false, error: `"${q.label}" must be between 1 and ${max}` };
        answers[q.id] = n;
        break;
      }
      case 'single_choice':
      case 'dropdown': {
        if (typeof value !== 'string' || !(q.options ?? []).includes(value))
          return { ok: false, error: `"${q.label}" has an invalid choice` };
        answers[q.id] = value;
        break;
      }
      case 'multi_select': {
        if (!Array.isArray(value) || value.some((v) => typeof v !== 'string' || !(q.options ?? []).includes(v)))
          return { ok: false, error: `"${q.label}" has an invalid choice` };
        answers[q.id] = [...new Set(value)];
        break;
      }
    }
  }
  return { ok: true, answers };
}
