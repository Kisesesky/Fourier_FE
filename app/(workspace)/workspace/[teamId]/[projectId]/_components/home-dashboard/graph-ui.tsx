// app/(workspace)/workspace/[teamId]/[projectId]/_components/home-dashboard/graph-ui.tsx
'use client';

import type { ComponentType } from 'react';
import type { GraphMode } from '../../_model/dashboard-page.types';

export const renderBars = (values: number[], height = 80) => {
  const max = Math.max(...values, 1);
  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-[360px] items-end gap-1"
        style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))` }}
      >
        {values.map((value, idx) => (
          <div key={idx} className="group relative flex w-full flex-col items-center">
            <div
              className={`w-full rounded-none bg-sky-400/90 ${value > 0 ? 'opacity-100' : 'opacity-0'}`}
              style={{ height: value > 0 ? `${Math.round((value / max) * height)}px` : '0px' }}
              title={value > 0 ? `${value}` : ''}
            />
            {value > 0 && (
              <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded-full border border-border bg-panel px-2 py-0.5 text-[10px] text-muted opacity-0 transition-opacity group-hover:opacity-100">
                {value}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const renderGraphTabs = (mode: GraphMode, setMode: (value: GraphMode) => void) => (
  <div className="inline-flex w-full max-w-[240px] justify-between rounded-full border border-border bg-panel p-1 text-[11px] text-muted">
    {([
      { key: 'hourly', label: '시간대' },
      { key: 'daily', label: '일별' },
      { key: 'monthly', label: '월별' },
    ] as const).map((item) => (
      <button
        key={item.key}
        type="button"
        className={`rounded-full px-3 py-2 transition ${mode === item.key ? 'bg-accent text-foreground' : 'hover:text-foreground'}`}
        onClick={() => setMode(item.key)}
      >
        {item.label}
      </button>
    ))}
  </div>
);

export const renderDetailTabs = <T extends string>(
  current: T,
  setCurrent: (value: T) => void,
  tabs: Array<{ key: T; label: string; icon?: ComponentType<{ size?: string | number }> }>
) => (
  <div className="inline-flex flex-wrap items-center gap-2 rounded-xl border border-border bg-panel p-1">
    {tabs.map((tab) => {
      const Icon = tab.icon;
      return (
        <button
          key={tab.key}
          type="button"
          onClick={() => setCurrent(tab.key)}
          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs transition ${current === tab.key ? 'bg-accent text-foreground' : 'text-muted hover:text-foreground'}`}
        >
          {Icon ? <Icon size={13} /> : null}
          {tab.label}
        </button>
      );
    })}
  </div>
);

export const renderGraphFilter = (
  mode: GraphMode,
  filter: { day: string; month: string; year: string },
  setFilter: (next: { day: string; month: string; year: string }) => void
) => {
  const sizeClass = 'w-full max-w-[240px] rounded-full border border-border bg-panel px-3 py-2 text-[11px] text-muted text-center';
  if (mode === 'hourly') {
    return (
      <input
        type="date"
        value={filter.day}
        onChange={(e) => setFilter({ ...filter, day: e.target.value })}
        className={sizeClass}
      />
    );
  }
  if (mode === 'daily') {
    return (
      <input
        type="month"
        value={filter.month}
        onChange={(e) => setFilter({ ...filter, month: e.target.value })}
        className={sizeClass}
      />
    );
  }
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, idx) => String(currentYear - idx));
  return (
    <select
      value={filter.year}
      onChange={(e) => setFilter({ ...filter, year: e.target.value })}
      className={`${sizeClass} pr-8`}
    >
      {years.map((y) => (
        <option key={y} value={y}>
          {y}년
        </option>
      ))}
    </select>
  );
};

export const renderRangeLabels = (mode: GraphMode, count: number) => {
  const pad2 = (value: number) => String(value).padStart(2, '0');
  const items =
    mode === 'hourly'
      ? Array.from({ length: 24 }, (_, idx) => `${pad2(idx)}`)
      : mode === 'daily'
      ? Array.from({ length: count }, (_, idx) => `${pad2(idx + 1)}`)
      : Array.from({ length: 12 }, (_, idx) => `${idx + 1}`);
  return (
    <div className="mt-3 overflow-x-auto">
      <div
        className="grid min-w-[360px] text-[9px] text-muted"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`, gap: '4px' }}
      >
        {items.map((label) => (
          <span key={label} className="text-center">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

export const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};
