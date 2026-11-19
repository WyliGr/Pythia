import { error, json } from '@sveltejs/kit';
import { hasScope, type Scope } from './apikeys';
import type { ApiKey } from './db/schema';

/** Guard for /api/v1 and /mcp. Throws SvelteKit errors as JSON-ish responses. */
export function requireApiKey(apiKey: ApiKey | null, scope: Scope): ApiKey {
  if (!apiKey) error(401, { message: 'Missing or invalid API key. Use `Authorization: Bearer pk_…`.' });
  if (!hasScope(apiKey, scope)) error(403, { message: `Key lacks required scope: ${scope}` });
  return apiKey;
}

export function apiError(message: string, status = 400) {
  return json({ error: message }, { status });
}
