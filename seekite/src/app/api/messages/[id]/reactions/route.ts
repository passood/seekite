import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

const VALID_REACTION_TYPES = ['heart', 'amen', 'pray'];

export async function POST(
  request: NextRequest,
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

    const { id: messageId } = await params;
    const { type } = await request.json();

    if (!type || !VALID_REACTION_TYPES.includes(type)) {
      return NextResponse.json(
        { error: '올바른 리액션 타입을 선택해주세요' },
        { status: 400 }
      );
    }

    // 메시지 존재 확인
    const messageCheck = await sql`
      SELECT id FROM messages WHERE id = ${messageId}
    `;
    if (messageCheck.rows.length === 0) {
      return NextResponse.json(
        { error: '메시지를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 기존 리액션 확인
    const existing = await sql`
      SELECT id FROM reactions
      WHERE message_id = ${messageId} AND member_id = ${auth.memberId} AND type = ${type}
    `;

    if (existing.rows.length > 0) {
      // 이미 존재하면 삭제 (토글 off)
      await sql`
        DELETE FROM reactions WHERE id = ${existing.rows[0].id}
      `;
      return NextResponse.json({ action: 'removed', type });
    } else {
      // 없으면 추가 (토글 on)
      const result = await sql`
        INSERT INTO reactions (message_id, member_id, type)
        VALUES (${messageId}, ${auth.memberId}, ${type})
        RETURNING id, message_id, member_id, type, created_at
      `;
      return NextResponse.json({ action: 'added', reaction: result.rows[0] }, { status: 201 });
    }
  } catch (error) {
    console.error('Reaction toggle error:', error);
    return NextResponse.json(
      { error: '리액션 처리 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
