// app/(workspace)/workspace/[teamId]/[projectId]/docs/_components/note-drive/SortMenu.tsx
'use client';

import { useEffect, useState } from 'react';
import { ArrowUpDown, Check } from 'lucide-react';
import clsx from 'clsx';

import { DOCS_SORT_OPTIONS } from "@/workspace/docs/_model/view.constants";
import { MENU_ATTR } from "@/workspace/docs/_model/utils/noteDriveViewUtils";
import type { DocsSortKey } from "@/workspace/docs/_model/view.types";

type SortMenuProps = {
  sortKey: DocsSortKey;
  sortDir: 'asc' | 'desc';
  onChange: (key: DocsSortKey) => void;
  onToggleDir: () => void;
};

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
        정렬: {DOCS_SORT_OPTIONS.find((opt) => opt.key === sortKey)?.label}
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
          {DOCS_SORT_OPTIONS.map((option) => (
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
