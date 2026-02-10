// app/(workspace)/workspace/[teamId]/[projectId]/chat/_components/Lightbox.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';

export type LightboxItem = {
  id: string;
  kind: 'image' | 'video';
  src: string;
  name?: string;
  mime?: string;
};

type OpenDetail = {
  items: LightboxItem[];
  index: number;
};

export function openLightbox(items: LightboxItem[], index = 0) {
  window.dispatchEvent(new CustomEvent<OpenDetail>('chat:open-lightbox', { detail: { items, index } as any }));
}

export default function LightboxHost() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<LightboxItem[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const { items, index } = (e as CustomEvent<OpenDetail>).detail;
      setItems(items);
      setIdx(Math.max(0, Math.min(items.length - 1, index || 0)));
      setOpen(true);
    };
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'ArrowRight') setIdx(i => Math.min(items.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setIdx(i => Math.max(0, i - 1));
    };
    window.addEventListener('chat:open-lightbox', onOpen as any);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('chat:open-lightbox', onOpen as any);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, items.length]);

  if (!open) return null;
  const cur = items[idx];

  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/80" onClick={() => setOpen(false)} />
      <div className="absolute inset-0 flex flex-col">
        {/* Top Bar */}
        <div className="h-12 px-3 flex items-center gap-2 text-sm text-white/90">
          <button className="p-2 hover:bg-white/10 rounded" onClick={() => setOpen(false)} aria-label="Close">
            <X size={18} />
          </button>
          <div className="truncate">{cur?.name || cur?.src}</div>
          <div className="ml-auto flex items-center gap-2">
            {cur?.src && (
              <a
                className="p-2 hover:bg-white/10 rounded"
                href={cur.src}
                download={cur.name || 'file'}
                target="_blank"
                rel="noreferrer"
                title="다운로드"
              >
                <Download size={18} />
              </a>
            )}
          </div>
        </div>

        {/* Viewer */}
        <div className="flex-1 relative flex items-center justify-center select-none">
          {idx > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
              onClick={() => setIdx(i => Math.max(0, i - 1))}
              aria-label="Prev"
            >
              <ChevronLeft size={22} />
            </button>
          )}
          {cur?.kind === 'image' && (
            <img
              src={cur.src}
              alt={cur.name || 'image'}
              className="max-w-[90vw] max-h-[78vh] rounded shadow-2xl"
            />
          )}
          {cur?.kind === 'video' && (
            <video
              controls
              autoPlay
              className="max-w-[90vw] max-h-[78vh] rounded shadow-2xl bg-black"
              src={cur.src}
            />
          )}
          {idx < items.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
              onClick={() => setIdx(i => Math.min(items.length - 1, i + 1))}
              aria-label="Next"
            >
              <ChevronRight size={22} />
            </button>
          )}
        </div>

        {/* Thumbs */}
        {items.length > 1 && (
          <div className="h-18 px-3 py-2 bg-black/60 overflow-x-auto flex items-center gap-2">
            {items.map((it, i) => (
              <button
                key={it.id}
                onClick={() => setIdx(i)}
                className={`border rounded ${i === idx ? 'border-white' : 'border-white/40'} p-1 bg-black/40`}
                title={it.name || it.src}
              >
                {it.kind === 'image' ? (
                  <img src={it.src} alt={it.name || "thumbnail"} className="h-12 w-12 object-cover rounded" />
                ) : (
                  <div className="h-12 w-12 rounded bg-white/10 grid place-items-center text-white/80 text-[10px]">
                    video
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
