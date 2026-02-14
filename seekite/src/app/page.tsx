'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const COLORS = [
  '#E8D5C4', '#C4D7E0', '#D4E0C4', '#E0D4E8', '#E8E0C4',
  '#D4C4E0', '#C4E0D7', '#E0C4C4', '#C4D0E8', '#D7E0C4',
];

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'name' | 'pin' | 'signup-pin' | 'signup-confirm'>('name');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNameSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/auth/check?name=${encodeURIComponent(trimmed)}`);
      const data = await res.json();

      if (data.exists) {
        setStep('pin');
      } else {
        setStep('signup-pin');
      }
    } catch {
      setError('서버와 연결할 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  const handlePinInput = (digit: string, target: 'pin' | 'confirmPin') => {
    const current = target === 'pin' ? pin : confirmPin;
    if (current.length >= 4) return;
    const newVal = current + digit;
    setError('');

    if (target === 'pin') {
      setPin(newVal);
      if (newVal.length === 4) {
        if (step === 'pin') {
          handleLogin(newVal);
        } else if (step === 'signup-pin') {
          setTimeout(() => setStep('signup-confirm'), 200);
        }
      }
    } else {
      setConfirmPin(newVal);
      if (newVal.length === 4) {
        if (newVal !== pin) {
          setError('PIN이 일치하지 않습니다');
          setConfirmPin('');
        } else {
          handleSignup(newVal);
        }
      }
    }
  };

  const handlePinDelete = (target: 'pin' | 'confirmPin') => {
    if (target === 'pin') setPin((prev) => prev.slice(0, -1));
    else setConfirmPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleLogin = async (pinValue: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), pin: pinValue }),
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

  const handleSignup = async (pinValue: string) => {
    setLoading(true);
    setError('');
    try {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), pin: pinValue, color }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '가입에 실패했습니다');
        setConfirmPin('');
        return;
      }
      router.push('/topics');
    } catch {
      setError('서버와 연결할 수 없습니다');
      setConfirmPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'signup-confirm') {
      setStep('signup-pin');
      setConfirmPin('');
    } else {
      setStep('name');
      setPin('');
      setConfirmPin('');
    }
    setError('');
  };

  const currentPin = step === 'signup-confirm' ? confirmPin : pin;
  const pinTarget = step === 'signup-confirm' ? 'confirmPin' as const : 'pin' as const;

  const pinLabel =
    step === 'pin' ? 'PIN 4자리를 입력해주세요' :
    step === 'signup-pin' ? '사용할 PIN 4자리를 설정해주세요' :
    'PIN을 한 번 더 입력해주세요';

  const subtitle =
    step === 'pin' ? '다시 만나서 반가워요!' :
    step === 'signup-pin' ? '처음 오셨군요! 환영합니다' :
    'PIN 확인';

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-6 py-12">
      {step === 'name' ? (
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
            <label className="block text-sm text-foreground/50 mb-2 text-center">
              이름을 입력해주세요
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
              placeholder="이름"
              autoFocus
              className="w-full h-12 px-4 rounded-xl bg-card-bg border border-border text-center text-lg focus:outline-none focus:border-primary transition-colors"
            />
            {error && (
              <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
            )}
            <button
              onClick={handleNameSubmit}
              disabled={!name.trim() || loading}
              className="w-full h-12 mt-4 rounded-xl bg-primary text-white font-medium transition-colors active:bg-primary-light disabled:opacity-40"
            >
              {loading ? '확인 중...' : '시작하기'}
            </button>
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
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-medium text-foreground/70 shadow-sm mb-3 bg-card-bg"
            >
              {name.trim()[0]}
            </div>
            <p className="text-lg font-medium mb-0.5">{name.trim()}</p>
            <p className="text-xs text-foreground/40 mb-1">{subtitle}</p>
            <p className="text-sm text-foreground/50 mb-8">{pinLabel}</p>

            <div className="flex gap-3 mb-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-3.5 h-3.5 rounded-full transition-colors ${
                    i < currentPin.length ? 'bg-primary' : 'bg-border'
                  }`}
                />
              ))}
            </div>

            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}

            {loading && (
              <p className="text-foreground/50 text-sm mb-4">
                {step === 'pin' ? '로그인 중...' : '가입 중...'}
              </p>
            )}

            <div className="grid grid-cols-3 gap-3 mt-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handlePinInput(String(digit), pinTarget)}
                  disabled={loading}
                  className="w-18 h-14 rounded-xl bg-card-bg text-lg font-medium text-foreground/80 flex items-center justify-center transition-colors active:bg-border disabled:opacity-50"
                >
                  {digit}
                </button>
              ))}
              <div />
              <button
                onClick={() => handlePinInput('0', pinTarget)}
                disabled={loading}
                className="w-18 h-14 rounded-xl bg-card-bg text-lg font-medium text-foreground/80 flex items-center justify-center transition-colors active:bg-border disabled:opacity-50"
              >
                0
              </button>
              <button
                onClick={() => handlePinDelete(pinTarget)}
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
