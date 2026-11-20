import { error, fail, redirect } from '@sveltejs/kit';
import { and, asc, count, desc, eq, ne, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { apiKeys, forms, responses, settings, users } from '$lib/server/db/schema';
import { createApiKey, SCOPES, type Scope } from '$lib/server/apikeys';
import { saveAvatar, removeAvatarFiles } from '$lib/server/uploads';
import type { Actions, PageServerLoad } from './$types';
import { t } from '$lib/i18n';

function requireAdmin(locals: App.Locals) {
  if (!locals.user?.isAdmin) error(403, t.errors.forbidden);
}

async function loadAdminData() {
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
}

export const load: PageServerLoad = async ({ locals, url }) => {
  const keys = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      prefix: apiKeys.prefix,
      scopes: apiKeys.scopes,
      createdAt: apiKeys.createdAt,
      lastUsedAt: apiKeys.lastUsedAt
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, locals.user!.id))
    .orderBy(desc(apiKeys.createdAt));
  const admin = locals.user!.isAdmin ? await loadAdminData() : null;
  const publicUrl = (process.env.PUBLIC_URL ?? url.origin).replace(/\/$/, '');
  return { keys, scopes: SCOPES, admin, publicUrl };
};

export const actions: Actions = {
  saveProfile: async ({ request, locals }) => {
    const data = await request.formData();
    const name = String(data.get('name') ?? '').trim().slice(0, 120);
    await db.update(users).set({ name }).where(eq(users.id, locals.user!.id));
    return { savedProfile: true };
  },
  uploadAvatar: async ({ request, locals }) => {
    const data = await request.formData();
    const file = data.get('avatar');
    if (!(file instanceof File) || file.size === 0) {
      return fail(400, { error: t.settings.avatarType, avatar: true });
    }
    const saved = await saveAvatar(locals.user!.id, file);
    if (!saved.ok) return fail(400, { error: t.settings[saved.error], avatar: true });
    await db.update(users).set({ avatarUrl: saved.url }).where(eq(users.id, locals.user!.id));
    return { savedAvatar: true };
  },
  removeAvatar: async ({ locals }) => {
    await removeAvatarFiles(locals.user!.id);
    await db.update(users).set({ avatarUrl: null }).where(eq(users.id, locals.user!.id));
    return { removedAvatar: true };
  },
  createKey: async ({ request, locals }) => {
    const data = await request.formData();
    const name = String(data.get('keyName') ?? '').trim().slice(0, 120);
    const scopes = data.getAll('scopes').map(String) as Scope[];
    if (!name) return fail(400, { error: t.settings.keyName, key: true });
    if (scopes.length === 0 || scopes.some((s) => !SCOPES.includes(s))) {
      return fail(400, { error: t.settings.keyScopes, key: true });
    }
    const { key } = await createApiKey(locals.user!.id, name, scopes);
    return { newKey: key };
  },
  revokeKey: async ({ request, locals }) => {
    const data = await request.formData();
    const id = String(data.get('id') ?? '');
    await db.delete(apiKeys).where(and(eq(apiKeys.id, id), eq(apiKeys.userId, locals.user!.id)));
    return {};
  },
  deleteAccount: async ({ locals, cookies }) => {
    // RGPD "delete everything": cascades remove sessions, API keys, forms, responses.
    await db.delete(users).where(eq(users.id, locals.user!.id));
    cookies.delete('pythia_session', { path: '/' });
    redirect(303, '/login');
  },

  // ---- Admin actions ----
  saveDefaults: async ({ request, locals }) => {
    requireAdmin(locals);
    const data = await request.formData();
    const accent = String(data.get('defaultAccentColor') ?? '').trim();
    const logo = String(data.get('defaultLogoUrl') ?? '').trim() || null;
    if (!/^#[0-9a-fA-F]{6}$/.test(accent)) return fail(400, { error: t.settings.accentColor, admin: true });
    await db.update(settings).set({ defaultAccentColor: accent, defaultLogoUrl: logo }).where(eq(settings.id, 1));
    return { savedDefaults: true };
  },
  toggleAdmin: async ({ request, locals }) => {
    requireAdmin(locals);
    const data = await request.formData();
    const id = String(data.get('id') ?? '');
    if (id === locals.user!.id) return fail(400, { error: 'You cannot change your own admin role.', admin: true });
    const [target] = await db.select({ isAdmin: users.isAdmin }).from(users).where(eq(users.id, id)).limit(1);
    if (!target) return fail(404, { error: t.errors.notFound, admin: true });
    await db.update(users).set({ isAdmin: !target.isAdmin }).where(eq(users.id, id));
    return {};
  },
  deleteUser: async ({ request, locals }) => {
    requireAdmin(locals);
    const data = await request.formData();
    const id = String(data.get('id') ?? '');
    if (id === locals.user!.id) return fail(400, { error: 'You cannot delete your own account here.', admin: true });
    await db.delete(users).where(and(eq(users.id, id), ne(users.id, locals.user!.id)));
    return {};
  }
};
