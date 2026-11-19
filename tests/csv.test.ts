import { describe, expect, it } from 'vitest';
import { responsesToCsv, responsesToJson } from '../src/lib/server/csv';
import type { FormResponse } from '../src/lib/server/db/schema';

function row(partial: Partial<FormResponse>): FormResponse {
  return {
    id: 'r1',
    formId: 'f1',
    answers: {},
    snapshot: [],
    submittedAt: new Date('2026-01-01T10:00:00Z'),
    ...partial
  };
}

describe('responsesToCsv', () => {
  it('writes headers from snapshot with csv escaping', () => {
    const csv = responsesToCsv([
      row({
        snapshot: [
          { id: 'q1', label: 'Your name', type: 'short_text' },
          { id: 'q2', label: 'Quote, please', type: 'short_text' }
        ],
        answers: { q1: 'Ada', q2: 'she said "hi"' }
      })
    ]);
    const [header, line] = csv.split('\n');
    expect(header).toBe('submitted_at,Your name,"Quote, please"');
    expect(line).toContain('Ada');
    expect(line).toContain('"she said ""hi"""');
  });

  it('keeps columns stable when questions changed between submissions', () => {
    const csv = responsesToCsv([
      row({
        id: 'r1',
        snapshot: [{ id: 'q1', label: 'Old label', type: 'short_text' }],
        answers: { q1: 'first' }
      }),
      row({
        id: 'r2',
        snapshot: [
          { id: 'q1', label: 'New label', type: 'short_text' },
          { id: 'q2', label: 'Added later', type: 'short_text' }
        ],
        answers: { q1: 'second', q2: 'extra' },
        submittedAt: new Date('2026-01-02T10:00:00Z')
      })
    ]);
    const lines = csv.split('\n');
    // First-seen label wins, and the later column is appended.
    expect(lines[0]).toBe('submitted_at,Old label,Added later');
    expect(lines[1]).toMatch(/first,$/);
    expect(lines[2]).toMatch(/second,extra$/);
  });

  it('serializes arrays with semicolons', () => {
    const csv = responsesToCsv([
      row({ snapshot: [{ id: 'q1', label: 'Toppings', type: 'multi_select' }], answers: { q1: ['a', 'b'] } })
    ]);
    expect(csv.split('\n')[1]).toContain('a; b');
  });
});

describe('responsesToJson', () => {
  it('emits parseable JSON with id, submittedAt, answers', () => {
    const parsed = JSON.parse(responsesToJson([row({ answers: { q1: 'x' } })]));
    expect(parsed[0].id).toBe('r1');
    expect(parsed[0].answers.q1).toBe('x');
    expect(parsed[0].submittedAt).toBe('2026-01-01T10:00:00.000Z');
  });
});
