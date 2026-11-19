import { error, fail } from '@sveltejs/kit';
import { and, eq, ne } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { forms } from '$lib/server/db/schema';
import { validateQuestions } from '$lib/server/questions';
import type { Actions, PageServerLoad } from './$types';
import { t } from '$lib/i18n';

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/;

export const load: PageServerLoad = async ({ params, locals }) => {
  const [form] = await db
    .select()
    .from(forms)
    .where(and(eq(forms.id, params.id), eq(forms.userId, locals.user!.id)))
    .limit(1);
  if (!form) error(404, t.errors.notFound);
  return { form };
};

export const actions: Actions = {
  save: async ({ request, params, locals }) => {
    const [form] = await db
      .select()
      .from(forms)
      .where(and(eq(forms.id, params.id), eq(forms.userId, locals.user!.id)))
      .limit(1);
    if (!form) error(404, t.errors.notFound);

    const data = await request.formData();
    const title = String(data.get('title') ?? '').trim();
    const description = String(data.get('description') ?? '').trim();
    const slug = String(data.get('slug') ?? '').trim().toLowerCase();
    const open = data.get('open') === 'on';
    const closeDateRaw = String(data.get('closeDate') ?? '');
    const webhookUrl = String(data.get('webhookUrl') ?? '').trim() || null;
    const webhookSecret = String(data.get('webhookSecret') ?? '').trim() || null;

    let questionsJson: unknown;
    try {
      questionsJson = JSON.parse(String(data.get('questions') ?? '[]'));
    } catch {
      return fail(400, { error: 'Invalid questions payload' });
    }
    const q = validateQuestions(questionsJson);
    if (!q.ok) return fail(400, { error: q.error });

    if (!title) return fail(400, { error: t.builder.formTitle });
    if (!SLUG_RE.test(slug)) return fail(400, { error: t.builder.slugHint });
    if (webhookUrl && !/^https?:\/\//.test(webhookUrl)) return fail(400, { error: 'Webhook URL must be http(s)' });

    const clash = await db
      .select({ id: forms.id })
      .from(forms)
      .where(and(eq(forms.slug, slug), ne(forms.id, params.id)))
      .limit(1);
    if (clash.length > 0) return fail(400, { error: t.builder.slugTaken });

    await db
      .update(forms)
      .set({
        title,
        description,
        slug,
        open,
        closeDate: closeDateRaw ? new Date(closeDateRaw) : null,
        webhookUrl,
        webhookSecret,
        questions: q.questions,
        updatedAt: new Date()
      })
      .where(eq(forms.id, params.id));
    return { saved: true };
  }
};
