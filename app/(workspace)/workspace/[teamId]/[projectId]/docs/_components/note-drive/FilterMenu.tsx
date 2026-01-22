'use client';

import { useEffect, useState } from 'react';
import { Filter, Check } from 'lucide-react';
import clsx from 'clsx';

import { MENU_ATTR } from './utils';

type FilterMenuProps = {
  selections: Record<string, string>;
  options: Record<string, { value: string; label: string }[]>;
  onChange: (id: string, value: string) => void;
};

export function FilterMenu({ selections, options, onChange }: FilterMenuProps) {
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
    <div className="relative" {...MENU_ATTR}>
      <button
        className={clsx(
          'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition',
          open ? 'border-foreground text-foreground' : 'border-border text-muted hover:text-foreground'
        )}
        onClick={() => setOpen((prev) => !prev)}
      >
        <Filter size={14} />
        필터
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-30 w-60 rounded-2xl border border-border bg-panel p-3 text-sm shadow-2xl">
          <div className="space-y-3">
            {Object.keys(options).map((key) => (
              <div key={key}>
                <p className="text-xs font-semibold text-muted">{key}</p>
                <div className="mt-2 space-y-1">
                  {options[key].map((option) => (
                    <button
                      key={option.value}
                      className={clsx(
                        'flex w-full items-center justify-between rounded-lg px-2 py-1 text-left text-xs transition',
                        selections[key] === option.value ? 'bg-subtle/60 text-foreground' : 'text-muted hover:bg-subtle/40'
                      )}
                      onClick={() => onChange(key, option.value)}
                    >
                      <span>{option.label}</span>
                      {selections[key] === option.value && <Check size={12} />}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
