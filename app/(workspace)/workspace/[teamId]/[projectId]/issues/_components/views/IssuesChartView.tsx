"use client";

import { useMemo, useState } from "react";
import { BarChart3, Layers, Users } from "lucide-react";

import type { Issue, IssueGroup } from "@/workspace/issues/_model/types";

type IssuesChartViewProps = {
  issues: Issue[];
  memberMap: Record<string, { name: string; avatarUrl?: string | null }>;
  issueGroups: IssueGroup[];
  loading?: boolean;
};

const STATUS_META: Array<{
  key: Issue["status"];
  label: string;
  bar: string;
}> = [
  { key: "backlog", label: "백로그", bar: "bg-slate-400" },
  { key: "todo", label: "할 일", bar: "bg-cyan-400" },
  { key: "in_progress", label: "진행 중", bar: "bg-amber-400" },
  { key: "review", label: "리뷰", bar: "bg-fuchsia-400" },
  { key: "done", label: "완료", bar: "bg-emerald-400" },
];

const PRIORITY_META: Array<{
  key: Issue["priority"];
  label: string;
  bar: string
}> = [
  { key: "urgent", label: "매우높음", bar: "bg-rose-500" },
  { key: "high", label: "높음", bar: "bg-orange-400" },
  { key: "medium", label: "보통", bar: "bg-sky-400" },
  { key: "low", label: "낮음", bar: "bg-emerald-400" },
  { key: "very_low", label: "매우낮음", bar: "bg-slate-400" },
];

const GROUP_PALETTE = ["#38bdf8", "#f472b6", "#a78bfa", "#facc15", "#4ade80", "#f97316"];

const buildSeries = (
  dates: number[],
  mode: "hourly" | "daily" | "monthly",
  filter: { day: string; month: string; year: string },
) => {
  if (!dates.length) {
    if (mode === "hourly") return Array.from({ length: 24 }, () => 0);
    if (mode === "daily") {
      const [y, m] = filter.month.split("-").map(Number);
      const days = y && m ? new Date(y, m, 0).getDate() : 30;
      return Array.from({ length: days }, () => 0);
    }
    return Array.from({ length: 12 }, () => 0);
  }
  if (mode === "hourly") {
    const target = new Date(filter.day);
    if (Number.isNaN(target.getTime())) return Array.from({ length: 24 }, () => 0);
    const targetKey = target.toDateString();
    const hourly = Array.from({ length: 24 }, () => 0);
    dates.forEach((ts) => {
      const dt = new Date(ts);
      if (dt.toDateString() !== targetKey) return;
      hourly[dt.getHours()] += 1;
    });
    return hourly;
  }
  if (mode === "daily") {
    const [y, m] = filter.month.split("-").map(Number);
    if (!y || !m) return Array.from({ length: 30 }, () => 0);
    const daysInMonth = new Date(y, m, 0).getDate();
    const daily = Array.from({ length: daysInMonth }, () => 0);
    dates.forEach((ts) => {
      const dt = new Date(ts);
      if (dt.getFullYear() !== y || dt.getMonth() + 1 !== m) return;
      daily[dt.getDate() - 1] += 1;
    });
    return daily;
  }
  const y = Number(filter.year);
  const monthly = Array.from({ length: 12 }, () => 0);
  if (!y) return monthly;
  dates.forEach((ts) => {
    const dt = new Date(ts);
    if (dt.getFullYear() !== y) return;
    monthly[dt.getMonth()] += 1;
  });
  return monthly;
};

