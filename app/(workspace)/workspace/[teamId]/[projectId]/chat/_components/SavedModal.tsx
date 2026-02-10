// app/(workspace)/workspace/[teamId]/[projectId]/chat/_components/SavedModal.tsx
'use client';

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useWorkspacePath } from "@/hooks/useWorkspacePath";
import { useChat } from "@/workspace/chat/_model/store";
import { X, Bookmark } from "lucide-react";

const MSGS_KEY = (id: string) => `fd.chat.messages:${id}`;

export default function SavedModal({
  open, onOpenChange
}: {
  open: boolean;
  onOpenChange: (v:boolean)=>void;
}) {
  const router = useRouter();
  const { buildHref } = useWorkspacePath();
  const { me, messages, savedByUser, toggleSave, users, channels, channelId, setChannel } = useChat();
  const savedIds = savedByUser[me.id] || [];
  const savedMsgs = useMemo(() => {
    const map = new Map<string, any>();
    messages.forEach((m) => map.set(m.id, m));
    savedIds.forEach((id) => {
      if (map.has(id)) return;
      for (const ch of channels) {
        const raw = localStorage.getItem(MSGS_KEY(ch.id));
        if (!raw) continue;
        try {
          const list = JSON.parse(raw) as any[];
          const found = list.find((m) => m.id === id);
          if (found) {
            map.set(id, found);
            break;
          }
        } catch {
          // ignore parse errors
        }
      }
    });
    return savedIds.map((id) => map.get(id)).filter(Boolean) as any[];
  }, [savedIds, messages, channels]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={()=> onOpenChange(false)}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute left-1/2 top-24 -translate-x-1/2 w-[640px] rounded-xl border border-border bg-panel shadow-panel p-4" onClick={(e)=> e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="font-semibold">Saved messages</div>
          <button className="p-1 rounded hover:bg-subtle/60" onClick={()=> onOpenChange(false)} aria-label="close"><X size={16}/></button>
        </div>

        <div className="mt-3 max-h-[420px] overflow-y-auto divide-y divide-border/60">
          {savedMsgs.length === 0 && <div className="text-sm text-muted py-8 text-center">저장한 메시지가 없습니다.</div>}
          {savedMsgs.map(sm => {
            const avatarUrl = users[sm.authorId]?.avatarUrl;
            return (
              <div
                key={sm.id}
                className="group w-full text-left py-3 flex items-start gap-3 rounded-md px-2 transition-colors hover:bg-zinc-300/60 dark:hover:bg-zinc-800/60"
                onClick={() => {
                  const targetChannel = sm.channelId || channelId;
                  if (targetChannel && targetChannel !== channelId) {
                    void setChannel(targetChannel);
                    const href = buildHref(["chat", encodeURIComponent(targetChannel)], `/chat/${encodeURIComponent(targetChannel)}`);
                    router.push(href);
                  }
                  window.setTimeout(() => {
                    document.getElementById(sm.id)?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }, 120);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const targetChannel = sm.channelId || channelId;
                    if (targetChannel && targetChannel !== channelId) {
                      void setChannel(targetChannel);
                      const href = buildHref(["chat", encodeURIComponent(targetChannel)], `/chat/${encodeURIComponent(targetChannel)}`);
                      router.push(href);
                    }
                    window.setTimeout(() => {
                      document.getElementById(sm.id)?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }, 120);
                  }
                }}
              >
                <div className="w-7 h-7 rounded-full border border-border bg-subtle/80 overflow-hidden flex items-center justify-center text-[10px]">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={sm.author} className="h-full w-full object-cover" />
                  ) : (
                    sm.author?.[0] || "?"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted">{new Date(sm.ts).toLocaleString()}</div>
                  <div className="text-sm font-semibold">{sm.author}</div>
                  <div className="text-sm mt-1 line-clamp-3">{sm.text}</div>
                </div>
                <button
                  className="ml-auto mt-1 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted opacity-0 transition group-hover:opacity-100 hover:bg-subtle/80"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSave(sm.id);
                  }}
                  aria-label="Unsave"
                  title="Unsave"
                >
                  <Bookmark size={14} />
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
