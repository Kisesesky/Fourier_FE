// app/(workspace)/workspace/[teamId]/[projectId]/issues/_components/views/IssuesTimelineView.tsx
'use client';

import { useMemo, useState } from "react";

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
  const timelineStart = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, []);
  const timelineEnd = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }, []);
  const days = useMemo(() => {
    const total = Math.ceil((timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Array.from({ length: total }, (_, idx) => idx + 1);
  }, [timelineEnd, timelineStart]);

  const weeks = useMemo(() => {
    const totalDays = days.length;
    return Array.from({ length: Math.ceil(totalDays / 7) }, (_, idx) => idx);
  }, [days.length]);

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

  const dayWidth = 56;
  const rowHeight = 48;
  const dayMs = 24 * 60 * 60 * 1000;
  const toLocalDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = (date: Date, start: Date) =>
    Math.floor((toLocalDay(date).getTime() - toLocalDay(start).getTime()) / dayMs);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-auto space-y-4 pb-2">
        {filteredGroups.map(([groupId, group]) => (
          <TimelineGroup
            key={groupId}
            groupId={groupId}
            group={group}
            memberMap={memberMap}
            days={days}
            weeks={weeks}
            dayWidth={dayWidth}
            rowHeight={rowHeight}
            timelineStart={timelineStart}
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
