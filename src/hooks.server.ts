import type { Handle } from '@sveltejs/kit';
import { getSessionUser } from '$lib/server/auth';
import { resolveApiKey } from '$lib/server/apikeys';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.user = await getSessionUser(event.cookies.get('pythia_session'));
  event.locals.apiKey = event.url.pathname.startsWith('/api/') || event.url.pathname.startsWith('/mcp')
    ? await resolveApiKey(event.request.headers.get('authorization'))
    : null;
  return resolve(event);
};
