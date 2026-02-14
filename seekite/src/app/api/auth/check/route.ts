import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name');

  if (!name) {
    return NextResponse.json({ error: '이름을 입력해주세요' }, { status: 400 });
  }

  const result = await sql`
    SELECT id FROM members WHERE name = ${name}
  `;

  return NextResponse.json({ exists: result.rows.length > 0 });
}
