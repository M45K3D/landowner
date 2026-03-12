import pool from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

const LIMIT = 500;

const SELECT =
  'DISTINCT ON (title_number) id, title_number, tenure, property_address, postcode, proprietor_name, company_number, date_added, proprietorship_cat';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';
  const mode = searchParams.get('mode') ?? 'company'; // 'company' | 'address'

  if (q.length < 2) {
    return NextResponse.json(
      { error: 'Query must be at least 2 characters.' },
      { status: 400 }
    );
  }

  try {
    let sql: string;
    let params: (string | number)[];

    if (mode === 'address') {
      // Full UK postcode: "SW1A 2AA"
      const isFullPostcode = /^[A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2}$/i.test(q);
      // Outward code only: "SW1A", "SW1"
      const isOutwardCode = /^[A-Z]{1,2}[0-9][0-9A-Z]?$/i.test(q);

      if (isFullPostcode) {
        const normalised = q.toUpperCase().replace(/\s+/g, ' ');
        sql = `SELECT ${SELECT} FROM ccod_properties WHERE postcode ILIKE $1 ORDER BY title_number, id LIMIT $2`;
        params = [normalised, LIMIT];
      } else if (isOutwardCode) {
        sql = `SELECT ${SELECT} FROM ccod_properties WHERE postcode ILIKE $1 ORDER BY title_number, id LIMIT $2`;
        params = [`${q.toUpperCase()}%`, LIMIT];
      } else {
        // Free-text address — fast with a pg_trgm GIN index on property_address:
        //   CREATE EXTENSION IF NOT EXISTS pg_trgm;
        //   CREATE INDEX ON ccod_properties USING GIN (property_address gin_trgm_ops);
        sql = `SELECT ${SELECT} FROM ccod_properties WHERE property_address ILIKE $1 ORDER BY title_number, id LIMIT $2`;
        params = [`%${q}%`, LIMIT];
      }
    } else {
      // Company search — fast with a pg_trgm GIN index on proprietor_name
      sql = `SELECT ${SELECT} FROM ccod_properties WHERE proprietor_name ILIKE $1 ORDER BY title_number, id LIMIT $2`;
      params = [`%${q}%`, LIMIT];
    }

    const result = await pool.query(sql, params);

    return NextResponse.json({
      data: result.rows,
      limited: result.rows.length === LIMIT,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
