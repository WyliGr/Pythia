import { fail, redirect } from '@sveltejs/kit';
import { count, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { settings, users } from '$lib/server/db/schema';
import { createSession, hashPassword } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';
import { t } from '$lib/i18n';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) redirect(303, '/forms');
  const [{ value }] = await db.select({ value: count() }).from(users);
  return { isFirst: value === 0 };
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const email = String(data.get('email') ?? '').trim().toLowerCase();
    const password = String(data.get('password') ?? '');
    const name = String(data.get('name') ?? '').trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return fail(400, { error: t.auth.invalidCredentials, email, name });
    }
    if (password.length < 8) {
      return fail(400, { error: t.auth.passwordTooShort, email, name });
    }

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) return fail(400, { error: t.auth.emailTaken, email, name });

    // First account on a fresh install becomes server admin.
    const [{ value: userCount }] = await db.select({ value: count() }).from(users);
    const isAdmin = userCount === 0;

    const [defaults] = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);

    const [user] = await db
      .insert(users)
      .values({
        email,
        name,
        passwordHash: await hashPassword(password),
        isAdmin,
        accentColor: defaults?.defaultAccentColor ?? '#3d63dd',
        logoUrl: defaults?.defaultLogoUrl ?? null
      })
      .returning();

    const token = await createSession(user.id);
    cookies.set('pythia_session', token, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 });
    redirect(303, '/forms');
  }
};
