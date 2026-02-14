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
      SELECT id, name, color, is_leader FROM members WHERE id = ${auth.memberId}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: '멤버 정보를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json({ member: result.rows[0] });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json(
      { error: '인증 정보 확인 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
