'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { Topic, Message, Member } from '@/lib/types';

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return '방금';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days === 1) return '어제';
  if (days < 7) return `${days}일 전`;
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

type ReactionCount = { type: string; count: number; myReaction: boolean };

function getReactionCounts(
  reactions: Message['reactions'],
  myId: string
): ReactionCount[] {
  if (!reactions || reactions.length === 0) return [];
  const map: Record<string, { count: number; myReaction: boolean }> = {};
  for (const r of reactions) {
    if (!map[r.type]) map[r.type] = { count: 0, myReaction: false };
    map[r.type].count++;
    if (r.member_id === myId) map[r.type].myReaction = true;
  }
  return Object.entries(map).map(([type, data]) => ({
    type,
    ...data,
  }));
}

const REACTION_EMOJI: Record<string, string> = {
  heart: '\u2764\uFE0F',
  amen: '\uD83D\uDE4F',
  pray: '\uD83D\uDE4F',
};

export default function TopicDetailPage() {
  const router = useRouter();
  const params = useParams();
  const topicId = params.id as string;

  const [topic, setTopic] = useState<Topic | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [member, setMember] = useState<Member | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reactionMenuId, setReactionMenuId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meRes, topicRes, msgRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch(`/api/topics/${topicId}`),
          fetch(`/api/topics/${topicId}/messages`),
        ]);

        if (!meRes.ok) {
          router.push('/');
          return;
        }

        const meData = await meRes.json();
        setMember(meData.member);

        if (!topicRes.ok) {
          setError('말씀을 찾을 수 없습니다');
          return;
        }

        const topicData = await topicRes.json();
        setTopic(topicData.topic);

        if (msgRes.ok) {
          const msgData = await msgRes.json();
          setMessages(msgData.messages);
        }

        // 읽음 처리
        fetch(`/api/topics/${topicId}/read`, { method: 'POST' });
      } catch {
        setError('데이터를 불러오는 중 오류가 발생했습니다');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [topicId, router]);

  useEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom();
    }
  }, [loading, messages.length, scrollToBottom]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/topics/${topicId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: input.trim(),
          reply_to_id: replyTo?.id || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // reply_to 정보 수동 매핑
        if (replyTo && data.message) {
          data.message.reply_to = {
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
        setMessages((prev) => [...prev, data.message]);
        setInput('');
        setReplyTo(null);
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
        setTimeout(scrollToBottom, 100);
      }
    } catch {
      // 전송 실패 시 무시
    } finally {
      setSending(false);
    }
  };

  const handleReaction = async (messageId: string, type: string) => {
    setReactionMenuId(null);
    try {
      const res = await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id !== messageId) return msg;
            const reactions = [...(msg.reactions || [])];
            if (data.action === 'added') {
              reactions.push({
                ...data.reaction,
                member_name: member?.name,
              });
            } else {
              const idx = reactions.findIndex(
                (r) => r.member_id === member?.id && r.type === type
              );
              if (idx !== -1) reactions.splice(idx, 1);
            }
            return { ...msg, reactions };
          })
        );
      }
    } catch {
      // 리액션 실패 시 무시
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <p className="text-foreground/50 text-sm">불러오는 중...</p>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <p className="text-red-500 text-sm">{error || '말씀을 찾을 수 없습니다'}</p>
      </div>
    );
  }

  const isMe = (msgMemberId: string) => msgMemberId === member?.id;

  return (
    <div className="flex flex-col h-dvh" onClick={() => setReactionMenuId(null)}>
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        <button
          onClick={() => router.push('/topics')}
          className="p-1 text-foreground/60"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-base font-semibold truncate">{topic.title}</h1>
      </header>

      {/* Scripture Card */}
      <div className="px-4 py-3 shrink-0">
        <div className="bg-card-bg rounded-2xl p-4 shadow-sm">
          <p className="font-semibold text-sm mb-2">{topic.bible_ref}</p>
          <p className="font-serif text-sm text-foreground/80 leading-relaxed pl-3 border-l-2 border-primary/30">
            {topic.bible_text}
          </p>
          {topic.question && (
            <p className="mt-3 text-sm text-foreground/60 italic flex items-start gap-1.5">
              <span className="shrink-0">&#x1F4AC;</span>
              <span>{topic.question}</span>
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-foreground/30 text-sm">
              첫 번째 나눔을 남겨보세요
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const mine = isMe(msg.member_id);
            const reactionCounts = getReactionCounts(msg.reactions, member?.id || '');

            return (
              <div
                key={msg.id}
                className={`flex mb-3 ${mine ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                  {!mine && (
                    <p className="text-xs text-foreground/50 mb-1 ml-1">
                      {msg.member_name}
                    </p>
                  )}

                  <div
                    className="relative"
                    onClick={(e) => {
                      e.stopPropagation();
                      setReactionMenuId(reactionMenuId === msg.id ? null : msg.id);
                    }}
                  >
                    {/* Reply quote */}
                    {msg.reply_to && (
                      <div
                        className={`text-xs px-3 py-1.5 rounded-t-xl mb-0 opacity-70 ${
                          mine ? 'bg-[#DDD2C5] rounded-bl-xl' : 'rounded-br-xl'
                        }`}
                        style={
                          mine
                            ? undefined
                            : { backgroundColor: msg.member_color ? msg.member_color + 'B0' : '#e0e0e0' }
                        }
                      >
                        <p className="font-medium">{msg.reply_to.member_name}</p>
                        <p className="truncate">{msg.reply_to.content}</p>
                      </div>
                    )}

                    <div
                      className={`px-3.5 py-2.5 text-sm leading-relaxed ${
                        msg.reply_to ? 'rounded-b-2xl' : 'rounded-2xl'
                      } ${
                        mine
                          ? 'bg-[#E8DDD0] rounded-tr-sm'
                          : 'rounded-tl-sm'
                      }`}
                      style={
                        mine
                          ? undefined
                          : { backgroundColor: msg.member_color || '#e0e0e0' }
                      }
                    >
                      {msg.content}
                    </div>

                    {/* Reaction menu */}
                    {reactionMenuId === msg.id && (
                      <div
                        className={`absolute top-full mt-1 z-10 flex gap-1 bg-white rounded-full shadow-lg px-2 py-1 ${
                          mine ? 'right-0' : 'left-0'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {[
                          { type: 'heart', emoji: '\u2764\uFE0F' },
                          { type: 'amen', emoji: '\uD83D\uDE4F' },
                        ].map(({ type, emoji }) => (
                          <button
                            key={type}
                            onClick={() => handleReaction(msg.id, type)}
                            className="w-9 h-9 flex items-center justify-center text-lg rounded-full hover:bg-card-bg transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                        <button
                          onClick={() => {
                            setReplyTo(msg);
                            setReactionMenuId(null);
                            textareaRef.current?.focus();
                          }}
                          className="w-9 h-9 flex items-center justify-center text-sm rounded-full hover:bg-card-bg transition-colors text-foreground/60"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 17 4 12 9 7" />
                            <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Reactions display */}
                  {reactionCounts.length > 0 && (
                    <div className={`flex gap-1 mt-0.5 ${mine ? 'mr-1' : 'ml-1'}`}>
                      {reactionCounts.map(({ type, count, myReaction }) => (
                        <button
                          key={type}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReaction(msg.id, type);
                          }}
                          className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full ${
                            myReaction ? 'bg-primary/10 border border-primary/20' : 'bg-card-bg'
                          }`}
                        >
                          <span className="text-[11px]">{REACTION_EMOJI[type]}</span>
                          <span className="text-foreground/50">{count}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <p className={`text-[10px] text-foreground/30 mt-0.5 ${mine ? 'mr-1' : 'ml-1'}`}>
                    {getRelativeTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border px-4 py-3 shrink-0 bg-background">
        {replyTo && (
          <div className="flex items-center justify-between bg-card-bg rounded-lg px-3 py-2 mb-2">
            <div className="text-xs text-foreground/60 truncate flex-1">
              <span className="font-medium">{replyTo.member_name}</span>
              <span className="ml-1">{replyTo.content}</span>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="ml-2 text-foreground/40 shrink-0"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder="묵상을 나눠주세요..."
            rows={1}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-card-bg text-sm outline-none resize-none max-h-[120px] placeholder:text-foreground/30"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center transition-colors disabled:opacity-30"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
