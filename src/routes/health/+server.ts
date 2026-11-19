import type { RequestHandler } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async () => {
  try {
    await db.execute(sql`select 1`);
    return new Response('ok', { status: 200 });
  } catch {
    return new Response('db unavailable', { status: 503 });
  }
};
