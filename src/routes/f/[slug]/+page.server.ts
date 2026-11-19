import { error, fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { forms, users } from '$lib/server/db/schema';
import { isFormOpen, submitResponse } from '$lib/server/submit';
import type { Actions, PageServerLoad } from './$types';
import { t } from '$lib/i18n';

export const load: PageServerLoad = async ({ params }) => {
  const [row] = await db
    .select({ form: forms, owner: { accentColor: users.accentColor, logoUrl: users.logoUrl } })
    .from(forms)
    .innerJoin(users, eq(users.id, forms.userId))
    .where(eq(forms.slug, params.slug))
    .limit(1);
  if (!row) error(404, t.publicForm.notFound);
  return {
    form: {
      id: row.form.id,
      title: row.form.title,
      description: row.form.description,
      questions: row.form.questions,
      open: isFormOpen(row.form)
    },
    owner: row.owner
  };
};

export const actions: Actions = {
  default: async ({ request, params }) => {
    const [form] = await db.select().from(forms).where(eq(forms.slug, params.slug)).limit(1);
    if (!form) error(404, t.publicForm.notFound);

    const data = await request.formData();
    const raw: Record<string, unknown> = {};
    for (const q of form.questions) {
      raw[q.id] = q.type === 'multi_select' ? data.getAll(q.id) : data.get(q.id);
    }
    const result = await submitResponse(form, raw);
    if (!result.ok) {
      if (result.error === 'closed') error(403, t.publicForm.closed);
      return fail(400, {
        error: result.error,
        values: Object.fromEntries([...data.entries()].filter(([k]) => !k.startsWith('$')))
      });
    }
    return { submitted: true };
  }
};
