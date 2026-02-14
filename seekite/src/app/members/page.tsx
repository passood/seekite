'use client';

import { useEffect, useState } from 'react';
import BottomNav from '@/components/BottomNav';

interface MemberItem {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export default function MembersPage() {
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/members')
      .then((res) => res.json())
      .then((data) => setMembers(data.members ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.`;
  };

  return (
    <div className="flex flex-col min-h-dvh">
      <header className="flex items-center justify-center px-5 py-4 border-b border-border">
        <h1 className="text-xl font-bold text-primary">멤버</h1>
      </header>

      <main className="flex-1 px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-foreground/50 text-sm">불러오는 중...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-foreground/40 text-sm">멤버가 없습니다</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 bg-card-bg rounded-2xl p-4"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ backgroundColor: m.color }}
                >
                  {m.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-[15px]">{m.name}</p>
                  <p className="text-xs text-foreground/40">
                    {formatDate(m.created_at)} 가입
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
