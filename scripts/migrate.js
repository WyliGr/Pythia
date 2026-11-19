/**
 * Run Drizzle migrations at container start, then hand off to the app.
 * Usage: node scripts/migrate.js && node build
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const url = process.env.DATABASE_URL ?? 'postgres://pythia:pythia@db:5432/pythia';

const attempts = 30;
for (let i = 1; i <= attempts; i++) {
  try {
    const client = postgres(url, { max: 1 });
    const db = drizzle(client);
    await migrate(db, { migrationsFolder: 'drizzle' });

    // Ensure the single settings row exists.
    await client`insert into settings (id) values (1) on conflict (id) do nothing`;

    await client.end();
    console.log('Migrations applied.');
    process.exit(0);
  } catch (err) {
    if (i === attempts) {
      console.error('Migration failed after retries:', err.message);
      process.exit(1);
    }
    console.log(`DB not ready (${i}/${attempts}), retrying…`);
    await new Promise((r) => setTimeout(r, 1000));
  }
}
