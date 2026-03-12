import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const number = searchParams.get('number');

  if (!number) {
    return NextResponse.json({ error: 'Company number required' }, { status: 400 });
  }

  const apiKey = process.env.CH_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'CH_API_KEY not configured' }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://api.company-information.service.gov.uk/company/${encodeURIComponent(number)}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
        },
        next: { revalidate: 86400 },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: 'Company not found' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}