'use client';

import { useEffect, useState } from 'react';
import { ArrowUpDown, Check } from 'lucide-react';
import clsx from 'clsx';

import { MENU_ATTR } from './utils';
import type { SortKey } from './DocumentTable';

type SortMenuProps = {
  sortKey: SortKey;
  sortDir: 'asc' | 'desc';
  onChange: (key: SortKey) => void;
  onToggleDir: () => void;
};

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'title', label: '이름' },
  { key: 'owner', label: '소유자' },
  { key: 'updatedAt', label: '수정 날짜' },
  { key: 'size', label: '파일 크기' },
];

export function SortMenu({ sortKey, sortDir, onChange, onToggleDir }: SortMenuProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!(event.target as HTMLElement | null)?.closest('[data-doc-menu="true"]')) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div className="relative flex items-center gap-2" {...MENU_ATTR}>
      <button
        className={clsx(
          'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs',
          'border-border text-muted hover:text-foreground'
        )}
        onClick={() => setOpen((prev) => !prev)}
      >
        <ArrowUpDown size={14} />
        정렬: {SORT_OPTIONS.find((opt) => opt.key === sortKey)?.label}
      </button>
      <button
        className="rounded-full border border-border p-2 text-muted transition hover:text-foreground"
        onClick={onToggleDir}
        title="정렬 방향"
      >
        {sortDir === 'asc' ? '⬆' : '⬇'}
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-20 w-40 rounded-xl border border-border bg-panel text-sm shadow-xl">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.key}
              className={clsx(
                'flex w-full items-center justify-between px-3 py-2 text-left hover:bg-subtle/60',
                option.key === sortKey ? 'text-foreground' : 'text-muted'
              )}
              onClick={() => {
                onChange(option.key);
                setOpen(false);
              }}
            >
              <span>{option.label}</span>
              {option.key === sortKey && <Check size={12} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
