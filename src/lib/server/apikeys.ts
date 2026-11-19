import { createHash, randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { apiKeys, type ApiKey } from './db/schema';

export const SCOPES = ['forms:read', 'forms:write', 'responses:read'] as const;
export type Scope = (typeof SCOPES)[number];

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/** Returns the plaintext key once; only the hash is stored. */
export async function createApiKey(
  userId: string,
  name: string,
  scopes: Scope[]
): Promise<{ key: string; apiKey: ApiKey }> {
  const key = `pk_${randomBytes(24).toString('hex')}`;
  const [apiKey] = await db
    .insert(apiKeys)
    .values({ userId, name, scopes, prefix: key.slice(0, 11), keyHash: hashKey(key) })
    .returning();
  return { key, apiKey };
}

export async function resolveApiKey(header: string | null): Promise<ApiKey | null> {
  if (!header?.startsWith('Bearer pk_')) return null;
  const key = header.slice('Bearer '.length);
  const rows = await db.select().from(apiKeys).where(eq(apiKeys.keyHash, hashKey(key))).limit(1);
  const row = rows[0] ?? null;
  if (row) {
    db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, row.id)).execute().catch(() => {});
  }
  return row;
}

export function hasScope(key: ApiKey, scope: Scope): boolean {
  return key.scopes.includes(scope);
}
