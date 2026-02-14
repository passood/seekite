import { useEffect, useRef, useCallback } from 'react';
import type { Message } from '@/lib/types';

function hasChanges(prev: Message[], next: Message[]): boolean {
  if (prev.length !== next.length) return true;
  if (next.length === 0) return false;
  if (prev[prev.length - 1].id !== next[next.length - 1].id) return true;

  // 리액션 수 변경 감지
  const prevReactionCount = prev.reduce(
    (sum, m) => sum + (m.reactions?.length || 0),
    0
  );
  const nextReactionCount = next.reduce(
    (sum, m) => sum + (m.reactions?.length || 0),
    0
  );
  if (prevReactionCount !== nextReactionCount) return true;

  return false;
}

export function useMessagePolling(
  topicId: string,
  currentMessages: Message[],
  onUpdate: (messages: Message[]) => void,
  enabled: boolean
) {
  const messagesRef = useRef(currentMessages);
  messagesRef.current = currentMessages;

  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const poll = useCallback(async () => {
    if (document.hidden) return;

    try {
      const res = await fetch(`/api/topics/${topicId}/messages`);
      if (!res.ok) return;
      const data = await res.json();
      const newMessages: Message[] = data.messages;

      if (hasChanges(messagesRef.current, newMessages)) {
        onUpdateRef.current(newMessages);
      }
    } catch {
      // 네트워크 오류 시 무시
    }
  }, [topicId]);

  useEffect(() => {
    if (!enabled) return;

    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, [enabled, poll]);
}
