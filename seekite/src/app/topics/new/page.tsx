'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewTopicPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [bibleRef, setBibleRef] = useState('');
  const [bibleText, setBibleText] = useState('');
  const [question, setQuestion] = useState('');
  const [worshipDate, setWorshipDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !bibleRef.trim() || !bibleText.trim() || !worshipDate) {
      setError('필수 항목을 모두 입력해주세요');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          bible_ref: bibleRef.trim(),
          bible_text: bibleText.trim(),
          question: question.trim() || null,
          worship_date: worshipDate,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '등록에 실패했습니다');
        return;
      }

      router.push('/topics');
    } catch {
      setError('서버와 연결할 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-dvh">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <button
          onClick={() => router.back()}
          className="p-1 text-foreground/60"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">새 말씀 등록</h1>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col px-5 py-5 gap-5">
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1.5">
            제목 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="2월 9일 주일예배"
            className="w-full px-4 py-3 rounded-xl bg-card-bg text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-foreground/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1.5">
            성경 본문 참조 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={bibleRef}
            onChange={(e) => setBibleRef(e.target.value)}
            placeholder="요한복음 3:16-17"
            className="w-full px-4 py-3 rounded-xl bg-card-bg text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-foreground/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1.5">
            말씀 본문 <span className="text-red-400">*</span>
          </label>
          <textarea
            value={bibleText}
            onChange={(e) => setBibleText(e.target.value)}
            placeholder="하나님이 세상을 이처럼 사랑하사..."
            rows={5}
            className="w-full px-4 py-3 rounded-xl bg-card-bg text-sm font-serif outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-foreground/30 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1.5">
            나눔 질문
          </label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="이 말씀에서 가장 와닿는 부분은?"
            className="w-full px-4 py-3 rounded-xl bg-card-bg text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-foreground/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1.5">
            예배 날짜 <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            value={worshipDate}
            onChange={(e) => setWorshipDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-card-bg text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        <div className="mt-auto pt-4 pb-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-primary text-white font-medium text-sm transition-colors active:bg-primary-light disabled:opacity-50"
          >
            {loading ? '등록 중...' : '등록하기'}
          </button>
        </div>
      </form>
    </div>
  );
}
