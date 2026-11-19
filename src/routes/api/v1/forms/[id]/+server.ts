import { json, type RequestHandler } from '@sveltejs/kit';
import { requireApiKey, apiError } from '$lib/server/api';
import { getOwnedForm, updateForm } from '$lib/server/forms';

export const GET: RequestHandler = async ({ params, locals }) => {
  const key = requireApiKey(locals.apiKey, 'forms:read');
  const form = await getOwnedForm(key.userId, params.id);
  if (!form) return apiError('not_found', 404);
  return json({ form });
};

export const PATCH: RequestHandler = async ({ request, params, locals }) => {
  const key = requireApiKey(locals.apiKey, 'forms:write');
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return apiError('JSON body required');
  const result = await updateForm(key.userId, params.id, body);
  if (!result.ok) return apiError(result.error, result.error === 'not_found' ? 404 : result.error === 'slug already in use' ? 409 : 400);
  return json({ form: result.form });
};
