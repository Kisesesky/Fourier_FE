'use client';

import { Quote } from 'lucide-react';

type ThreadTeaser = {
  author: string;
  excerpt: string;
  repliesCount: number;
};

type ThreadTeaserProps = {
  teaser: ThreadTeaser | null;
  onClose: () => void;
  onOpenThread: () => void;
};

export function ChatThreadTeaser({ teaser, onClose, onOpenThread }: ThreadTeaserProps) {
  if (!teaser) return null;
  return (
    <div className="flex items-center gap-2 border-b border-border bg-subtle/20 px-4 py-2 text-xs">
      <Quote size={14} className="opacity-70" />
      <div className="truncate">
        <span className="font-semibold">{teaser.author}</span> · {teaser.excerpt}
        <span className="ml-2 opacity-70">({teaser.repliesCount} replies)</span>
      </div>
      <button className="ml-auto rounded border border-border px-2 py-0.5 hover:bg-subtle/60" onClick={onClose}>
        닫기
      </button>
      <button className="ml-2 rounded border border-border px-2 py-0.5 hover:bg-subtle/60" onClick={onOpenThread}>
        스레드 열기
      </button>
    </div>
  );
}
