import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { createSession, verifyPassword } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';
import { t } from '$lib/i18n';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) redirect(303, '/forms');
  return {};
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const email = String(data.get('email') ?? '').trim().toLowerCase();
    const password = String(data.get('password') ?? '');
    if (!email || !password) return fail(400, { error: t.auth.invalidCredentials, email });

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return fail(400, { error: t.auth.invalidCredentials, email });
    }
    const token = await createSession(user.id);
    cookies.set('pythia_session', token, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 });
    redirect(303, '/forms');
  }
};
