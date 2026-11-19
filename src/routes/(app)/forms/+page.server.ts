import { fail, redirect } from '@sveltejs/kit';
import { and, count, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { forms, responses } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';
import { t } from '$lib/i18n';

export const load: PageServerLoad = async ({ locals }) => {
  const rows = await db
    .select({
      id: forms.id,
      title: forms.title,
      slug: forms.slug,
      open: forms.open,
      closeDate: forms.closeDate,
      updatedAt: forms.updatedAt,
      responseCount: count(responses.id)
    })
    .from(forms)
    .leftJoin(responses, eq(responses.formId, forms.id))
    .where(eq(forms.userId, locals.user!.id))
    .groupBy(forms.id)
    .orderBy(desc(forms.updatedAt));
  return { forms: rows, publicUrl: process.env.PUBLIC_URL ?? '' };
};

export const actions: Actions = {
  create: async ({ locals }) => {
    const slug = `form-${Math.random().toString(36).slice(2, 8)}`;
    const [form] = await db
      .insert(forms)
      .values({ userId: locals.user!.id, title: 'Untitled form', slug, questions: [] })
      .returning();
    redirect(303, `/forms/${form.id}/edit`);
  },
  delete: async ({ request, locals }) => {
    const data = await request.formData();
    const id = String(data.get('id') ?? '');
    const [form] = await db
      .select({ userId: forms.userId })
      .from(forms)
      .where(eq(forms.id, id))
      .limit(1);
    if (!form || form.userId !== locals.user!.id) return fail(403, { error: t.errors.forbidden });
    await db.delete(forms).where(and(eq(forms.id, id), eq(forms.userId, locals.user!.id)));
    return {};
  }
};
