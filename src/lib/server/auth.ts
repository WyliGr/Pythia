import { randomBytes, scrypt, timingSafeEqual, randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { sessions, users, type User } from './db/schema';

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export type SessionUser = Pick<User, 'id' | 'email' | 'isAdmin' | 'name' | 'accentColor' | 'logoUrl' | 'avatarUrl'>;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 64, (err, key) => (err ? reject(err) : resolve(key)));
  });
  return `scrypt:${salt}:${hash.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, salt, hex] = stored.split(':');
  if (scheme !== 'scrypt' || !salt || !hex) return false;
  const expected = Buffer.from(hex, 'hex');
  const actual = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 64, (err, key) => (err ? reject(err) : resolve(key)));
  });
  return timingSafeEqual(expected, actual);
}

export async function createSession(userId: string): Promise<string> {
  const token = randomUUID() + randomUUID();
  await db.insert(sessions).values({
    token,
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS)
  });
  return token;
}

export async function getSessionUser(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      isAdmin: users.isAdmin,
      name: users.name,
      accentColor: users.accentColor,
      logoUrl: users.logoUrl,
      avatarUrl: users.avatarUrl,
      expiresAt: sessions.expiresAt
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.token, token))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) {
    await db.delete(sessions).where(eq(sessions.token, token));
    return null;
  }
  return row;
}

export async function deleteSession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.token, token));
}
