#!/usr/bin/env node
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
});

const INDEXES = [
  {
    name: 'idx_ccod_proprietor_name',
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ccod_proprietor_name
          ON ccod_properties (proprietor_name)`,
  },
  {
    name: 'idx_ccod_title_number',
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ccod_title_number
          ON ccod_properties (title_number)`,
  },
  {
    name: 'idx_ccod_postcode',
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ccod_postcode
          ON ccod_properties (postcode)`,
  },
  {
    name: 'idx_ccod_proprietor_trgm',
    sql: `CREATE EXTENSION IF NOT EXISTS pg_trgm;
          CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ccod_proprietor_trgm
          ON ccod_properties USING gin (proprietor_name gin_trgm_ops)`,
  },
];

async function main() {
  const client = await pool.connect();
  console.log('Rebuilding indexes...');

  try {
    for (const idx of INDEXES) {
      console.log(`  Building ${idx.name}...`);
      const start = Date.now();
      for (const stmt of idx.sql.trim().split(';').map(s => s.trim()).filter(Boolean)) {
        await client.query(stmt);
      }
      console.log(`  Done (${Date.now() - start}ms)`);
    }

    console.log('Running ANALYZE...');
    await client.query('ANALYZE ccod_properties');
    console.log('Indexes rebuilt successfully.');
  } catch (err) {
    console.error('Index rebuild failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();