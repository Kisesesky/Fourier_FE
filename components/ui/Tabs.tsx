// components/ui/Tabs.tsx
'use client';

import React from 'react';
import clsx from 'clsx';

export type TabKey = string;

export function Tabs({
  value, onChange, items, className
}: {
  value: TabKey;
  onChange: (v: TabKey) => void;
  items: { key: TabKey; label: string }[];
  className?: string;
}) {
  return (
    <div className={clsx("flex gap-1 border-b border-border px-2", className)}>
      {items.map(it => {
        const active = it.key === value;
        return (
          <button
            key={it.key}
            onClick={() => onChange(it.key)}
            className={clsx(
              "px-3 h-10 text-sm border-b-2",
              active ? "border-foreground font-medium" : "border-transparent text-muted hover:text-foreground"
            )}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
