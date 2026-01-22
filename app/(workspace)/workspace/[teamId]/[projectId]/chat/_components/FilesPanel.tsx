// components/chat/FilesPanel.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { useChat } from '@/workspace/chat/_model/store';
import { Image as ImageIcon, FileText, Film, MessageSquare } from 'lucide-react';

type Tab = 'images'|'docs'|'media';

export default function FilesPanel() {
  const { messages } = useChat();
  const [tab, setTab] = useState<Tab>('images');

  const items = useMemo(() => {
    const out: { id:string; ts:number; author:string; channelId:string; name:string; type:string }[] = [];
    for (const m of messages) {
      for (const a of (m.attachments || [])) {
        if (tab === 'images' && !a.type.startsWith('image/')) continue;
        if (tab === 'media' && !a.type.startsWith('video/')) continue;
        if (tab === 'docs' && (a.type.startsWith('image/') || a.type.startsWith('video/'))) continue;
        out.push({ id: m.id, ts: m.ts, author: m.author, channelId: m.channelId, name: a.name, type: a.type });
      }
    }
    return out.sort((a,b)=> b.ts - a.ts);
  }, [messages, tab]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-3 py-2 border-b border-border flex items-center gap-1">
        <button className={`px-2 py-1 text-xs rounded border ${tab==='images'?'bg-subtle/60 border-border':'border-transparent hover:border-border'}`} onClick={()=> setTab('images')}>
          Images
        </button>
        <button className={`px-2 py-1 text-xs rounded border ${tab==='docs'?'bg-subtle/60 border-border':'border-transparent hover:border-border'}`} onClick={()=> setTab('docs')}>
          Docs
        </button>
        <button className={`px-2 py-1 text-xs rounded border ${tab==='media'?'bg-subtle/60 border-border':'border-transparent hover:border-border'}`} onClick={()=> setTab('media')}>
          Media
        </button>
      </div>
      <div className="p-3 space-y-2 overflow-y-auto">
        {items.length === 0 && <div className="text-sm text-muted">No files.</div>}
        {items.map(it => (
          <div key={`${it.id}-${it.name}`} className="rounded-md border border-border p-2 text-sm bg-panel">
            <div className="flex items-center gap-2 text-xs text-muted">
              <span>{it.author}</span>
              <span>·</span>
              <span>{new Date(it.ts).toLocaleString()}</span>
              <span className="ml-auto inline-flex items-center gap-1">
                {it.type.startsWith('image/') && <><ImageIcon size={12}/> image</>}
                {it.type.startsWith('video/') && <><Film size={12}/> media</>}
                {!it.type.startsWith('image/') && !it.type.startsWith('video/') && <><FileText size={12}/> doc</>}
              </span>
            </div>
            <div className="mt-1 line-clamp-1">{it.name}</div>
            <div className="mt-2">
              <button
                className="px-2 py-1 text-xs rounded border border-border hover:bg-subtle/60 inline-flex items-center gap-1"
                onClick={()=> document.getElementById(it.id)?.scrollIntoView({ behavior: "smooth", block: "center" })}
              ><MessageSquare size={12}/> Jump</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
