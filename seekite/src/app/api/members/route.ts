import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    const result = await sql`
      SELECT id, name, color, created_at
      FROM members
      ORDER BY created_at ASC
    `;

    return NextResponse.json({ members: result.rows });
  } catch (error) {
    console.error('Members list error:', error);
    return NextResponse.json(
      { error: '멤버 목록을 불러오는 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
