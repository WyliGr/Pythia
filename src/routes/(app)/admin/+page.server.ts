import { error, fail } from '@sveltejs/kit';
import { and, asc, count, eq, ne, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { forms, responses, settings, users } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';
import { t } from '$lib/i18n';

function requireAdmin(locals: App.Locals) {
  if (!locals.user?.isAdmin) error(403, t.errors.forbidden);
}

export const load: PageServerLoad = async ({ locals }) => {
  requireAdmin(locals);

  const userRows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      isAdmin: users.isAdmin,
      createdAt: users.createdAt,
      formsCount: count(forms.id)
    })
    .from(users)
    .leftJoin(forms, eq(forms.userId, users.id))
    .groupBy(users.id)
    .orderBy(asc(users.createdAt));

  const responseCounts = await db
    .select({ userId: forms.userId, value: count(responses.id) })
    .from(responses)
    .innerJoin(forms, eq(forms.id, responses.formId))
    .groupBy(forms.userId);
  const responseByUser = new Map(responseCounts.map((r) => [r.userId, r.value]));

  const [totals] = await db
    .select({
      users: sql<number>`(select count(*) from ${users})`,
      forms: sql<number>`(select count(*) from ${forms})`,
      responses: sql<number>`(select count(*) from ${responses})`
    })
    .from(users)
    .limit(1);

  const [s] = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);

  return {
    users: userRows.map((u) => ({ ...u, responsesCount: responseByUser.get(u.id) ?? 0 })),
    totals: { users: totals?.users ?? 0, forms: totals?.forms ?? 0, responses: totals?.responses ?? 0 },
    defaults: s
  };
};

export const actions: Actions = {
  saveDefaults: async ({ request, locals }) => {
    requireAdmin(locals);
    const data = await request.formData();
    const accent = String(data.get('defaultAccentColor') ?? '').trim();
    const logo = String(data.get('defaultLogoUrl') ?? '').trim() || null;
    if (!/^#[0-9a-fA-F]{6}$/.test(accent)) return fail(400, { error: t.settings.accentColor });
    await db.update(settings).set({ defaultAccentColor: accent, defaultLogoUrl: logo }).where(eq(settings.id, 1));
    return { savedDefaults: true };
  },
  toggleAdmin: async ({ request, locals }) => {
    requireAdmin(locals);
    const data = await request.formData();
    const id = String(data.get('id') ?? '');
    if (id === locals.user!.id) return fail(400, { error: 'You cannot change your own admin role.' });
    const [target] = await db.select({ isAdmin: users.isAdmin }).from(users).where(eq(users.id, id)).limit(1);
    if (!target) return fail(404, { error: t.errors.notFound });
    await db.update(users).set({ isAdmin: !target.isAdmin }).where(eq(users.id, id));
    return {};
  },
  deleteUser: async ({ request, locals }) => {
    requireAdmin(locals);
    const data = await request.formData();
    const id = String(data.get('id') ?? '');
    if (id === locals.user!.id) return fail(400, { error: 'You cannot delete your own account here.' });
    await db.delete(users).where(and(eq(users.id, id), ne(users.id, locals.user!.id)));
    return {};
  }
};
