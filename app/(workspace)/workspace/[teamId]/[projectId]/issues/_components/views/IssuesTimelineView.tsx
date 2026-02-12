// app/(workspace)/workspace/[teamId]/[projectId]/issues/_components/views/IssuesTimelineView.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { addDays, addMonths, format, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { Issue, IssueGroup } from "@/workspace/issues/_model/types";
import TimelineGroup from "@/workspace/issues/_components/views/timeline/TimelineGroup";
import TimelineTooltip from "@/workspace/issues/_components/views/timeline/TimelineTooltip";

export default function IssuesTimelineView({
  issues,
  memberMap,
  groupFilter,
}: {
  issues: Issue[];
  memberMap: Record<string, { name: string; avatarUrl?: string | null }>;
  groupFilter?: Record<string, boolean>;
}) {
  const [hoveredIssue, setHoveredIssue] = useState<{
    title: string;
    range: string;
    assignee: string;
    avatarUrl?: string | null;
    x: number;
    y: number;
  } | null>(null);
  const [dayWidth, setDayWidth] = useState(56);
  const [rowHeight, setRowHeight] = useState(48);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedWeek, setSelectedWeek] = useState<number | "all">("all");
  const [isMobile, setIsMobile] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const timelineViewportRef = useRef<HTMLDivElement | null>(null);

  const parseTimelineDate = (value: string, isEnd: boolean) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split("-").map(Number);
      return new Date(y, (m ?? 1) - 1, d ?? 1, isEnd ? 23 : 0, isEnd ? 59 : 0, isEnd ? 59 : 0, isEnd ? 999 : 0);
    }
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      const raw = new Date(value);
      if (Number.isNaN(raw.getTime())) return null;
      if (value.endsWith("Z")) {
        const yyyy = raw.getUTCFullYear();
        const mm = raw.getUTCMonth();
        const dd = raw.getUTCDate();
        return new Date(yyyy, mm, dd, isEnd ? 23 : 0, isEnd ? 59 : 0, isEnd ? 59 : 0, isEnd ? 999 : 0);
      }
      const yyyy = raw.getFullYear();
      const mm = raw.getMonth();
      const dd = raw.getDate();
      return new Date(yyyy, mm, dd, isEnd ? 23 : 0, isEnd ? 59 : 0, isEnd ? 59 : 0, isEnd ? 999 : 0);
    }
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return null;
    if (isEnd) dt.setHours(23, 59, 59, 999);
    else dt.setHours(0, 0, 0, 0);
    return dt;
  };

  const groupPalette = ["#f87171", "#60a5fa", "#fbbf24", "#a78bfa", "#34d399"];
  const monthStart = useMemo(
    () => new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1),
    [selectedMonth],
  );
  const monthEnd = useMemo(
    () => new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0, 23, 59, 59, 999),
    [selectedMonth],
  );
  const monthTotalDays = useMemo(
    () => Math.ceil((monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1,
    [monthEnd, monthStart],
  );
  const monthWeekCount = useMemo(() => Math.ceil(monthTotalDays / 7), [monthTotalDays]);

  useEffect(() => {
    if (selectedWeek === "all") return;
    if (selectedWeek > monthWeekCount) setSelectedWeek("all");
  }, [monthWeekCount, selectedWeek]);

  const timelineStart = useMemo(() => {
    if (selectedWeek === "all") return monthStart;
    return addDays(monthStart, (selectedWeek - 1) * 7);
  }, [monthStart, selectedWeek]);
  const timelineEnd = useMemo(() => {
    if (selectedWeek === "all") return monthEnd;
    const rangeEnd = addDays(timelineStart, 6);
    return rangeEnd > monthEnd ? monthEnd : rangeEnd;
  }, [monthEnd, selectedWeek, timelineStart]);

  const days = useMemo(() => {
    const total = Math.ceil((timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Array.from({ length: total }, (_, idx) => addDays(timelineStart, idx).getDate());
  }, [timelineEnd, timelineStart]);

  const weekSegments = useMemo(() => {
    if (selectedWeek !== "all") {
      return [{ key: `w-${selectedWeek}`, label: `${selectedWeek}주차`, span: days.length }];
    }
    return Array.from({ length: monthWeekCount }, (_, idx) => {
      const start = idx * 7;
      const span = Math.min(7, Math.max(0, monthTotalDays - start));
      return {
        key: `w-${idx + 1}`,
        label: `${idx + 1}주차`,
        span,
      };
    }).filter((segment) => segment.span > 0);
  }, [days.length, monthTotalDays, monthWeekCount, selectedWeek]);

  const issuesByGroup = useMemo(() => {
    const map = new Map<string, { name: string; color: string; items: Issue[] }>();
    const flat: Issue[] = [];
    const seen = new Set<string>();
    const groupById = new Map<string, IssueGroup>();
    const issueById = new Map<string, Issue>();
    const walk = (items: Issue[]) => {
      items.forEach((item) => {
        if (!seen.has(item.id)) {
          flat.push(item);
          seen.add(item.id);
          issueById.set(item.id, item);
        }
        if (item.group) {
          groupById.set(item.id, item.group);
        }
        if (item.subtasks?.length) walk(item.subtasks);
      });
    };
    walk(issues);

    flat.forEach((issue) => {
      let inheritedGroup: IssueGroup | undefined = issue.group;
      let cursorId = issue.parentId ?? null;
      while (!inheritedGroup && cursorId) {
        const cursor = issueById.get(cursorId);
        if (!cursor) break;
        if (cursor.group) {
          inheritedGroup = cursor.group;
          break;
        }
        cursorId = cursor.parentId ?? null;
      }
      if (!issue.group && inheritedGroup) {
        groupById.set(issue.id, inheritedGroup);
      }
      const key = inheritedGroup?.id ?? issue.group?.id ?? "ungrouped";
      if (!map.has(key)) {
        const idx = map.size % groupPalette.length;
        map.set(key, {
          name: inheritedGroup?.name ?? issue.group?.name ?? "미분류",
          color: inheritedGroup?.color ?? issue.group?.color ?? groupPalette[idx],
          items: [],
        });
      }
      map.get(key)!.items.push(issue);
    });
    return Array.from(map.entries());
  }, [issues]);

  const filteredGroups = useMemo(() => {
    if (!groupFilter) return issuesByGroup;
    return issuesByGroup.filter(([groupId]) => groupFilter[groupId] !== false);
  }, [groupFilter, issuesByGroup]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setRowHeight(mobile ? 42 : 48);
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const target = timelineViewportRef.current;
    if (!target) return;
    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect?.width ?? 0;
      setContainerWidth(next);
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const dayMs = 24 * 60 * 60 * 1000;
  const toLocalDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = (date: Date, start: Date) =>
    Math.floor((toLocalDay(date).getTime() - toLocalDay(start).getTime()) / dayMs);

  useEffect(() => {
    const base = isMobile ? 44 : 56;
    if (selectedWeek === "all" || !containerWidth) {
      setDayWidth(base);
      return;
    }
    const leftPanelWidth = isMobile ? 128 : 160;
    const available = Math.max(0, containerWidth - leftPanelWidth - 2);
    const fit = Math.floor(available / Math.max(days.length, 1));
    const min = isMobile ? 36 : 44;
    setDayWidth(Math.max(min, fit));
  }, [containerWidth, days.length, isMobile, selectedWeek]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mb-3 rounded-xl border border-border bg-panel/60 px-3 py-2">
        <div className="mb-2 flex items-center justify-center gap-2 text-sm font-semibold text-foreground">
          <button
            type="button"
            onClick={() => setSelectedMonth((prev) => subMonths(prev, 1))}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-panel text-muted hover:bg-accent"
            aria-label="이전 달"
          >
            <ChevronLeft size={14} />
          </button>
          <span>{format(selectedMonth, "yyyy.MM")}</span>
          <button
            type="button"
            onClick={() => setSelectedMonth((prev) => addMonths(prev, 1))}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-panel text-muted hover:bg-accent"
            aria-label="다음 달"
          >
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedWeek("all")}
            className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
              selectedWeek === "all" ? "border-brand/60 bg-brand/15 text-brand" : "border-border/70 bg-panel text-muted"
            }`}
          >
            전체
          </button>
          {Array.from({ length: monthWeekCount }, (_, idx) => idx + 1).map((weekNo) => (
            <button
              key={weekNo}
              type="button"
              onClick={() => setSelectedWeek(weekNo)}
              className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                selectedWeek === weekNo ? "border-brand/60 bg-brand/15 text-brand" : "border-border/70 bg-panel text-muted"
              }`}
            >
              {weekNo}주차
            </button>
          ))}
        </div>
      </div>
      <div ref={timelineViewportRef} className="flex-1 min-h-0 overflow-auto space-y-4 pb-2">
        {filteredGroups.map(([groupId, group]) => (
          <TimelineGroup
            key={groupId}
            groupId={groupId}
            group={group}
            memberMap={memberMap}
            days={days}
            weekSegments={weekSegments}
            dayWidth={dayWidth}
            rowHeight={rowHeight}
            timelineStart={timelineStart}
            timelineEnd={timelineEnd}
            parseTimelineDate={parseTimelineDate}
            diffDays={diffDays}
            setHoveredIssue={setHoveredIssue}
          />
        ))}
      </div>
      <TimelineTooltip hoveredIssue={hoveredIssue} />
    </div>
  );
}
