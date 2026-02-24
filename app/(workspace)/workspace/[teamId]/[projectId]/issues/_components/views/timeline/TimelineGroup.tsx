// app/(workspace)/workspace/[teamId]/[projectId]/issues/_components/views/timeline/TimelineGroup.tsx
'use client';

import { useEffect, useRef, useState } from "react";
import type React from "react";
import type { Issue } from "@/workspace/issues/_model/types";
import { formatIssueDateRange } from "@/workspace/issues/_model/utils/issueViewUtils";

type TimelineBarColorMode = "group" | "priority" | "status";

const PRIORITY_COLOR: Record<Issue["priority"], string> = {
  very_low: "#64748b",
  low: "#0ea5e9",
  medium: "#f59e0b",
  high: "#f97316",
  urgent: "#f43f5e",
};

const STATUS_COLOR: Record<Issue["status"], string> = {
  backlog: "#64748b",
  todo: "#f43f5e",
  in_progress: "#f59e0b",
  review: "#8b5cf6",
  done: "#10b981",
};

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

const PRIORITY_LABEL: Record<Issue["priority"], string> = {
  very_low: "매우 낮음",
  low: "낮음",
  medium: "중간",
  high: "높음",
  urgent: "매우 높음",
};

const STATUS_LABEL: Record<Issue["status"], string> = {
  backlog: "백로그",
  todo: "할 일",
  in_progress: "작업 중",
  review: "리뷰 대기",
  done: "완료",
};

const PRIORITY_ORDER: Issue["priority"][] = ["very_low", "low", "medium", "high", "urgent"];
const STATUS_ORDER: Issue["status"][] = ["backlog", "todo", "in_progress", "review", "done"];

