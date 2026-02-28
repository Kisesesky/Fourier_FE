// app/(workspace)/workspace/[teamId]/[projectId]/chat/_components/SavedModal.tsx
'use client';

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useWorkspacePath } from "@/hooks/useWorkspacePath";
import { useChat } from "@/workspace/chat/_model/store";
import { X, Bookmark } from "lucide-react";

const MSGS_KEY = (id: string) => `fd.chat.messages:${id}`;
const formatSavedDate = (ts?: number) => {
  if (!ts) return "";
  const d = new Date(ts);
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const time = d.toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${yy}.${mm}.${dd} ${time}`;
};

export default function SavedModal({
  open, onOpenChange
}: {
  open: boolean;
  onOpenChange: (v:boolean)=>void;
}) {
  const router = useRouter();
  const { buildHref } = useWorkspacePath();
  const { me, messages, savedByUser, toggleSave, users, channels, channelId, setChannel, openThread } = useChat();
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
    return savedIds
      .map((id) => map.get(id))
      .filter((item): item is any => Boolean(item) && item.channelId === channelId);
  }, [savedIds, messages, channels, channelId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={()=> onOpenChange(false)}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute left-1/2 top-24 -translate-x-1/2 w-[640px] rounded-xl border border-border bg-panel shadow-panel p-4" onClick={(e)=> e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="font-semibold">Saved messages</div>
          <button className="p-1 rounded hover:bg-subtle/60" onClick={()=> onOpenChange(false)} aria-label="close"><X size={16}/></button>
        </div>

        <div className="mt-3 max-h-[420px] space-y-2 overflow-y-auto">
          {savedMsgs.length === 0 && <div className="text-sm text-muted py-8 text-center">저장한 메시지가 없습니다.</div>}
          {savedMsgs.map(sm => {
            const avatarUrl = users[sm.authorId]?.avatarUrl;
            const isThread = !!sm.parentId;
            const threadRootId = sm.parentId || sm.id;
            return (
              <div
                key={sm.id}
                className="group w-full rounded-xl border border-border/70 bg-panel/70 px-3 py-3 text-left transition-colors hover:border-border hover:bg-accent/60"
                onClick={() => {
                  const targetChannel = sm.channelId || channelId;
                  if (targetChannel && targetChannel !== channelId) {
                    void setChannel(targetChannel);
                    const href = buildHref(["chat", encodeURIComponent(targetChannel)], `/chat/${encodeURIComponent(targetChannel)}`);
                    router.push(href);
                  }
                  if (isThread) {
                    openThread(threadRootId);
                    window.dispatchEvent(new Event("chat:open-right"));
                  }
                  window.setTimeout(() => {
                    document.getElementById(sm.id)?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }, 120);
                  onOpenChange(false);
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
                    if (isThread) {
                      openThread(threadRootId);
                      window.dispatchEvent(new Event("chat:open-right"));
                    }
                    window.setTimeout(() => {
                      document.getElementById(sm.id)?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }, 120);
                    onOpenChange(false);
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 overflow-hidden rounded-full border border-border bg-subtle/80 text-[10px]">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={sm.author} className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">{sm.author?.[0] || "?"}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">{sm.author}</span>
                      <span className="shrink-0 text-[11px] text-muted">{formatSavedDate(sm.ts)}</span>
                    </div>
                    <p className="mt-1 line-clamp-3 text-sm text-foreground/90">{sm.text || "(내용 없음)"}</p>
                  </div>
                  <div className="ml-auto flex shrink-0 flex-col items-end gap-1">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        isThread ? "bg-violet-500/15 text-violet-500" : "bg-sky-500/15 text-sky-500"
                      }`}
                    >
                      {isThread ? "Thread" : "Channel"}
                    </span>
                    <button
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted opacity-0 transition group-hover:opacity-100 hover:bg-subtle/80"
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
                </div>
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
