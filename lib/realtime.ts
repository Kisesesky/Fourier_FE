// lib/realtime.ts
export type RTEvent =
  | { type: 'typing'; channelId: string; userId: string; userName: string; on: boolean }
  | { type: 'read-cursor'; channelId: string; userId: string; userName: string; ts: number };

const CH = 'flowdash-chat';

export function rtbroadcast(ev: RTEvent) {
  try {
    const bc = new BroadcastChannel(CH);
    bc.postMessage(ev);
    setTimeout(() => bc.close(), 10);
  } catch {}
}

export function rtlisten(onEvent: (ev: RTEvent) => void) {
  const bc = new BroadcastChannel(CH);
  const handler = (e: MessageEvent) => {
    const data = e.data;
    if (data && typeof data === 'object' && 'type' in data) onEvent(data as RTEvent);
  };
  bc.addEventListener('message', handler);
  return () => {
    bc.removeEventListener('message', handler);
    bc.close();
  };
}
