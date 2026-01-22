// components/layout/AppShell.tsx
'use client';

import React from 'react';
import clsx from 'clsx';

type AppShellProps = {
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  children: React.ReactNode;
  rightPanel?: React.ReactNode | null;
  rightWidth?: number;
  className?: string;
  mainScrollable?: boolean;
  sidebarWidth?: number;
};

export default function AppShell({
  sidebar,
  header,
  children,
  rightPanel = null,
  rightWidth = 360,
  className,
  mainScrollable = true,
  sidebarWidth = 288,
}: AppShellProps) {
  const hasRight = !!rightPanel;

  return (
    <div
      className={clsx(
        'flex h-screen w-full flex-col overflow-hidden bg-background text-foreground',
        className
      )}
    >
      {header && (
        <div className="sticky top-0 z-40 h-14 shrink-0 border-b border-border bg-panel shadow-panel">
          {header}
        </div>
      )}

      <div className="flex flex-1 min-h-0 flex-col overflow-hidden md:flex-row">
        {sidebar && (
          <aside
            className="hidden shrink-0 min-h-0 overflow-y-auto border-r border-border bg-panel shadow-panel md:flex md:flex-col"
            style={{ width: sidebarWidth }}
          >
            {sidebar}
          </aside>
        )}

        <div
          className={clsx(
            'flex min-h-0 min-w-0 flex-1 flex-col',
            hasRight && 'md:grid md:grid-cols-[minmax(0,1fr)_auto]'
          )}
          style={hasRight ? { gridTemplateColumns: `minmax(0, 1fr) ${rightWidth}px` } : undefined}
        >
          <main
            className={clsx(
              'flex min-h-0 min-w-0 flex-1 flex-col',
              mainScrollable ? 'overflow-y-auto' : 'overflow-hidden'
            )}
          >
            {children}
          </main>

          {hasRight && (
            <aside
              className="hidden min-h-0 overflow-y-auto border-l border-border bg-panel shadow-panel md:block"
              style={{ width: rightWidth }}
            >
              {rightPanel}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
