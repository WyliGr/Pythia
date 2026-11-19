import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

export const connectionString =
  env.DATABASE_URL ?? 'postgres://pythia:pythia@localhost:5432/pythia';

const client = postgres(connectionString, { max: 10 });
export const db = drizzle(client, { schema });
