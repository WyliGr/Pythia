import { redirect, type RequestHandler } from '@sveltejs/kit';
import { deleteSession } from '$lib/server/auth';

export const POST: RequestHandler = async ({ cookies }) => {
  const token = cookies.get('pythia_session');
  if (token) await deleteSession(token);
  cookies.delete('pythia_session', { path: '/' });
  redirect(303, '/login');
};
