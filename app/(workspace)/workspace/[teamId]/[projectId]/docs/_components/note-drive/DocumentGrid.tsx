'use client';

import { Star } from 'lucide-react';
import clsx from 'clsx';

import type { DocMeta } from '@/workspace/docs/_model/docs';
import { relativeTime } from './utils';

type DocumentGridProps = {
  docs: DocMeta[];
  onOpen: (doc: DocMeta) => void;
  onToggleStar: (doc: DocMeta) => void;
};

export function DocumentGrid({ docs, onOpen, onToggleStar }: DocumentGridProps) {
  if (!docs.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border px-6 py-10 text-sm text-muted">
        <p>표시할 문서가 없습니다.</p>
        <p className="text-xs">새 노트를 작성하거나 필터를 조정해 보세요.</p>
      </div>
    );
  }

  return (
    <div className="grid flex-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
      {docs.map((doc) => (
        <button
          key={doc.id}
          className="group flex flex-col rounded-2xl border border-border bg-background/60 p-4 text-left transition hover:border-foreground/50 hover:shadow-lg"
          onClick={() => onOpen(doc)}
        >
          <div className="flex items-center justify-between">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-lg"
              style={{ backgroundColor: doc.color || 'var(--border)' }}
            >
              {doc.icon || '📄'}
            </div>
            <button
              type="button"
              className={clsx(
                'rounded-full border px-2 py-1 text-xs transition',
                doc.starred ? 'border-yellow-500 text-yellow-500' : 'border-border text-muted hover:text-yellow-500'
              )}
              onClick={(event) => {
                event.stopPropagation();
                onToggleStar(doc);
              }}
            >
              <Star size={14} fill={doc.starred ? 'currentColor' : 'none'} />
            </button>
          </div>
          <p className="mt-4 truncate text-sm font-semibold">{doc.title}</p>
          <p className="text-xs text-muted">{doc.description || '설명이 없습니다.'}</p>
          <div className="mt-4 flex items-center justify-between text-xs text-muted">
            <span>{relativeTime(doc.updatedAt)}</span>
            <span className="inline-flex items-center gap-1.5">
              {doc.ownerAvatarUrl ? (
                <img
                  src={doc.ownerAvatarUrl}
                  alt={doc.owner}
                  className="h-4 w-4 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-foreground">
                  {doc.owner.slice(0, 1)}
                </span>
              )}
              <span>{doc.owner}</span>
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
