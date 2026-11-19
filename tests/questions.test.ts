import { describe, expect, it } from 'vitest';
import { snapshotQuestions, validateAnswers, validateQuestions } from '../src/lib/server/questions';
import type { Question } from '../src/lib/server/db/schema';

const base: Question[] = [
  { id: 'name', type: 'short_text', label: 'Name', required: true },
  { id: 'bio', type: 'long_text', label: 'Bio', required: false },
  { id: 'mail', type: 'email', label: 'Email', required: true },
  { id: 'age', type: 'number', label: 'Age', required: false },
  { id: 'bday', type: 'date', label: 'Birthday', required: false },
  { id: 'stars', type: 'rating', label: 'Rating', required: true, maxRating: 5 },
  { id: 'color', type: 'single_choice', label: 'Color', required: true, options: ['red', 'blue'] },
  { id: 'toppings', type: 'multi_select', label: 'Toppings', required: false, options: ['a', 'b'] },
  { id: 'country', type: 'dropdown', label: 'Country', required: false, options: ['FR', 'US'] }
];

const validSubmission = {
  name: 'Ada',
  mail: 'ada@example.com',
  stars: 5,
  color: 'red'
};

describe('validateQuestions', () => {
  it('accepts a valid set', () => {
    const r = validateQuestions(base);
    expect(r.ok).toBe(true);
  });

  it('rejects duplicate ids', () => {
    const r = validateQuestions([base[0], { ...base[0] }]);
    expect(r.ok).toBe(false);
  });

  it('rejects choice questions without options', () => {
    const r = validateQuestions([{ id: 'c', type: 'single_choice', label: 'C', required: false }]);
    expect(r.ok).toBe(false);
  });

  it('rejects invalid type', () => {
    const r = validateQuestions([{ id: 'x', type: 'matrix', label: 'X', required: false }]);
    expect(r.ok).toBe(false);
  });
});

describe('validateAnswers', () => {
  it('accepts a valid submission and nulls skipped optionals', () => {
    const r = validateAnswers(base, validSubmission);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.answers.name).toBe('Ada');
      expect(r.answers.bio).toBeNull();
    }
  });

  it('rejects when a required question is missing', () => {
    const r = validateAnswers(base, { mail: 'a@b.com', stars: 4, color: 'red' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('Name');
  });

  it('rejects bad email', () => {
    const r = validateAnswers(base, { ...validSubmission, mail: 'nope' });
    expect(r.ok).toBe(false);
  });

  it('rejects non-numeric number', () => {
    const r = validateAnswers(base, { ...validSubmission, age: 'abc' });
    expect(r.ok).toBe(false);
  });

  it('coerces numeric string for number type', () => {
    const r = validateAnswers(base, { ...validSubmission, age: '42' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.answers.age).toBe(42);
  });

  it('rejects rating outside 1..max', () => {
    expect(validateAnswers(base, { ...validSubmission, stars: 0 }).ok).toBe(false);
    expect(validateAnswers(base, { ...validSubmission, stars: 6 }).ok).toBe(false);
  });

  it('rejects invalid single choice', () => {
    const r = validateAnswers(base, { ...validSubmission, color: 'green' });
    expect(r.ok).toBe(false);
  });

  it('rejects invalid multi_select values and dedupes valid ones', () => {
    expect(validateAnswers(base, { ...validSubmission, toppings: ['a', 'zzz'] }).ok).toBe(false);
    const r = validateAnswers(base, { ...validSubmission, toppings: ['a', 'a', 'b'] });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.answers.toppings).toEqual(['a', 'b']);
  });

  it('rejects invalid dropdown value', () => {
    expect(validateAnswers(base, { ...validSubmission, country: 'XX' }).ok).toBe(false);
  });

  it('rejects malformed date', () => {
    expect(validateAnswers(base, { ...validSubmission, bday: '19/02/1809' }).ok).toBe(false);
    expect(validateAnswers(base, { ...validSubmission, bday: '1809-02-12' }).ok).toBe(true);
  });
});

describe('snapshotQuestions', () => {
  it('strips everything but id/label/type', () => {
    const snap = snapshotQuestions(base);
    expect(snap[0]).toEqual({ id: 'name', label: 'Name', type: 'short_text' });
    expect(snap).toHaveLength(base.length);
  });
});
