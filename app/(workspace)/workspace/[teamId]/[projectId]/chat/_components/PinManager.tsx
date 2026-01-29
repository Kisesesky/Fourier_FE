// components/chat/PinManager.tsx
'use client';

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useWorkspacePath } from "@/hooks/useWorkspacePath";
import { useChat } from "@/workspace/chat/_model/store";
import { X, Pin } from "lucide-react";

export default function PinManager({
  open, onOpenChange
}: {
  open: boolean;
  onOpenChange: (v:boolean)=>void;
}) {
  const router = useRouter();
  const { buildHref } = useWorkspacePath();
  const { channelId, messages, pinnedByChannel, togglePin, users, setChannel } = useChat();
  const pinIds = pinnedByChannel[channelId] || [];
  const pinMsgs = useMemo(
    () => pinIds.map(id => messages.find(m => m.id === id)).filter(Boolean) as any[],
    [pinIds, messages]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={()=> onOpenChange(false)}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute left-1/2 top-24 -translate-x-1/2 w-[640px] rounded-xl border border-border bg-panel shadow-panel p-4" onClick={(e)=> e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="font-semibold">Pinned messages</div>
          <button className="p-1 rounded hover:bg-subtle/60" onClick={()=> onOpenChange(false)} aria-label="close"><X size={16}/></button>
        </div>

        <div className="mt-3 max-h-[420px] overflow-y-auto divide-y divide-border/60">
          {pinMsgs.length === 0 && <div className="text-sm text-muted py-8 text-center">고정된 메시지가 없습니다.</div>}
          {pinMsgs.map(pm => {
            const avatarUrl = users[pm.authorId]?.avatarUrl;
            return (
              <div
                key={pm.id}
                className="group w-full text-left py-3 flex items-start gap-3 rounded-md px-2 transition-colors hover:bg-zinc-300/60 dark:hover:bg-zinc-800/60"
                onClick={() => {
                  const targetChannel = pm.channelId || channelId;
                  if (targetChannel && targetChannel !== channelId) {
                    void setChannel(targetChannel);
                    const href = buildHref(["chat", encodeURIComponent(targetChannel)], `/chat/${encodeURIComponent(targetChannel)}`);
                    router.push(href);
                  }
                  window.setTimeout(() => {
                    document.getElementById(pm.id)?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }, 120);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const targetChannel = pm.channelId || channelId;
                    if (targetChannel && targetChannel !== channelId) {
                      void setChannel(targetChannel);
                      const href = buildHref(["chat", encodeURIComponent(targetChannel)], `/chat/${encodeURIComponent(targetChannel)}`);
                      router.push(href);
                    }
                    window.setTimeout(() => {
                      document.getElementById(pm.id)?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }, 120);
                  }
                }}
              >
                <div className="w-7 h-7 rounded-full border border-border bg-subtle/80 overflow-hidden flex items-center justify-center text-[10px]">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={pm.author} className="h-full w-full object-cover" />
                  ) : (
                    pm.author?.[0] || "?"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted">{new Date(pm.ts).toLocaleString()}</div>
                  <div className="text-sm">{pm.author}</div>
                  <div className="text-sm mt-1 line-clamp-3">{pm.text}</div>
                </div>
                <button
                  className="ml-auto mt-1 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted opacity-0 transition group-hover:opacity-100 hover:bg-subtle/80"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePin(pm.id);
                  }}
                  aria-label="Unpin"
                  title="Unpin"
                >
                  <Pin size={14} />
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-3 text-right">
          <button className="text-xs px-3 py-1 rounded border border-border hover:bg-subtle/60" onClick={()=> onOpenChange(false)}>닫기</button>
        </div>
      </div>
    </div>
  );
}
