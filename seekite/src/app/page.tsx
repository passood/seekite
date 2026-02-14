'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const MEMBERS = [
  { name: '은혜', color: '#E8D5C4' },
  { name: '준호', color: '#C4D7E0' },
  { name: '수진', color: '#D4E0C4' },
  { name: '민수', color: '#E0D4E8' },
  { name: '지영', color: '#E8E0C4' },
];

export default function LoginPage() {
  const router = useRouter();
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePinInput = (digit: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError('');

    if (newPin.length === 4) {
      handleLogin(newPin);
    }
  };

  const handlePinDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleLogin = async (pinValue: string) => {
    if (!selectedMember) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: selectedMember, pin: pinValue }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '로그인에 실패했습니다');
        setPin('');
        return;
      }

      router.push('/topics');
    } catch {
      setError('서버와 연결할 수 없습니다');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedMember(null);
    setPin('');
    setError('');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 py-12">
      {!selectedMember ? (
        <>
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-primary tracking-tight">
              Seekite
            </h1>
            <p className="mt-2 text-sm text-foreground/60">
              말씀을 나누는 공간
            </p>
          </div>

          <div className="w-full max-w-[320px]">
            <p className="text-center text-sm text-foreground/50 mb-6">
              멤버를 선택해주세요
            </p>
            <div className="flex flex-wrap justify-center gap-5">
              {MEMBERS.map((member) => (
                <button
                  key={member.name}
                  onClick={() => setSelectedMember(member.name)}
                  className="flex flex-col items-center gap-2 transition-transform active:scale-95"
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-medium text-foreground/70 shadow-sm"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.name[0]}
                  </div>
                  <span className="text-sm text-foreground/70">
                    {member.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <button
            onClick={handleBack}
            className="self-start mb-8 text-sm text-foreground/50 flex items-center gap-1"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            돌아가기
          </button>

          <div className="flex flex-col items-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-medium text-foreground/70 shadow-sm mb-3"
              style={{
                backgroundColor: MEMBERS.find((m) => m.name === selectedMember)?.color,
              }}
            >
              {selectedMember[0]}
            </div>
            <p className="text-lg font-medium mb-1">{selectedMember}</p>
            <p className="text-sm text-foreground/50 mb-8">
              PIN 4자리를 입력해주세요
            </p>

            <div className="flex gap-3 mb-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-3.5 h-3.5 rounded-full transition-colors ${
                    i < pin.length ? 'bg-primary' : 'bg-border'
                  }`}
                />
              ))}
            </div>

            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}

            {loading && (
              <p className="text-foreground/50 text-sm mb-4">로그인 중...</p>
            )}

            <div className="grid grid-cols-3 gap-3 mt-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handlePinInput(String(digit))}
                  disabled={loading}
                  className="w-18 h-14 rounded-xl bg-card-bg text-lg font-medium text-foreground/80 flex items-center justify-center transition-colors active:bg-border disabled:opacity-50"
                >
                  {digit}
                </button>
              ))}
              <div />
              <button
                onClick={() => handlePinInput('0')}
                disabled={loading}
                className="w-18 h-14 rounded-xl bg-card-bg text-lg font-medium text-foreground/80 flex items-center justify-center transition-colors active:bg-border disabled:opacity-50"
              >
                0
              </button>
              <button
                onClick={handlePinDelete}
                disabled={loading}
                className="w-18 h-14 rounded-xl text-foreground/50 flex items-center justify-center transition-colors active:bg-card-bg disabled:opacity-50"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                  <line x1="18" y1="9" x2="12" y2="15" />
                  <line x1="12" y1="9" x2="18" y2="15" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
