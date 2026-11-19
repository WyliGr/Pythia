import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../src/lib/server/auth';
import { hasScope, SCOPES } from '../src/lib/server/apikeys';

describe('password hashing', () => {
  it('roundtrips and rejects wrong passwords', async () => {
    const hash = await hashPassword('correct horse battery staple');
    expect(await verifyPassword('correct horse battery staple', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('rejects malformed stored hashes', async () => {
    expect(await verifyPassword('x', 'garbage')).toBe(false);
  });
});

describe('scopes', () => {
  it('recognizes the three supported scopes', () => {
    expect(SCOPES).toEqual(['forms:read', 'forms:write', 'responses:read']);
  });

  it('hasScope matches stored scopes exactly', () => {
    const key = { scopes: ['responses:read'] } as never;
    expect(hasScope(key, 'responses:read')).toBe(true);
    expect(hasScope(key, 'forms:write')).toBe(false);
  });
});
