'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Topic, Member } from '@/lib/types';

export default function TopicsPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meRes, topicsRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/topics'),
        ]);

        if (!meRes.ok) {
          router.push('/');
          return;
        }

        const meData = await meRes.json();
        setMember(meData.member);

        if (topicsRes.ok) {
          const topicsData = await topicsRes.json();
          setTopics(topicsData.topics);
        }
      } catch {
        setError('데이터를 불러오는 중 오류가 발생했습니다');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <p className="text-foreground/50 text-sm">불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-dvh">
      <header className="flex items-center justify-between px-5 py-4 border-b border-border">
        <button
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/');
          }}
          className="text-sm text-foreground/40 hover:text-foreground/70 transition-colors"
        >
          로그아웃
        </button>
        <h1 className="text-xl font-bold text-primary">Seekite</h1>
        {member?.is_leader ? (
          <button
            onClick={() => router.push('/topics/new')}
            className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-xl leading-none"
          >
            +
          </button>
        ) : (
          <div className="w-9" />
        )}
      </header>

      <main className="flex-1 px-4 py-4">
        {topics.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-foreground/40">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-40">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <p className="text-sm">아직 등록된 말씀이 없습니다</p>
            {member?.is_leader && (
              <p className="text-xs mt-1">
                상단의 + 버튼으로 새 말씀을 등록해보세요
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => router.push(`/topics/${topic.id}`)}
                className="w-full text-left bg-card-bg rounded-2xl p-4 transition-colors active:bg-border"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">&#x1F4D6;</span>
                    <span className="font-medium text-[15px]">
                      {topic.title}
                    </span>
                  </div>
                  {(topic.unread_count ?? 0) > 0 && (
                    <span className="bg-red-500 text-white text-[11px] font-medium rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                      {topic.unread_count}
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground/60 ml-7">
                  {topic.bible_ref}
                </p>
                <p className="text-xs text-foreground/40 ml-7 mt-1">
                  나눔 {topic.message_count ?? 0}개
                  {topic.worship_date && ` · ${formatDate(topic.worship_date)}`}
                </p>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
