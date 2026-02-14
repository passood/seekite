import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { hashPin, createToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { name, pin, color } = await request.json();

    if (!name || !pin) {
      return NextResponse.json(
        { error: '이름과 PIN을 입력해주세요' },
        { status: 400 }
      );
    }

    if (pin.length !== 4) {
      return NextResponse.json(
        { error: 'PIN은 4자리여야 합니다' },
        { status: 400 }
      );
    }

    const existing = await sql`
      SELECT id FROM members WHERE name = ${name}
    `;

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: '이미 사용 중인 이름입니다' },
        { status: 409 }
      );
    }

    const memberCount = await sql`SELECT COUNT(*) as count FROM members`;
    const isLeader = parseInt(memberCount.rows[0].count) === 0;

    const pinHash = await hashPin(pin);
    const memberColor = color || '#E8D5C4';

    const result = await sql`
      INSERT INTO members (name, pin_hash, color, is_leader)
      VALUES (${name}, ${pinHash}, ${memberColor}, ${isLeader})
      RETURNING id, name, color, is_leader
    `;

    const member = result.rows[0];

    const token = createToken({
      memberId: member.id,
      name: member.name,
      isLeader: member.is_leader,
    });

    await setAuthCookie(token);

    return NextResponse.json({ member });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: '가입 처리 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
