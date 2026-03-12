#!/usr/bin/env node
const fs = require('fs');
const { Pool } = require('pg');
const { from: copyFrom } = require('pg-copy-streams');
const { Transform, pipeline } = require('stream');
const { promisify } = require('util');
const readline = require('readline');

const pipelineAsync = promisify(pipeline);
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

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function escapeCSV(val) {
  if (val === null || val === undefined || val === '') return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

async function main() {
  const client = await pool.connect();
  console.log('Connected to database.');

  try {
    await client.query('BEGIN');
    console.log('Truncating production table...');
    await client.query('TRUNCATE TABLE ccod_properties');

    // First pass: read header line only to get column indexes
    const headerLine = await new Promise((resolve, reject) => {
      const rs = fs.createReadStream(CCOD_FILE, { encoding: 'utf8' });
      const rl = readline.createInterface({ input: rs, crlfDelay: Infinity });
      rl.once('line', (line) => { resolve(line); rl.close(); rs.destroy(); });
      rl.once('error', reject);
    });

    const headers = parseCSVLine(headerLine);
    const idx = {
      title:    headers.findIndex(h => /title.number/i.test(h)),
      tenure:   headers.findIndex(h => /^tenure$/i.test(h)),
      address:  headers.findIndex(h => /property.address/i.test(h)),
      postcode: headers.findIndex(h => /^postcode$/i.test(h)),
      name:     headers.findIndex(h => /proprietor.name.*1/i.test(h)),
      company:  headers.findIndex(h => /company.reg|registration/i.test(h)),
      date:     headers.findIndex(h => /date.proprietor/i.test(h)),
      cat:      headers.findIndex(h => /proprietorship.cat.*1/i.test(h)),
    };
    console.log('CSV headers detected:', headers);
    console.log('Column mapping:', idx);

    // Output header for COPY
    const outHeader = 'title_number,tenure,property_address,postcode,proprietor_name,company_number,date_added,proprietorship_cat\n';

    let isFirstLine = true;
    let rowCount = 0;

    const transformStream = new Transform({
      transform(chunk, encoding, callback) {
        try {
          const lines = chunk.toString().split('\n');
          let out = '';
          for (const line of lines) {
            if (!line.trim()) continue;
            if (isFirstLine) { isFirstLine = false; continue; } // skip header
            const cols = parseCSVLine(line);
            if (cols.length < 5) continue;
            out += [
              escapeCSV(cols[idx.title]),
              escapeCSV(cols[idx.tenure]),
              escapeCSV(cols[idx.address]),
              escapeCSV(cols[idx.postcode]),
              escapeCSV(cols[idx.name]),
              escapeCSV(cols[idx.company]),
              escapeCSV(cols[idx.date]),
              escapeCSV(cols[idx.cat]),
            ].join(',') + '\n';
            rowCount++;
            if (rowCount % 500000 === 0) console.log(`Processed ${rowCount} rows...`);
          }
          callback(null, out);
        } catch (e) {
          callback(e);
        }
      }
    });

    console.log(`Streaming ${CCOD_FILE} into ccod_properties via COPY...`);

    const copyStream = client.query(
      copyFrom(`COPY ccod_properties (title_number,tenure,property_address,postcode,proprietor_name,company_number,date_added,proprietorship_cat) FROM STDIN WITH (FORMAT csv, HEADER false)`)
    );

    const fileStream = fs.createReadStream(CCOD_FILE, { encoding: 'utf8', highWaterMark: 64 * 1024 });

    await pipelineAsync(fileStream, transformStream, copyStream);

    console.log(`Total rows processed: ${rowCount}`);
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
