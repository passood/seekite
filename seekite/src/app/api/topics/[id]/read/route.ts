import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    const { id: topicId } = await params;

    // 토픽 존재 확인
    const topicCheck = await sql`
      SELECT id FROM topics WHERE id = ${topicId}
    `;
    if (topicCheck.rows.length === 0) {
      return NextResponse.json(
        { error: '말씀 주제를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // UPSERT: 있으면 갱신, 없으면 삽입
    await sql`
      INSERT INTO read_status (topic_id, member_id, last_read_at)
      VALUES (${topicId}, ${auth.memberId}, NOW())
      ON CONFLICT (topic_id, member_id)
      DO UPDATE SET last_read_at = NOW()
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Read status update error:', error);
    return NextResponse.json(
      { error: '읽음 상태 갱신 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
