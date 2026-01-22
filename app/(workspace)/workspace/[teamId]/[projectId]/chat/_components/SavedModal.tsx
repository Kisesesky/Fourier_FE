// components/chat/SavedModal.tsx
'use client';

import { useMemo } from "react";
import { useChat } from "@/workspace/chat/_model/store";
import { X, Bookmark, Trash2 } from "lucide-react";

export default function SavedModal({
  open, onOpenChange
}: {
  open: boolean;
  onOpenChange: (v:boolean)=>void;
}) {
  const { me, messages, savedByUser, toggleSave } = useChat();
  const savedIds = savedByUser[me.id] || [];
  const savedMsgs = useMemo(
    () => savedIds.map(id => messages.find(m => m.id === id)).filter(Boolean) as any[],
    [savedIds, messages]
  );

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
          {savedMsgs.map(sm => (
            <div key={sm.id} className="py-3">
              <div className="text-xs text-muted">{new Date(sm.ts).toLocaleString()} · #{sm.channelId}</div>
              <div className="text-sm font-semibold">{sm.author}</div>
              <div className="text-sm mt-1 line-clamp-3">{sm.text}</div>
              <div className="mt-2 flex items-center gap-2">
                <button
                  className="px-2 py-1 text-xs rounded border border-border hover:bg-subtle/60 inline-flex items-center gap-1"
                  onClick={()=> document.getElementById(sm.id)?.scrollIntoView({ behavior: "smooth", block: "center" })}
                ><Bookmark size={12}/> Jump</button>
                <button
                  className="px-2 py-1 text-xs rounded border border-border hover:bg-subtle/60 inline-flex items-center gap-1"
                  onClick={()=> toggleSave(sm.id)}
                ><Trash2 size={12}/> Unsave</button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 text-right">
          <button className="text-xs px-3 py-1 rounded border border-border hover:bg-subtle/60" onClick={()=> onOpenChange(false)}>닫기</button>
        </div>
      </div>
    </div>
  );
}
