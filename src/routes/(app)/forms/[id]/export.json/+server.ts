import { error, type RequestHandler } from '@sveltejs/kit';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { forms, responses } from '$lib/server/db/schema';
import { responsesToJson } from '$lib/server/csv';
import { t } from '$lib/i18n';

export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) error(401, t.errors.unauthorized);
  const [form] = await db
    .select({ id: forms.id, slug: forms.slug })
    .from(forms)
    .where(and(eq(forms.id, params.id), eq(forms.userId, locals.user.id)))
    .limit(1);
  if (!form) error(404, t.errors.notFound);
  const rows = await db.select().from(responses).where(eq(responses.formId, form.id)).orderBy(asc(responses.submittedAt));
  return new Response(responsesToJson(rows), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="${form.slug}-responses.json"`
    }
  });
};
