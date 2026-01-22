// components/chat/CodeFencePreview.tsx
'use client';

import React from "react";
import { Copy } from "lucide-react";

export type Fence = { lang?: string; code: string };

export function extractFences(text?: string): Fence[] {
  if (!text) return [];
  const re = /```([a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g;
  const out: Fence[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    out.push({ lang: (m[1] || '').trim() || undefined, code: m[2] || '' });
  }
  return out;
}

export default function CodeFencePreview({ fences }: { fences: Fence[] }) {
  if (fences.length === 0) return null;

  const copy = async (s: string) => {
    await navigator.clipboard.writeText(s);
  };

  return (
    <div className="mt-2 space-y-2">
      {fences.map((f, i) => (
        <div key={i} className="rounded-md border border-border overflow-hidden bg-subtle/30">
          <div className="px-2 py-1 text-xs border-b border-border flex items-center justify-between">
            <span className="opacity-80">{f.lang || 'code'}</span>
            <button className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-border hover:bg-subtle/60"
                    onClick={()=> copy(f.code)} title="Copy">
              <Copy size={12}/> Copy
            </button>
          </div>
          <pre className="p-2 text-xs overflow-auto"><code>{f.code}</code></pre>
        </div>
      ))}
    </div>
  );
}
