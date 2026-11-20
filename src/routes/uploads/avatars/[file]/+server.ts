import { error, type RequestHandler } from '@sveltejs/kit';
import { readAvatarFile } from '$lib/server/uploads';

export const GET: RequestHandler = async ({ params }) => {
  const file = await readAvatarFile(params.file ?? '');
  if (!file) error(404, 'Not found');
  return new Response(file.body as BodyInit, {
    headers: {
      'content-type': file.contentType,
      'cache-control': 'public, max-age=86400'
    }
  });
};
