import { json, type RequestHandler } from '@sveltejs/kit';
import { openApiSpec } from '$lib/openapi';

export const GET: RequestHandler = async () => json(openApiSpec);
