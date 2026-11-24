// Applies database/migrations/*.sql in order, once each. Safe to run on every start.
// Usage: DATABASE_URL=... node scripts/migrate.js
const fs = require('fs'); const path = require('path'); const { Client } = require('pg');
const dir = path.resolve(__dirname, '../../database/migrations');

(async () => {
  if (!process.env.DATABASE_URL) { console.error('DATABASE_URL is not set'); process.exit(1); }
  const ssl = process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false;
  const db = new Client({ connectionString: process.env.DATABASE_URL, ssl });
  await db.connect();
  await db.query('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
  // A lock keeps two instances starting at once from racing.
  await db.query('SELECT pg_advisory_lock(727274)');
  try {
    const done = new Set((await db.query('SELECT name FROM schema_migrations')).rows.map(r => r.name));
    const files = fs.readdirSync(dir).filter(f => /^\d+_.*\.sql$/.test(f)).sort();
    // The database may predate this runner (created from run_all.sql). If parents exists and nothing is recorded, adopt it.
    if (!done.size && (await db.query("SELECT to_regclass('public.parents') AS t")).rows[0].t) {
      for (const f of files) await db.query('INSERT INTO schema_migrations(name) VALUES ($1) ON CONFLICT DO NOTHING', [f]);
      console.log('Existing schema found: marked', files.length, 'migrations as applied.'); return;
    }
    for (const f of files) {
      if (done.has(f)) continue;
      process.stdout.write(`Applying ${f} ... `);
      try { await db.query(fs.readFileSync(path.join(dir, f), 'utf8')); await db.query('INSERT INTO schema_migrations(name) VALUES ($1)', [f]); console.log('ok'); }
      catch (e) { await db.query('ROLLBACK').catch(() => {}); console.log('FAILED'); throw e; }
    }
    console.log('Database is up to date.');
  } finally { await db.query('SELECT pg_advisory_unlock(727274)').catch(() => {}); await db.end(); }
})().catch(e => { console.error(e.message); process.exit(1); });