export default function TimelineGroup({
  groupId,
  group,
  memberMap,
  days,
  weekSegments,
  dayWidth,
  rowHeight,
  timelineStart,
  timelineEnd,
  parseTimelineDate,
  diffDays,
  setHoveredIssue,
}: {
  groupId: string;
  group: { name: string; color: string; items: Issue[] };
  memberMap: Record<string, { name: string; avatarUrl?: string | null }>;
  days: number[];
  weekSegments: Array<{ key: string; label: string; span: number }>;
  dayWidth: number;
  rowHeight: number;
  timelineStart: Date;
  timelineEnd: Date;
  parseTimelineDate: (value: string, isEnd: boolean) => Date | null;
  diffDays: (date: Date, start: Date) => number;
  setHoveredIssue: React.Dispatch<React.SetStateAction<{
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
  } | null>>;
}) {
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const [scrollSpacer, setScrollSpacer] = useState(0);
  const [barColorMode, setBarColorMode] = useState<TimelineBarColorMode>("group");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const measure = () => {
      const el = scrollAreaRef.current;
      if (!el) return;
      const hasXScroll = el.scrollWidth - el.clientWidth > 1;
      const nativeScrollbarHeight = Math.max(el.offsetHeight - el.clientHeight, 0);
      // Keep left/right rail heights aligned but avoid oversized spacer on non-overlay scrollbars.
      const compensatedHeight = hasXScroll
        ? Math.max(8, nativeScrollbarHeight > 0 ? nativeScrollbarHeight - 2 : 8)
        : 0;
      setScrollSpacer(compensatedHeight);
    };
    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [days.length, dayWidth]);

  const assigneeMap = new Map<string, Issue[]>();
  group.items.forEach((issue) => {
    const key = issue.assigneeId || issue.assignee || "unassigned";
    const list = assigneeMap.get(key) ?? [];
    if (!list.find((item) => item.id === issue.id)) {
      list.push(issue);
      assigneeMap.set(key, list);
    }
  });

  const assigneeRows = Array.from(assigneeMap.entries()).map(([assigneeKey, items]) => {
    const name =
      memberMap[assigneeKey]?.name ||
      items[0]?.assignee ||
      "미지정";
    const avatar = memberMap[assigneeKey]?.avatarUrl ?? null;

    const byId = new Map(items.map((item) => [item.id, item]));
    const children = new Map<string, Issue[]>();
    items.forEach((item) => {
      if (item.parentId && byId.has(item.parentId)) {
        const list = children.get(item.parentId) ?? [];
        list.push(item);
        children.set(item.parentId, list);
      }
    });
    const sortedRoots = items
      .filter((item) => !item.parentId || !byId.has(item.parentId))
      .sort((a, b) => {
        const aStart = parseTimelineDate(a.startAt ?? a.endAt ?? "", false)?.getTime() ?? 0;
        const bStart = parseTimelineDate(b.startAt ?? b.endAt ?? "", false)?.getTime() ?? 0;
        return aStart - bStart;
      });
    const ordered: Issue[] = [];
    const walkOrdered = (root: Issue) => {
      ordered.push(root);
      const kids = (children.get(root.id) ?? []).sort((a, b) => {
        const aStart = parseTimelineDate(a.startAt ?? a.endAt ?? "", false)?.getTime() ?? 0;
        const bStart = parseTimelineDate(b.startAt ?? b.endAt ?? "", false)?.getTime() ?? 0;
        return aStart - bStart;
      });
      kids.forEach(walkOrdered);
    };
    sortedRoots.forEach(walkOrdered);

    return {
      assigneeKey,
      items,
      ordered,
      name,
      avatar,
      totalHeight: Math.max(ordered.length, 1) * rowHeight,
    };
  });

  const gridWidth = days.length * dayWidth;

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-panel/60">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: group.color }} />
          <span>{group.name}</span>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-background p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setBarColorMode("group")}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
              barColorMode === "group"
                ? "bg-slate-700 text-white shadow-[0_1px_6px_rgba(15,23,42,0.35)]"
                : "text-muted hover:bg-subtle/70 hover:text-foreground"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            기본
          </button>
          <button
            type="button"
            onClick={() => setBarColorMode("priority")}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
              barColorMode === "priority"
                ? "bg-amber-500 text-white shadow-[0_1px_6px_rgba(245,158,11,0.35)]"
                : "text-muted hover:bg-subtle/70 hover:text-foreground"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
            우선순위
          </button>
          <button
            type="button"
            onClick={() => setBarColorMode("status")}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
              barColorMode === "status"
                ? "bg-emerald-500 text-white shadow-[0_1px_6px_rgba(16,185,129,0.35)]"
                : "text-muted hover:bg-subtle/70 hover:text-foreground"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            상태
          </button>
        </div>
        </div>
        {barColorMode !== "group" && (
          <div className="mt-2 flex flex-wrap items-center justify-end gap-1.5 text-[10px]">
            {barColorMode === "priority"
              ? PRIORITY_ORDER.map((priority) => (
                  <span
                    key={priority}
                    className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold ${PRIORITY_BADGE_STYLE[priority]}`}
                  >
                    {PRIORITY_LABEL[priority]}
                  </span>
                ))
              : STATUS_ORDER.map((status) => (
                  <span
                    key={status}
                    className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold ${STATUS_BADGE_STYLE[status]}`}
                  >
                    {STATUS_LABEL[status]}
                  </span>
                ))}
          </div>
        )}
      </div>
      <div className="flex min-w-0 overflow-x-hidden">
        <div className="w-32 shrink-0 border-r border-border md:w-40">
          <div className="sticky top-0 z-10 flex h-10 items-center border-b border-border bg-panel/90 px-3 text-[11px] font-semibold text-muted md:h-11 md:px-4 md:text-xs">
            주차
          </div>
          <div className="sticky top-10 z-10 flex h-8 items-center border-b border-border bg-panel/90 px-3 text-[11px] font-semibold text-muted md:top-11 md:h-9 md:px-4 md:text-xs">
            담당자
          </div>
          <div>
            {assigneeRows.map((row, rowIdx) => (
              <div
                key={`${groupId}-${row.assigneeKey}`}
                className={[
                  "flex items-center gap-2 border-b border-border/60 px-3 md:gap-3 md:px-4",
                  rowIdx % 2 === 1 ? "bg-subtle/20" : "",
                ].join(" ")}
                style={{ height: row.totalHeight }}
              >
                {row.avatar ? (
                  <img src={row.avatar} alt={row.name} className="h-8 w-8 rounded-full object-cover md:h-9 md:w-9" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-subtle text-[11px] font-semibold text-muted md:h-9 md:w-9 md:text-xs">
                    {row.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <span className="min-w-0 break-words text-xs font-medium leading-tight md:text-sm">{row.name}</span>
              </div>
            ))}
          </div>
          <div style={{ height: scrollSpacer }} />
        </div>
        <div ref={scrollAreaRef} className="flex-1 min-w-0 overflow-x-auto overflow-y-hidden [scrollbar-gutter:stable]">
          <div style={{ width: gridWidth }}>
            <div className="sticky top-0 z-10 flex h-10 items-center border-b border-border bg-panel/90 text-[11px] font-semibold text-muted md:h-11 md:text-xs">
              {weekSegments.map((week) => (
                <span
                  key={week.key}
                  className="flex items-center justify-center border-r border-border/60 last:border-r-0"
                  style={{ width: dayWidth * week.span }}
                >
                  {week.label}
                </span>
              ))}
            </div>
            <div
              className="sticky top-10 z-10 flex h-8 items-center border-b border-border bg-panel/90 text-[10px] text-muted md:top-11 md:h-9"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(148,163,184,0.2) 1px, transparent 1px)",
                backgroundSize: `${dayWidth}px 100%`,
              }}
            >
              {days.map((day) => (
                <span key={day} className="text-center" style={{ width: dayWidth }}>
                  {day}
                </span>
              ))}
            </div>
            {assigneeRows.map((row, rowIdx) => {
              const byId = new Map(row.items.map((item) => [item.id, item]));
              return (
                <div
                  key={`${groupId}-${row.assigneeKey}-bar`}
                  className={[
                    "relative border-b border-border/60",
                    rowIdx % 2 === 1 ? "bg-subtle/20" : "",
                  ].join(" ")}
                  style={{
                    height: row.totalHeight,
                    backgroundImage:
                      "linear-gradient(to right, rgba(148,163,184,0.2) 1px, transparent 1px)",
                    backgroundSize: `${dayWidth}px 100%`,
                  }}
                >
                  {row.ordered.map((issue, idx) => {
                    if (!issue.startAt && !issue.endAt) return null;
                    const startRaw = issue.startAt ?? issue.endAt;
                    const endRaw = issue.endAt ?? issue.startAt;
                    if (!startRaw || !endRaw) return null;
                    const startDate = parseTimelineDate(startRaw, false);
                    const endDate = parseTimelineDate(endRaw, true);
                    if (!startDate || !endDate) return null;
                    if (endDate.getTime() < timelineStart.getTime()) return null;
                    if (startDate.getTime() > timelineEnd.getTime()) return null;
                    const startIndex = Math.max(0, diffDays(startDate, timelineStart));
                    const endIndex = Math.min(days.length - 1, diffDays(endDate, timelineStart));
                    const leftPx = startIndex * dayWidth;
                    const widthPx = Math.max((endIndex - startIndex + 1) * dayWidth, 4);
                    const getDepth = (item: Issue) => {
                      let depth = 0;
                      let cursor = item.parentId ? byId.get(item.parentId) : undefined;
                      while (cursor) {
                        depth += 1;
                        cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
                      }
                      return depth;
                    };
                    const depth = getDepth(issue);
                    const isSubtask = depth > 0;
                    const isDeepSubtask = depth > 1;
                    const inset = depth ? 6 + Math.min(depth - 1, 2) * 4 : 0;
                    const barWidth = Math.max(widthPx - inset * 2, dayWidth * 0.9);
                    return (
                      <div
                        key={issue.id}
                        className={[
                          "group absolute flex items-center overflow-hidden rounded-xl px-3 text-xs font-semibold text-white shadow-sm leading-none",
                          isSubtask ? "h-6 py-0.5 text-[10px] opacity-95 md:h-7 md:text-[11px]" : "h-9 py-1 md:h-10",
                          isDeepSubtask ? "h-5 text-[9px] opacity-85 md:h-6 md:text-[10px]" : "",
                        ].join(" ")}
                        style={{
                          top: idx * rowHeight + rowHeight / 2,
                          transform: "translateY(-50%)",
                          left: leftPx + inset,
                          width: barWidth,
                          backgroundColor:
                            barColorMode === "priority"
                              ? PRIORITY_COLOR[issue.priority]
                              : barColorMode === "status"
                                ? STATUS_COLOR[issue.status]
                                : group.color,
                        }}
                        onMouseEnter={(e) => {
                          const assignee = issue.assignee ?? "미지정";
                          const avatarUrl =
                            (issue.assigneeId && memberMap[issue.assigneeId]?.avatarUrl) ||
                            Object.values(memberMap).find((m) => m.name === issue.assignee)?.avatarUrl ||
                            null;
                          setHoveredIssue({
                            title: issue.title,
                            range: formatIssueDateRange(issue.startAt, issue.endAt),
                            assignee,
                            priorityKey: issue.priority,
                            priority: PRIORITY_LABEL[issue.priority],
                            statusKey: issue.status,
                            status: STATUS_LABEL[issue.status],
                            avatarUrl,
                            x: e.clientX,
                            y: e.clientY,
                          });
                        }}
                        onMouseMove={(e) => {
                          setHoveredIssue((prev) =>
                            prev
                              ? { ...prev, x: e.clientX, y: e.clientY }
                              : null,
                          );
                        }}
                        onMouseLeave={() => setHoveredIssue(null)}
                      >
                        <span className="truncate text-white/95 drop-shadow-sm">
                          {isSubtask ? `↳ ${issue.title}` : issue.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
            <div style={{ height: scrollSpacer }} />
          </div>
        </div>
      </div>
    </div>
  );
}
