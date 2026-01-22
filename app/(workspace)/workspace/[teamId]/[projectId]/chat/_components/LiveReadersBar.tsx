// components/chat/LiveReadersBar.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';

export type Reader = { id: string; name: string; ts: number; channelId: string };

export default function LiveReadersBar({ meId, meName, channelId }: { meId: string; meName: string; channelId: string }) {
  const [peers, setPeers] = useState<Record<string, Reader>>({});

  useEffect(() => {
    const bc = new BroadcastChannel('flowdash-chat');
    const onMsg = (e: MessageEvent) => {
      const data = e.data;
      if (!data || typeof data !== 'object') return;
      if (data.type === 'read-cursor' && data.channelId === channelId && data.userId !== meId) {
        setPeers(prev => ({ ...prev, [data.userId]: { id: data.userId, name: data.userName, ts: Date.now(), channelId } }));
      }
    };
    bc.addEventListener('message', onMsg);
    const int = setInterval(() => {
      const now = Date.now();
      setPeers(prev => {
        const next: Record<string, Reader> = {};
        for (const [k, v] of Object.entries(prev)) {
          if (now - v.ts <= 15000) next[k] = v; // 15초 내 활동만 유지
        }
        return next;
      });
    }, 3000);
    return () => {
      bc.removeEventListener('message', onMsg);
      clearInterval(int);
      bc.close();
    };
  }, [channelId, meId]);

  const list = useMemo(() => Object.values(peers).sort((a, b) => b.ts - a.ts), [peers]);

  if (list.length === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-panel/70 px-3 py-2 text-[11px] text-muted shadow-sm">
      <span className="font-medium text-foreground/80">실시간 읽는 사람</span>
      <div className="flex items-center gap-2 text-foreground/80">
        {list.map(p => (
          <span key={p.id} className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-2 py-0.5 shadow-sm">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-subtle/60 text-[10px] font-semibold text-muted">
              {p.name[0]}
            </span>
            <span className="text-xs">{p.name}</span>
          </span>
        ))}
      </div>
      <span className="ml-auto text-muted/70">#{channelId}</span>
    </div>
  );
}

/** 외부에서 호출: 현재 사용자의 읽기 커서 브로드캐스트 */
export function broadcastReadCursor(userId: string, userName: string, channelId: string, ts: number) {
  try {
    const bc = new BroadcastChannel('flowdash-chat');
    bc.postMessage({ type: 'read-cursor', userId, userName, channelId, ts });
    // 브라우저 탭 간 전파 후 바로 닫아도 OK (경량)
    setTimeout(() => bc.close(), 20);
  } catch {}
}
