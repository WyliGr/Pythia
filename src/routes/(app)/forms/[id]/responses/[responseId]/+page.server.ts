import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { forms, responses } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';
import { t } from '$lib/i18n';

export const load: PageServerLoad = async ({ params, locals }) => {
  const [form] = await db
    .select({ id: forms.id, title: forms.title })
    .from(forms)
    .where(and(eq(forms.id, params.id), eq(forms.userId, locals.user!.id)))
    .limit(1);
  if (!form) error(404, t.errors.notFound);
  const [row] = await db
    .select()
    .from(responses)
    .where(and(eq(responses.id, params.responseId), eq(responses.formId, form.id)))
    .limit(1);
  if (!row) error(404, t.errors.notFound);
  return { form, response: row };
};
