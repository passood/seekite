'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import type { Member } from '@/lib/types';

export default function ProfilePage() {
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          router.push('/');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setMember(data.member);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <p className="text-foreground/50 text-sm">불러오는 중...</p>
      </div>
    );
  }

  if (!member) return null;

  return (
    <div className="flex flex-col min-h-dvh">
      <header className="flex items-center justify-center px-5 py-4 border-b border-border">
        <h1 className="text-xl font-bold text-primary">내 정보</h1>
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-3"
            style={{ backgroundColor: member.color }}
          >
            {member.name.charAt(0)}
          </div>
          <h2 className="text-lg font-bold">{member.name}</h2>
          {member.is_leader && (
            <span className="text-xs text-primary font-medium mt-1">리더</span>
          )}
        </div>

        <div className="bg-card-bg rounded-2xl p-4 flex flex-col gap-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-sm text-foreground/50">이름</span>
            <span className="text-sm font-medium">{member.name}</span>
          </div>
          <div className="border-t border-border" />
          <div className="flex justify-between items-center">
            <span className="text-sm text-foreground/50">가입일</span>
            <span className="text-sm font-medium">
              {formatDate(member.created_at)}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full py-3 rounded-2xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {loggingOut ? '로그아웃 중...' : '로그아웃'}
        </button>
      </main>

      <BottomNav />
    </div>
  );
}
