// components/chat/HuddleBar.tsx
'use client';

import { Mic, MicOff, PhoneOff } from "lucide-react";
import { useChat } from "@/workspace/chat/_model/store";

function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  const initials = name
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="flex h-6 w-6 overflow-hidden rounded-full border border-border bg-subtle/80 text-[10px] font-semibold text-muted">
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className="grid h-full w-full place-items-center">{initials}</span>
      )}
    </div>
  );
}

export default function HuddleBar({ channelId }: { channelId: string }) {
  const { huddles, stopHuddle, toggleHuddleMute, users } = useChat();
  const h = huddles[channelId];

  if (!h?.active) return null;

  const dur = h.startedAt ? Math.max(0, Math.floor((Date.now() - h.startedAt)/1000)) : 0;
  const mm = String(Math.floor(dur/60)).padStart(2,'0');
  const ss = String(dur%60).padStart(2,'0');

  return (
    <div className="px-4 py-2 border-b border-border bg-subtle/20 flex items-center justify-between">
      <div className="text-sm flex items-center gap-3">
        <span className="font-semibold">Huddle</span>
        <span className="text-muted text-xs">#{channelId} · {mm}:{ss}</span>
        <div className="flex items-center gap-1">
          {(h.members || []).map((memberId, i) => {
            const user = users[memberId];
            const displayName = user?.name ?? memberId;
            return <Avatar key={`${memberId}-${i}`} name={displayName} avatarUrl={user?.avatarUrl} />;
          })}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="px-2 py-1 text-xs rounded border border-border hover:bg-subtle/60 inline-flex items-center gap-1"
          onClick={()=> toggleHuddleMute(channelId)}
          title={h.muted ? "Unmute" : "Mute"}
        >
          {h.muted ? <MicOff size={14}/> : <Mic size={14}/>}
          {h.muted ? "Unmute" : "Mute"}
        </button>
        <button
          className="px-2 py-1 text-xs rounded border border-border hover:bg-rose-500/10 inline-flex items-center gap-1"
          onClick={()=> stopHuddle(channelId)}
          title="Leave"
        >
          <PhoneOff size={14}/> Leave
        </button>
      </div>
    </div>
  );
}
