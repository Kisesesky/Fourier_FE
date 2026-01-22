// components/issues/SprintStats.tsx
'use client';

import React from "react";

type PointDay = { date: string; remaining: number; baseline: number };

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

export default function SprintStats({
  totalPoints,
  donePoints,
  completedDates,
  days = 7
}: {
  totalPoints: number;
  donePoints: number;
  completedDates: { date: string; points: number }[];
  days?: number;
}) {
  const remaining = Math.max(0, totalPoints - donePoints);

  const today = new Date();
  const dates: string[] = [];
  for (let i = days-1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(formatDate(d));
  }

  const completeMap = new Map<string, number>();
  completedDates.forEach(({date, points}) => {
    completeMap.set(date, (completeMap.get(date) || 0) + (points || 0));
  });

  let cumDone = 0;
  const series: PointDay[] = dates.map((date, idx) => {
    cumDone += completeMap.get(date) || 0;
    const rem = Math.max(0, totalPoints - cumDone);
    const baseline = Math.max(0, totalPoints - Math.round((totalPoints/(days-1 || 1)) * idx));
    return { date, remaining: rem, baseline };
  });

  const W = 220, H = 54, P = 4;
  const maxY = Math.max(totalPoints, ...series.map(s=>Math.max(s.remaining, s.baseline)), 1);
  const x = (i:number) => P + (W-2*P) * (i/(series.length-1 || 1));
  const y = (v:number) => H - P - (H-2*P) * (v/maxY);
  const path = (vals:number[]) => vals.map((v,i)=> `${i===0?'M':'L'} ${x(i).toFixed(2)} ${y(v).toFixed(2)}`).join(' ');
  const actualPath = path(series.map(s=>s.remaining));
  const basePath   = path(series.map(s=>s.baseline));

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-4 px-3 py-2 rounded-md border border-border bg-subtle/30">
        <div className="text-xs text-muted">Total</div>
        <div className="font-semibold">{totalPoints}</div>
        <div className="text-xs text-muted">Done</div>
        <div className="font-semibold">{donePoints}</div>
        <div className="text-xs text-muted">Remain</div>
        <div className="font-semibold">{remaining}</div>
      </div>
      <svg width={W} height={H} className="rounded-md border border-border bg-subtle/20">
        <path d={basePath} fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1" />
        <path d={actualPath} fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
}
