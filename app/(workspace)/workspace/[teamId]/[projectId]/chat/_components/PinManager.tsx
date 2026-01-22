// components/chat/PinManager.tsx
'use client';

import { useMemo } from "react";
import { useChat } from "@/workspace/chat/_model/store";
import { X, Pin, Trash2 } from "lucide-react";

export default function PinManager({
  open, onOpenChange
}: {
  open: boolean;
  onOpenChange: (v:boolean)=>void;
}) {
  const { channelId, messages, pinnedByChannel, togglePin } = useChat();
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
          {pinMsgs.map(pm => (
            <div key={pm.id} className="py-3 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-subtle/80 border border-border flex items-center justify-center text-[10px]">{pm.author[0]}</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted">{new Date(pm.ts).toLocaleString()}</div>
                <div className="text-sm">{pm.author}</div>
                <div className="text-sm mt-1 line-clamp-3">{pm.text}</div>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    className="px-2 py-1 text-xs rounded border border-border hover:bg-subtle/60 inline-flex items-center gap-1"
                    onClick={()=> document.getElementById(pm.id)?.scrollIntoView({ behavior: "smooth", block: "center" })}
                  ><Pin size={12}/> Jump</button>
                  <button
                    className="px-2 py-1 text-xs rounded border border-border hover:bg-subtle/60 inline-flex items-center gap-1"
                    onClick={()=> togglePin(pm.id)}
                  ><Trash2 size={12}/> Unpin</button>
                </div>
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
