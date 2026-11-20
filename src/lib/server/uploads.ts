import { randomBytes } from 'node:crypto';
import { mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';

/**
 * Local file storage for user avatars.
 * Files live under UPLOADS_DIR/avatars and are served by /uploads/avatars/[file].
 * Access control = unguessable random file names (same model as public form slugs).
 */

export const UPLOADS_DIR = resolve(process.env.UPLOADS_DIR ?? './uploads');
export const AVATARS_DIR = join(UPLOADS_DIR, 'avatars');

const AVATAR_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp'
};
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export type AvatarError = 'avatarType' | 'avatarSize';

export function validateAvatar(file: { size: number; type: string }): AvatarError | null {
  if (!Object.hasOwn(AVATAR_TYPES, file.type)) return 'avatarType';
  if (file.size <= 0 || file.size > AVATAR_MAX_BYTES) return 'avatarSize';
  return null;
}

export async function saveAvatar(
  userId: string,
  file: File
): Promise<{ ok: true; url: string } | { ok: false; error: AvatarError }> {
  const invalid = validateAvatar(file);
  if (invalid) return { ok: false, error: invalid };
  await mkdir(AVATARS_DIR, { recursive: true });
  await removeAvatarFiles(userId);
  const name = `${userId}-${randomBytes(4).toString('hex')}.${AVATAR_TYPES[file.type]}`;
  await writeFile(join(AVATARS_DIR, name), Buffer.from(await file.arrayBuffer()));
  return { ok: true, url: `/uploads/avatars/${name}` };
}

export async function removeAvatarFiles(userId: string): Promise<void> {
  let entries: string[] = [];
  try {
    entries = await readdir(AVATARS_DIR);
  } catch {
    return;
  }
  await Promise.all(
    entries
      .filter((f) => f.startsWith(`${userId}-`))
      .map((f) => unlink(join(AVATARS_DIR, f)).catch(() => {}))
  );
}

const MIME: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };

/** Serve an avatar file, defending against path traversal. Returns null when unsafe/missing. */
export async function readAvatarFile(
  file: string
): Promise<{ body: Uint8Array; contentType: string } | null> {
  if (!/^[A-Za-z0-9-]{6,80}\.(png|jpg|webp)$/.test(file)) return null;
  const path = resolve(AVATARS_DIR, file);
  if (!path.startsWith(AVATARS_DIR + sep)) return null;
  try {
    const body = await readFile(path);
    return { body, contentType: MIME[extname(path).toLowerCase()] ?? 'application/octet-stream' };
  } catch {
    return null;
  }
}
