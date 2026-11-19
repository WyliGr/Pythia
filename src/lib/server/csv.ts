import type { FormResponse } from './db/schema';

function csvCell(value: unknown): string {
  let s: string;
  if (value === null || value === undefined) s = '';
  else if (Array.isArray(value)) s = value.join('; ');
  else s = String(value);
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function responsesToCsv(rows: FormResponse[]): string {
  // Union of snapshot columns, first-seen order — stable even if questions were edited.
  const columns = new Map<string, string>();
  for (const r of rows) {
    for (const snap of r.snapshot) {
      if (!columns.has(snap.id)) columns.set(snap.id, snap.label);
    }
  }
  const header = ['submitted_at', ...columns.values()].map(csvCell).join(',');
  const lines = rows.map((r) =>
    [r.submittedAt.toISOString(), ...[...columns.keys()].map((id) => r.answers[id])].map(csvCell).join(',')
  );
  return [header, ...lines].join('\n');
}

export function responsesToJson(rows: FormResponse[]): string {
  return JSON.stringify(
    rows.map((r) => ({
      id: r.id,
      submittedAt: r.submittedAt.toISOString(),
      answers: r.answers
    })),
    null,
    2
  );
}
