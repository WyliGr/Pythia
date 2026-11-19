import { json, type RequestHandler } from '@sveltejs/kit';
import { requireApiKey, apiError } from '$lib/server/api';
import { getFormResponses } from '$lib/server/forms';

export const GET: RequestHandler = async ({ params, locals }) => {
  const key = requireApiKey(locals.apiKey, 'responses:read');
  const rows = await getFormResponses(key.userId, params.id);
  if (!rows) return apiError('not_found', 404);
  return json({
    responses: rows.map((r) => ({ id: r.id, submittedAt: r.submittedAt, questions: r.snapshot, answers: r.answers }))
  });
};
