import { NextRequest, NextResponse } from 'next/server';
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
      SELECT
        t.id,
        t.title,
        t.bible_ref,
        t.bible_text,
        t.question,
        t.worship_date,
        t.created_by,
        t.created_at,
        COUNT(m.id)::int AS message_count,
        COUNT(
          CASE WHEN m.created_at > COALESCE(rs.last_read_at, '1970-01-01') THEN 1 END
        )::int AS unread_count
      FROM topics t
      LEFT JOIN messages m ON m.topic_id = t.id
      LEFT JOIN read_status rs ON rs.topic_id = t.id AND rs.member_id = ${auth.memberId}
      GROUP BY t.id, rs.last_read_at
      ORDER BY t.worship_date DESC
    `;

    return NextResponse.json({ topics: result.rows });
  } catch (error) {
    console.error('Topics list error:', error);
    return NextResponse.json(
      { error: '말씀 목록을 불러오는 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    const { title, bible_ref, bible_text, question, worship_date } = await request.json();

    if (!title || !bible_ref || !bible_text || !worship_date) {
      return NextResponse.json(
        { error: '필수 항목을 모두 입력해주세요' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO topics (title, bible_ref, bible_text, question, worship_date, created_by)
      VALUES (${title}, ${bible_ref}, ${bible_text}, ${question || null}, ${worship_date}, ${auth.memberId})
      RETURNING id, title, bible_ref, bible_text, question, worship_date, created_by, created_at
    `;

    return NextResponse.json({ topic: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Topic create error:', error);
    return NextResponse.json(
      { error: '말씀 주제 등록 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
