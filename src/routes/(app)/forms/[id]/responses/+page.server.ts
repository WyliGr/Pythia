import { error } from '@sveltejs/kit';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { forms, responses } from '$lib/server/db/schema';
import type { QuestionSnapshot } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';
import { t } from '$lib/i18n';

export const load: PageServerLoad = async ({ params, locals }) => {
  const [form] = await db
    .select({ id: forms.id, title: forms.title })
    .from(forms)
    .where(and(eq(forms.id, params.id), eq(forms.userId, locals.user!.id)))
    .limit(1);
  if (!form) error(404, t.errors.notFound);

  const rows = await db
    .select()
    .from(responses)
    .where(eq(responses.formId, form.id))
    .orderBy(asc(responses.submittedAt));

  // Union of all snapshot columns across responses.
  const columns = new Map<string, QuestionSnapshot>();
  for (const r of rows) {
    for (const snap of r.snapshot) if (!columns.has(snap.id)) columns.set(snap.id, snap);
  }

  return {
    form,
    columns: [...columns.values()],
    rows: rows.map((r) => ({ id: r.id, submittedAt: r.submittedAt, answers: r.answers }))
  };
};
