import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(
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

    const { id } = await params;

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
        m_creator.name AS creator_name
      FROM topics t
      LEFT JOIN members m_creator ON m_creator.id = t.created_by
      WHERE t.id = ${id}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: '말씀 주제를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json({ topic: result.rows[0] });
  } catch (error) {
    console.error('Topic detail error:', error);
    return NextResponse.json(
      { error: '말씀 주제를 불러오는 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const { id } = await params;

    const result = await sql`DELETE FROM topics WHERE id = ${id}`;

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: '말씀 주제를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Topic delete error:', error);
    return NextResponse.json(
      { error: '삭제 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
