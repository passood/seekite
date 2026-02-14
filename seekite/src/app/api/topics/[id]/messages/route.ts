import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { Message } from '@/lib/types';

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

    const messagesResult = await sql`
      SELECT
        msg.id,
        msg.topic_id,
        msg.member_id,
        msg.content,
        msg.reply_to_id,
        msg.created_at,
        m.name AS member_name,
        m.color AS member_color
      FROM messages msg
      JOIN members m ON m.id = msg.member_id
      WHERE msg.topic_id = ${id}
      ORDER BY msg.created_at ASC
    `;

    const messages: Message[] = messagesResult.rows as Message[];

    if (messages.length > 0) {
      // 해당 토픽의 모든 메시지에 대한 리액션을 서브쿼리로 조회
      const reactionsResult = await sql`
        SELECT
          r.id,
          r.message_id,
          r.member_id,
          r.type,
          m.name AS member_name
        FROM reactions r
        JOIN members m ON m.id = r.member_id
        WHERE r.message_id IN (
          SELECT msg.id FROM messages msg WHERE msg.topic_id = ${id}
        )
      `;

      const reactionsByMessage: Record<string, Message['reactions']> = {};
      for (const reaction of reactionsResult.rows) {
        const msgId = reaction.message_id as string;
        if (!reactionsByMessage[msgId]) {
          reactionsByMessage[msgId] = [];
        }
        reactionsByMessage[msgId]!.push({
          id: reaction.id as string,
          message_id: reaction.message_id as string,
          member_id: reaction.member_id as string,
          type: reaction.type as 'heart' | 'amen' | 'pray',
          member_name: reaction.member_name as string,
        });
      }

      for (const message of messages) {
        message.reactions = reactionsByMessage[message.id] || [];
      }

      // reply_to 정보 매핑
      const messageMap = new Map(messages.map((m) => [m.id, m]));
      for (const message of messages) {
        if (message.reply_to_id) {
          const replyTo = messageMap.get(message.reply_to_id);
          if (replyTo) {
            message.reply_to = {
              id: replyTo.id,
              topic_id: replyTo.topic_id,
              member_id: replyTo.member_id,
              content: replyTo.content,
              reply_to_id: replyTo.reply_to_id,
              created_at: replyTo.created_at,
              member_name: replyTo.member_name,
              member_color: replyTo.member_color,
            };
          }
        }
      }
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Messages list error:', error);
    return NextResponse.json(
      { error: '나눔 메시지를 불러오는 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

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

    const { id } = await params;
    const { content, reply_to_id } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: '나눔 내용을 입력해주세요' },
        { status: 400 }
      );
    }

    // 토픽 존재 확인
    const topicCheck = await sql`
      SELECT id FROM topics WHERE id = ${id}
    `;
    if (topicCheck.rows.length === 0) {
      return NextResponse.json(
        { error: '말씀 주제를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const result = await sql`
      INSERT INTO messages (topic_id, member_id, content, reply_to_id)
      VALUES (${id}, ${auth.memberId}, ${content.trim()}, ${reply_to_id || null})
      RETURNING id, topic_id, member_id, content, reply_to_id, created_at
    `;

    const message = result.rows[0];

    // 작성자 정보 추가
    const memberResult = await sql`
      SELECT name, color FROM members WHERE id = ${auth.memberId}
    `;
    message.member_name = memberResult.rows[0].name;
    message.member_color = memberResult.rows[0].color;
    message.reactions = [];

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Message create error:', error);
    return NextResponse.json(
      { error: '나눔 작성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
