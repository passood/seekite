import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuthUser, clearAuthCookie } from '@/lib/auth';

export async function DELETE() {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    const memberId = auth.memberId;

    // 1. reactions 삭제
    await sql`DELETE FROM reactions WHERE member_id = ${memberId}`;

    // 2. read_status 삭제
    await sql`DELETE FROM read_status WHERE member_id = ${memberId}`;

    // 3. messages 삭제 (reply_to_id ON DELETE SET NULL, reactions ON DELETE CASCADE 자동 처리)
    await sql`DELETE FROM messages WHERE member_id = ${memberId}`;

    // 4. topics.created_by SET NULL (대화방은 보존)
    await sql`UPDATE topics SET created_by = NULL WHERE created_by = ${memberId}`;

    // 5. members 삭제
    await sql`DELETE FROM members WHERE id = ${memberId}`;

    // 6. 쿠키 정리
    await clearAuthCookie();

    return NextResponse.json({ message: '회원 탈퇴가 완료되었습니다' });
  } catch (error) {
    console.error('Withdraw error:', error);
    return NextResponse.json(
      { error: '회원 탈퇴 처리 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
