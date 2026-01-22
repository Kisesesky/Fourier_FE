// components/chat/SearchPanel.tsx
'use client';

import React, { useMemo, useState } from "react";
import { useChat } from "@/workspace/chat/_model/store";
import { Search, Link as LinkIcon, File as FileIcon, MessageSquare } from "lucide-react";

type Kind = "all" | "messages" | "files" | "links";

export default function SearchPanel() {
  const { search } = useChat();
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<Kind>("all");

  const results = useMemo(() => search(q, { kind }), [q, kind, search]);

  return (
    <div className="p-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 opacity-70"/>
          <input
            value={q}
            onChange={(e)=> setQ(e.target.value)}
            placeholder="검색어를 입력하세요"
            className="w-full bg-subtle/60 border border-border rounded pl-7 pr-2 py-1.5 text-sm outline-none"
          />
        </div>
        <select
          value={kind}
          onChange={(e)=> setKind(e.target.value as Kind)}
          className="text-xs bg-subtle/60 border border-border rounded px-2 py-1.5"
        >
          <option value="all">All</option>
          <option value="messages">Messages</option>
          <option value="files">Files</option>
          <option value="links">Links</option>
        </select>
      </div>

      <div className="mt-3 text-xs text-muted">{results.length} results</div>

      <div className="mt-2 space-y-2 max-h-[60vh] overflow-y-auto">
        {results.map(m => {
          const hasFile = (m.attachments || []).length > 0;
          const link = /(https?:\/\/[^\s]+)/i.test(m.text || "");
          return (
            <div key={m.id} className="rounded-md border border-border p-2 text-sm bg-panel">
              <div className="flex items-center gap-2 text-xs text-muted">
                <span>{m.author}</span>
                <span>·</span>
                <span>{new Date(m.ts).toLocaleString()}</span>
                <span className="ml-auto inline-flex items-center gap-1">
                  {hasFile && <><FileIcon size={12}/> file</>}
                  {link && <><LinkIcon size={12}/> link</>}
                </span>
              </div>
              <div className="mt-1 line-clamp-2">{m.text}</div>
              <div className="mt-2">
                <button
                  className="px-2 py-1 text-xs rounded border border-border hover:bg-subtle/60 inline-flex items-center gap-1"
                  onClick={()=> document.getElementById(m.id)?.scrollIntoView({ behavior: "smooth", block: "center" })}
                ><MessageSquare size={12}/> Jump</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
