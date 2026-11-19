import { json, type RequestHandler } from '@sveltejs/kit';
import { requireApiKey, apiError } from '$lib/server/api';
import { createForm, listForms } from '$lib/server/forms';

export const GET: RequestHandler = async ({ locals }) => {
  const key = requireApiKey(locals.apiKey, 'forms:read');
  const forms = await listForms(key.userId);
  return json({ forms });
};

export const POST: RequestHandler = async ({ request, locals }) => {
  const key = requireApiKey(locals.apiKey, 'forms:write');
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return apiError('JSON body required');
  const result = await createForm(key.userId, body);
  if (!result.ok) return apiError(result.error, result.error === 'slug already in use' ? 409 : 400);
  return json({ form: result.form }, { status: 201 });
};
