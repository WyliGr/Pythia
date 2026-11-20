import { describe, expect, it } from 'vitest';
import { AVATAR_MAX_BYTES, readAvatarFile, validateAvatar } from '../src/lib/server/uploads';

describe('validateAvatar', () => {
  it('accepts png/jpeg/webp within the size cap', () => {
    expect(validateAvatar({ type: 'image/png', size: 1000 })).toBeNull();
    expect(validateAvatar({ type: 'image/jpeg', size: AVATAR_MAX_BYTES })).toBeNull();
    expect(validateAvatar({ type: 'image/webp', size: 42 })).toBeNull();
  });

  it('rejects unsupported mime types', () => {
    expect(validateAvatar({ type: 'image/gif', size: 1000 })).toBe('avatarType');
    expect(validateAvatar({ type: 'image/svg+xml', size: 1000 })).toBe('avatarType');
    expect(validateAvatar({ type: '', size: 1000 })).toBe('avatarType');
  });

  it('rejects empty or oversized files', () => {
    expect(validateAvatar({ type: 'image/png', size: 0 })).toBe('avatarSize');
    expect(validateAvatar({ type: 'image/png', size: AVATAR_MAX_BYTES + 1 })).toBe('avatarSize');
  });
});

describe('readAvatarFile', () => {
  it('rejects traversal and odd characters', async () => {
    expect(await readAvatarFile('../secrets.txt')).toBeNull();
    expect(await readAvatarFile('../avatars/x.png')).toBeNull();
    expect(await readAvatarFile('a/b.png')).toBeNull();
    expect(await readAvatarFile('a.png?x=1')).toBeNull();
    expect(await readAvatarFile('')).toBeNull();
  });

  it('rejects non-image extensions', async () => {
    expect(await readAvatarFile('abc123-def.html')).toBeNull();
    expect(await readAvatarFile('abc123-def.gif')).toBeNull();
  });

  it('returns null for a well-formed name that does not exist on disk', async () => {
    expect(await readAvatarFile('01234567-89ab-cdef-0123-456789abcdef-abcdef12.png')).toBeNull();
  });
});
