#!/usr/bin/env node
const fs = require('fs');
const readline = require('readline');
const { Pool } = require('pg');

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

// Map CSV column headers to DB column names
const CSV_TO_DB = {
  'Title Number':                  'title_number',
  'Tenure':                        'tenure',
  'Property Address':              'property_address',
  'Postcode':                      'postcode',
  'Proprietor Name (1)':           'proprietor_name',
  'Company Registration No. (1)':  'company_number',
  'Date Proprietor Added':         'date_added',
  'Proprietorship Category (1)':   'proprietorship_cat',
};

async function main() {
  const client = await pool.connect();
  console.log('Connected to database.');

  try {
    await client.query('BEGIN');

    // Read first line to get CSV headers
    const firstLine = await new Promise((resolve) => {
      const rl = readline.createInterface({ input: fs.createReadStream(CCOD_FILE, { encoding: 'utf8' }) });
      rl.once('line', (line) => { rl.close(); resolve(line); });
    });

    const csvHeaders = parseCSVLine(firstLine).map(h => h.trim());
    console.log('CSV headers:', csvHeaders);

    // Build column mapping: index in CSV -> db column name
    const colMap = [];
    for (let i = 0; i < csvHeaders.length; i++) {
      const dbCol = CSV_TO_DB[csvHeaders[i]];
      if (dbCol) colMap.push({ csvIndex: i, dbCol });
    }
    console.log('Mapped columns:', colMap.map(c => c.dbCol));

    const dbCols = colMap.map(c => c.dbCol);
    const colIndices = colMap.map(c => c.csvIndex);

    console.log('Truncating production table...');
    await client.query('TRUNCATE TABLE ccod_properties');

    let rowCount = 0;
    let batch = [];
    const BATCH_SIZE = 1000;

    const flushBatch = async () => {
      if (batch.length === 0) return;
      const placeholders = batch.map((_, bi) =>
        `(${dbCols.map((_, ci) => `$${bi * dbCols.length + ci + 1}`).join(',')})`
      ).join(',');
      const values = batch.flat();
      await client.query(
        `INSERT INTO ccod_properties (${dbCols.join(',')}) VALUES ${placeholders}`,
        values
      );
      rowCount += batch.length;
      batch = [];
      if (rowCount % 100000 === 0) console.log(`Inserted ${rowCount} rows...`);
    };

    await new Promise((resolve, reject) => {
      const rl = readline.createInterface({ input: fs.createReadStream(CCOD_FILE, { encoding: 'utf8' }) });
      let isFirstLine = true;

      rl.on('line', async (line) => {
        if (isFirstLine) { isFirstLine = false; return; }
        if (!line.trim()) return;

        const fields = parseCSVLine(line);
        const row = colIndices.map(i => fields[i] || null);
        batch.push(row);

        if (batch.length >= BATCH_SIZE) {
          rl.pause();
          try {
            await flushBatch();
          } catch (e) {
            rl.close();
            reject(e);
            return;
          }
          rl.resume();
        }
      });

      rl.on('close', async () => {
        try {
          await flushBatch();
          resolve();
        } catch (e) {
          reject(e);
        }
      });

      rl.on('error', reject);
    });

    console.log(`Total rows inserted: ${rowCount}`);
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

function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      fields.push(current || null);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current || null);
  return fields;
}

main();
