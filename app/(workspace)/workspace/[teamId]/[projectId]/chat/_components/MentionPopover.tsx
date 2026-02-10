// app/(workspace)/workspace/[teamId]/[projectId]/chat/_components/MentionPopover.tsx
'use client';

import React, { useEffect, useRef } from 'react';

export type SuggestItem = { id: string; name: string };

export default function MentionPopover({
  open, x, y, items, activeIndex, onPick, onClose
}: {
  open: boolean;
  x: number;
  y: number;
  items: SuggestItem[];
  activeIndex: number;
  onPick: (u: SuggestItem) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose} onContextMenu={(e)=>e.preventDefault()}>
      <div className="absolute inset-0" />
      <div
        ref={ref}
        className="absolute z-50 w-56 rounded-md border border-border bg-panel shadow-panel p-1"
        style={{ left: Math.max(8, Math.min(x, window.innerWidth - 240)), top: Math.max(8, Math.min(y, window.innerHeight - 280)) }}
        onClick={(e)=> e.stopPropagation()}
      >
        {items.length === 0 && (
          <div className="px-2 py-1.5 text-xs text-muted">No users</div>
        )}
        {items.map((u, i) => (
          <button
            key={u.id}
            className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-subtle/60 ${i===activeIndex ? 'bg-subtle/60' : ''}`}
            onClick={()=> onPick(u)}
          >
            <div className="w-6 h-6 rounded-full bg-subtle/70 border border-border text-[10px] flex items-center justify-center">
              {u.name.split(/\s+/).map(s=>s[0]).join('').slice(0,2).toUpperCase()}
            </div>
            {u.name}
          </button>
        ))}
      </div>
    </div>
  );
}
