#!/usr/bin/env node
const fs = require('fs');
const { Pool } = require('pg');
const { from: copyFrom } = require('pg-copy-streams');
const { pipeline } = require('stream/promises');

const CCOD_FILE = process.argv[2];
if (!CCOD_FILE || !fs.existsSync(CCOD_FILE)) {
  console.error('Usage: node scripts/import-ccod.js <path-to-ccod.csv>');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
});

async function main() {
  const client = await pool.connect();
  console.log('Connected to database.');

  try {
    await client.query('BEGIN');

    console.log('Creating staging table...');
    await client.query(`
      CREATE TEMP TABLE ccod_staging (LIKE ccod_properties INCLUDING ALL) ON COMMIT DROP;
    `);

    console.log(`Streaming ${CCOD_FILE} into staging table...`);
    const copyStream = client.query(
      copyFrom(`
        COPY ccod_staging FROM STDIN
        WITH (FORMAT csv, HEADER true, QUOTE '"', ESCAPE '"')
      `)
    );

    const fileStream = fs.createReadStream(CCOD_FILE, { encoding: 'utf8' });
    await pipeline(fileStream, copyStream);

    const stagingCount = await client.query('SELECT COUNT(*) FROM ccod_staging');
    console.log(`Staging rows loaded: ${stagingCount.rows[0].count}`);

    console.log('Swapping production table...');
    await client.query('TRUNCATE TABLE ccod_properties');
    await client.query(`INSERT INTO ccod_properties SELECT * FROM ccod_staging`);

    const finalCount = await client.query('SELECT COUNT(*) FROM ccod_properties');
    console.log(`Production rows after swap: ${finalCount.rows[0].count}`);

    await client.query('COMMIT');
    console.log('Import committed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Import failed, rolled back:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();