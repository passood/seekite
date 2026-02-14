import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyPin, createToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { name, pin } = await request.json();

    if (!name || !pin) {
      return NextResponse.json(
        { error: '이름과 PIN을 입력해주세요' },
        { status: 400 }
      );
    }

    const result = await sql`
      SELECT id, name, pin_hash, color, is_leader FROM members WHERE name = ${name}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: '등록되지 않은 멤버입니다' },
        { status: 401 }
      );
    }

    const member = result.rows[0];
    const isValid = await verifyPin(pin, member.pin_hash);

    if (!isValid) {
      return NextResponse.json(
        { error: 'PIN이 올바르지 않습니다' },
        { status: 401 }
      );
    }

    const token = createToken({
      memberId: member.id,
      name: member.name,
      isLeader: member.is_leader,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      member: {
        id: member.id,
        name: member.name,
        color: member.color,
        is_leader: member.is_leader,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '로그인 처리 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
