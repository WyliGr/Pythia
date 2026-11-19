import { fail } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { apiKeys, users } from '$lib/server/db/schema';
import { createApiKey, SCOPES, type Scope } from '$lib/server/apikeys';
import type { Actions, PageServerLoad } from './$types';
import { t } from '$lib/i18n';

export const load: PageServerLoad = async ({ locals }) => {
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
  return { keys, scopes: SCOPES };
};

export const actions: Actions = {
  saveProfile: async ({ request, locals }) => {
    const data = await request.formData();
    const name = String(data.get('name') ?? '').trim().slice(0, 120);
    const accentColor = String(data.get('accentColor') ?? '').trim();
    const logoUrl = String(data.get('logoUrl') ?? '').trim() || null;
    if (accentColor && !/^#[0-9a-fA-F]{6}$/.test(accentColor)) {
      return fail(400, { error: 'Accent color must be a hex color like #3d63dd', profile: true });
    }
    await db
      .update(users)
      .set({ name, accentColor: accentColor || null, logoUrl })
      .where(eq(users.id, locals.user!.id));
    return { savedProfile: true };
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
  }
};
