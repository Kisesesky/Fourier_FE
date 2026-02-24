// app/(workspace)/workspace/[teamId]/[projectId]/issues/_components/views/timeline/TimelineTooltip.tsx
'use client';

import type { Issue } from "@/workspace/issues/_model/types";

const PRIORITY_BADGE_STYLE: Record<Issue["priority"], string> = {
  very_low: "bg-slate-500 text-slate-100",
  low: "bg-sky-500 text-sky-100",
  medium: "bg-amber-500 text-amber-100",
  high: "bg-orange-500 text-orange-100",
  urgent: "bg-rose-500 text-rose-100",
};

const STATUS_BADGE_STYLE: Record<Issue["status"], string> = {
  backlog: "bg-slate-500 text-slate-100",
  todo: "bg-rose-500 text-rose-100",
  in_progress: "bg-amber-500 text-amber-100",
  review: "bg-violet-500 text-violet-100",
  done: "bg-emerald-500 text-emerald-100",
};

export default function TimelineTooltip({
  hoveredIssue,
}: {
  hoveredIssue: {
    title: string;
    range: string;
    assignee: string;
    priorityKey: Issue["priority"];
    priority: string;
    statusKey: Issue["status"];
    status: string;
    avatarUrl?: string | null;
    x: number;
    y: number;
  } | null;
}) {
  if (!hoveredIssue) return null;
  const offset = 12;
  const width = 280;
  const height = 168;
  const maxX = typeof window !== "undefined" ? window.innerWidth : 0;
  const maxY = typeof window !== "undefined" ? window.innerHeight : 0;
  const left = maxX ? Math.min(hoveredIssue.x + offset, maxX - width - 8) : hoveredIssue.x + offset;
  const top = maxY ? Math.min(hoveredIssue.y + offset, maxY - height - 8) : hoveredIssue.y + offset;
  return (
    <div
      className="fixed z-[60] w-72 rounded-lg border border-border bg-panel px-3 py-2 text-[11px] text-foreground shadow-lg"
      style={{ left, top }}
    >
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-subtle px-2 py-0.5 text-[10px] font-semibold text-muted">업무명</span>
        <span className="truncate font-semibold">{hoveredIssue.title}</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="rounded-full bg-subtle px-2 py-0.5 text-[10px] font-semibold text-muted">날짜</span>
        <span className="text-muted">{hoveredIssue.range}</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="rounded-full bg-subtle px-2 py-0.5 text-[10px] font-semibold text-muted">담당자</span>
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 overflow-hidden rounded-full border border-border bg-subtle/60">
            {hoveredIssue.avatarUrl ? (
              <img src={hoveredIssue.avatarUrl} alt={hoveredIssue.assignee} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[10px] text-muted">
                {hoveredIssue.assignee.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <span className="text-foreground">{hoveredIssue.assignee}</span>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="rounded-full bg-subtle px-2 py-0.5 text-[10px] font-semibold text-muted">우선순위</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${PRIORITY_BADGE_STYLE[hoveredIssue.priorityKey]}`}>
          {hoveredIssue.priority}
        </span>
        <span className="rounded-full bg-subtle px-2 py-0.5 text-[10px] font-semibold text-muted">상태</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE_STYLE[hoveredIssue.statusKey]}`}>
          {hoveredIssue.status}
        </span>
      </div>
    </div>
  );
}