const renderBars = (values: number[], height = 140, colorClass = "bg-cyan-400") => {
  const max = Math.max(...values, 1);
  return (
    <div className="grid items-end gap-1" style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))` }}>
      {values.map((value, idx) => (
        <div key={idx} className="group relative flex w-full flex-col items-center">
          <div
            className={`w-full rounded-md ${colorClass} ${value > 0 ? "opacity-100" : "opacity-0"}`}
            style={{ height: value > 0 ? `${Math.round((value / max) * height)}px` : "0px" }}
            title={value > 0 ? `${value}` : ""}
          />
          {value > 0 && (
            <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded-full border border-border bg-panel px-2 py-0.5 text-[10px] text-muted opacity-0 transition-opacity group-hover:opacity-100">
              {value}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const renderRangeLabels = (mode: "hourly" | "daily" | "monthly", count: number) => {
  const pad2 = (value: number) => String(value).padStart(2, "0");
  const items =
    mode === "hourly"
      ? Array.from({ length: 24 }, (_, idx) => String(idx))
      : mode === "daily"
        ? Array.from({ length: count }, (_, idx) => `${pad2(idx + 1)}일`)
        : Array.from({ length: 12 }, (_, idx) => `${idx + 1}월`);
  return (
    <div
      className="mt-3 grid text-[9px] text-muted"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`, gap: "4px" }}
    >
      {items.map((label) => (
        <span key={label} className="text-center">
          {label}
        </span>
      ))}
    </div>
  );
};

const renderStackedBar = (items: Array<{ key: string; value: number; bar: string; label?: string }>) => {
  const total = items.reduce((acc, item) => acc + item.value, 0) || 1;
  return (
    <div className="flex h-3 w-full rounded-full bg-border/60">
      {items.map((item, index) => {
        const pct = Math.round((item.value / total) * 100);
        return (
          <div key={item.key} className="group relative h-full" style={{ width: `${(item.value / total) * 100}%` }}>
            <div className={`h-full ${item.bar} ${index === 0 ? "rounded-l-full" : ""} ${index === items.length - 1 ? "rounded-r-full" : ""}`} />
            <div className="pointer-events-none absolute -top-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-border/80 bg-panel px-2 py-0.5 text-[10px] text-foreground shadow-md opacity-0 transition-opacity group-hover:opacity-100">
              {item.label ?? ""} · {pct}%
            </div>
          </div>
        );
      })}
    </div>
  );
};

const renderLegend = (items: Array<{ key: string; label: string; value: number; bar: string }>) => {
  return (
    <div className="mt-4 space-y-2 text-xs">
      {items.map((item) => {
        return (
          <div key={item.key} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-muted">
              <span className={`h-2 w-2 rounded-full ${item.bar}`} />
              {item.label}
            </span>
            <span className="text-muted">{item.value}</span>
          </div>
        );
      })}
    </div>
  );
};


const renderHorizontalBars = (
  items: Array<{ key: string; label: string; value: number; color: string; avatarUrl?: string | null }>,
  maxItems = 6,
  showRank = false,
  showAvatar = false,
) => {
  const trimmed = items.slice(0, maxItems);
  const max = Math.max(...trimmed.map((item) => item.value), 1);
  return (
    <div className="mt-4 space-y-3 text-xs">
      {trimmed.map((item, index) => (
        <div key={item.key} className="flex items-center gap-3">
          {showRank && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full border border-border/60 text-[10px] text-muted">
              {index + 1}
            </div>
          )}
          <div className={`flex w-40 items-center gap-2 truncate text-muted ${showAvatar ? "text-sm" : ""}`}>
            {showAvatar && (
              item.avatarUrl ? (
                <img src={item.avatarUrl} alt={item.label} className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-border/60 text-[10px] text-muted">
                  {item.label.trim().slice(0, 2) || "??"}
                </div>
              )
            )}
            <span className="truncate">{item.label}</span>
          </div>
          <div className="flex-1">
            <div className={`${showAvatar ? "h-3" : "h-2"} w-full overflow-hidden rounded-full bg-border/60`}>
              <div className="h-full" style={{ width: `${Math.round((item.value / max) * 100)}%`, backgroundColor: item.color }} />
            </div>
          </div>
          <div className="w-10 text-right text-xs text-muted">{item.value}</div>
        </div>
      ))}
    </div>
  );
};

export default function IssuesChartView({ issues, memberMap, issueGroups, loading }: IssuesChartViewProps) {
  const today = useMemo(() => new Date(), []);
  const todayStr = today.toISOString().slice(0, 10);
  const monthStr = today.toISOString().slice(0, 7);
  const yearStr = String(today.getFullYear());
  const [graphMode, setGraphMode] = useState<"hourly" | "daily" | "monthly">("hourly");
  const [graphFilter, setGraphFilter] = useState({ day: todayStr, month: monthStr, year: yearStr });

  const flatIssues = useMemo(() => {
    const list: Issue[] = [];
    const walk = (items: Issue[]) => {
      items.forEach((item) => {
        list.push(item);
        if (item.subtasks?.length) walk(item.subtasks);
      });
    };
    walk(issues);
    return list;
  }, [issues]);

  const issueById = useMemo(() => new Map(flatIssues.map((issue) => [issue.id, issue])), [flatIssues]);
  const resolveGroup = (issue: Issue) => {
    let currentGroup = issue.group;
    let cursorId = issue.parentId ?? null;
    while (!currentGroup && cursorId) {
      const parent = issueById.get(cursorId);
      if (!parent) break;
      if (parent.group) {
        currentGroup = parent.group;
        break;
      }
      cursorId = parent.parentId ?? null;
    }
    if (currentGroup?.id) return currentGroup;
    const fallback = issue.group?.id ? issueGroups.find((g) => g.id === issue.group?.id) : undefined;
    return fallback ?? currentGroup;
  };

  const statusCounts = useMemo(
    () =>
      STATUS_META.map((status) => ({
        ...status,
        value: flatIssues.filter((issue) => issue.status === status.key).length,
      })),
    [flatIssues],
  );

  const priorityCounts = useMemo(
    () =>
      PRIORITY_META.map((priority) => ({
        ...priority,
        value: flatIssues.filter((issue) => issue.priority === priority.key).length,
      })),
    [flatIssues],
  );

  const assigneeCounts = useMemo(() => {
    const map = new Map<string, { key: string; label: string; value: number }>();
    flatIssues.forEach((issue) => {
      const key = issue.assigneeId ?? issue.assignee ?? "unassigned";
      const label = issue.assigneeId ? memberMap[issue.assigneeId]?.name ?? issue.assigneeId : issue.assignee ?? "미지정";
      const entry = map.get(key) ?? { key, label, value: 0 };
      entry.value += 1;
      map.set(key, entry);
    });
    return Array.from(map.values()).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [flatIssues, memberMap]);

  const groupCounts = useMemo(() => {
    const map = new Map<string, { key: string; label: string; value: number; color: string }>();
    flatIssues.forEach((issue) => {
      const group = resolveGroup(issue);
      const key = group?.id ?? "ungrouped";
      const label = group?.name ?? "미분류";
      const color = group?.color ?? GROUP_PALETTE[map.size % GROUP_PALETTE.length];
      const entry = map.get(key) ?? { key, label, value: 0, color };
      entry.value += 1;
      map.set(key, entry);
    });
    return Array.from(map.values()).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [flatIssues, issueGroups]);

  const activityDates = useMemo(
    () =>
      flatIssues
        .map((issue) => new Date(issue.updatedAt || issue.createdAt).getTime())
        .filter((ts) => !Number.isNaN(ts)),
    [flatIssues],
  );
  const activitySeries = useMemo(
    () => buildSeries(activityDates, graphMode, graphFilter),
    [activityDates, graphMode, graphFilter],
  );
  const hasActivity = activitySeries.some((value) => value > 0);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-panel/60 p-6 text-sm text-muted">
        차트 데이터를 불러오는 중입니다.
      </div>
    );
  }

  if (!flatIssues.length) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 bg-panel/60 px-6 py-10 text-center text-sm text-muted">
        아직 표시할 이슈가 없습니다. 이슈를 추가하면 차트가 자동으로 구성됩니다.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pb-2 pr-1">
      <section className="rounded-2xl border border-border bg-panel/70 p-5">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Layers size={16} /> 그룹
        </div>
        {renderHorizontalBars(
          groupCounts.map((item) => ({
            key: item.key,
            label: item.label,
            value: item.value,
            color: item.color,
          })),
          8,
          true,
        )}
      </section>

      <section className="rounded-2xl border border-border bg-panel/70 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 text-sm text-muted">
            <span className="flex items-center gap-2 font-semibold">
              <BarChart3 size={16} /> 이슈 활동
            </span>
            <div className="flex flex-col items-end gap-2">
              {graphMode === "hourly" && (
                <input
                  type="date"
                  value={graphFilter.day}
                  onChange={(e) => setGraphFilter((prev) => ({ ...prev, day: e.target.value }))}
                  className="w-[190px] rounded-full border border-border bg-panel px-3 py-2 text-[11px] text-muted text-center"
                />
              )}
              {graphMode === "daily" && (
                <input
                  type="month"
                  value={graphFilter.month}
                  onChange={(e) => setGraphFilter((prev) => ({ ...prev, month: e.target.value }))}
                  className="w-[190px] rounded-full border border-border bg-panel px-3 py-2 text-[11px] text-muted text-center"
                />
              )}
              {graphMode === "monthly" && (
                <select
                  value={graphFilter.year}
                  onChange={(e) => setGraphFilter((prev) => ({ ...prev, year: e.target.value }))}
                  className="w-[190px] rounded-full border border-border bg-panel px-3 py-2 pr-8 text-[11px] text-muted text-center"
                >
                  {Array.from({ length: 6 }, (_, idx) => String(today.getFullYear() - idx)).map((y) => (
                    <option key={y} value={y}>
                      {y}년
                    </option>
                  ))}
                </select>
              )}
              <div className="inline-flex w-[190px] justify-between rounded-full border border-border bg-panel p-1 text-[11px] text-muted">
                {([
                  { key: "hourly", label: "시간대" },
                  { key: "daily", label: "일별" },
                  { key: "monthly", label: "월별" },
                ] as const).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={`rounded-full px-3 py-2 transition ${graphMode === item.key ? "bg-accent text-foreground" : "hover:text-foreground"}`}
                    onClick={() => setGraphMode(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-border/60 bg-panel/40 p-4">
            {hasActivity ? (
              renderBars(activitySeries, 240)
            ) : (
              <div className="rounded-lg border border-dashed border-border/70 px-3 py-6 text-xs text-muted text-center">
                선택한 기간에는 기록된 활동이 없습니다.
              </div>
            )}
          </div>
          {graphMode === "hourly" && renderRangeLabels("hourly", 24)}
          {graphMode === "daily" && renderRangeLabels("daily", activitySeries.length)}
          {graphMode === "monthly" && renderRangeLabels("monthly", 12)}
      </section>

      <section className="rounded-2xl border border-border bg-panel/70 p-5">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Users size={16} /> 담당자
        </div>
        {renderHorizontalBars(
          assigneeCounts.map((item) => ({
            key: item.key,
            label: item.label,
            value: item.value,
            color: "#38bdf8",
            avatarUrl: memberMap[item.key]?.avatarUrl ?? null,
          })),
          6,
          false,
          true,
        )}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-panel/70 p-5">
          <div className="flex items-center gap-2 text-sm text-muted">
            <BarChart3 size={16} /> 우선순위 분포
          </div>
          <div className="mt-4">
            {renderStackedBar(priorityCounts.map((item) => ({ key: item.key, value: item.value, bar: item.bar, label: item.label })))}
            {renderLegend(priorityCounts.map((item) => ({ key: item.key, label: item.label, value: item.value, bar: item.bar })))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-panel/70 p-5">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Layers size={16} /> 상태 분포
          </div>
          <div className="mt-4">
            {renderStackedBar(statusCounts.map((item) => ({ key: item.key, value: item.value, bar: item.bar, label: item.label })))}
            {renderLegend(statusCounts.map((item) => ({ key: item.key, label: item.label, value: item.value, bar: item.bar })))}
          </div>
        </div>
      </section>
    </div>
  );
}
