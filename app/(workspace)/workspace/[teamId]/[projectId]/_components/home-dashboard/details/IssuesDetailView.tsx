// app/(workspace)/workspace/[teamId]/[projectId]/_components/home-dashboard/details/IssuesDetailView.tsx
'use client';

import { useMemo, useState } from 'react';
import { ArrowUpRight, BadgeCheck, CalendarDays, CheckCircle2, CircleDot, Clock4, Eye, Flame, FolderKanban, LayoutGrid, LineChart, Sparkles, Table2 } from 'lucide-react';
import { ISSUE_PRIORITY_LABELS, ISSUE_PRIORITY_STYLES, ISSUE_STATUS_LABELS, ISSUE_STATUS_STYLES } from '../../../_model/dashboard-page.constants';
import { buildSeriesFromDates, filterDates } from '../../../_model/dashboard-page.utils';
import type { DetailViewBaseProps } from './detail-view.types';

type PieBucket = { key: string; name: string; count: number; color: string };

function PieStatCard({ title, items }: { title: string; items: PieBucket[] }) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; key: string } | null>(null);
  const pieItems = items.filter((item) => item.count > 0);
  const total = pieItems.reduce((sum, item) => sum + item.count, 0);
  const size = 220;
  const r = 88;
  const cx = size / 2;
  const cy = size / 2;

  let acc = 0;
  const slices = pieItems.map((item) => {
    const start = total ? acc / total : 0;
    acc += item.count;
    const end = total ? acc / total : 0;
    return { ...item, start, end };
  });

  const hovered = hoveredKey ? pieItems.find((item) => item.key === hoveredKey) ?? null : null;

  const toPoint = (ratio: number) => {
    const angle = ratio * Math.PI * 2 - Math.PI / 2;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  return (
    <div className="rounded-xl border border-border/60 bg-panel p-4">
      <div className="mb-2 text-[11px] font-semibold text-muted">{title}</div>
      <div className="flex items-center gap-4">
        <div
          className="relative h-[220px] w-[220px]"
          onMouseLeave={() => {
            setHoveredKey(null);
            setTooltip(null);
          }}
        >
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {pieItems.length === 1 ? (
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={pieItems[0].color}
                onMouseEnter={(event) => {
                  const rect = (event.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setHoveredKey(pieItems[0].key);
                  setTooltip({
                    key: pieItems[0].key,
                    x: event.clientX - rect.left,
                    y: event.clientY - rect.top,
                  });
                }}
                onMouseMove={(event) => {
                  const rect = (event.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setTooltip({
                    key: pieItems[0].key,
                    x: event.clientX - rect.left,
                    y: event.clientY - rect.top,
                  });
                }}
              />
            ) : slices.map((slice) => {
              const p1 = toPoint(slice.start);
              const p2 = toPoint(slice.end);
              const largeArc = slice.end - slice.start > 0.5 ? 1 : 0;
              const d = `M ${cx} ${cy} L ${p1.x} ${p1.y} A ${r} ${r} 0 ${largeArc} 1 ${p2.x} ${p2.y} Z`;
              return (
                <path
                  key={slice.key}
                  d={d}
                  fill={slice.color}
                  onMouseEnter={(event) => {
                    const rect = (event.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                    setHoveredKey(slice.key);
                    setTooltip({
                      key: slice.key,
                      x: event.clientX - rect.left,
                      y: event.clientY - rect.top,
                    });
                  }}
                  onMouseMove={(event) => {
                    const rect = (event.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                    setTooltip({
                      key: slice.key,
                      x: event.clientX - rect.left,
                      y: event.clientY - rect.top,
                    });
                  }}
                />
              );
            })}
          </svg>
          {hovered && tooltip ? (
            <div
              className="pointer-events-none absolute rounded-md border border-border/70 bg-panel px-2 py-1 text-center shadow-sm"
              style={{ left: tooltip.x, top: tooltip.y, transform: "translate(-50%, -120%)" }}
            >
              <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-foreground">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: hovered.color }} />
                {hovered.name}
              </div>
              <div className="text-[10px] text-muted">{hovered.count}</div>
            </div>
          ) : null}
        </div>
        <div className="flex-1 space-y-1">
          {pieItems.map((bucket) => (
            <div
              key={bucket.key}
              className="flex items-center gap-1 text-[11px] text-muted"
              onMouseEnter={() => {
                setHoveredKey(bucket.key);
                setTooltip(null);
              }}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: bucket.color }} />
              <span className="truncate">{bucket.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function IssuesDetailView({ pathname, onNavigate, renderHeader, renderIssueSummary, renderDetailTabs, renderGraphFilter, renderGraphTabs, renderBars, renderRangeLabels, model }: DetailViewBaseProps) {
  const {
    issueTab,
    setIssueTab,
    issueCount,
    issueStats,
    issueGraphMode,
    setIssueGraphMode,
    issueHourlyDate,
    setIssueHourlyDate,
    issueDailyMonth,
    setIssueDailyMonth,
    issueMonthlyYear,
    setIssueMonthlyYear,
    issueCounts,
    issues,
    issuesByStatus,
    members,
  } = model;
  const [selectedTableKey, setSelectedTableKey] = useState<string>("all");
  const [tableMenuOpen, setTableMenuOpen] = useState(false);
  const issueTableBuckets = useMemo(() => {
    const map = new Map<string, { key: string; name: string; count: number; color: string }>();
    const toColor = (key: string) => {
      let hash = 0;
      for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) | 0;
      const hue = Math.abs(hash) % 360;
      return `hsl(${hue} 65% 45%)`;
    };
    issues.forEach((issue) => {
      const raw = ((issue as any).tableName ?? (issue as any).table?.name ?? (issue as any).group?.name ?? "메인 테이블") as string;
      const detectedColor = ((issue as any).table?.color ?? (issue as any).group?.color ?? "") as string;
      const key = raw || "메인 테이블";
      const prev = map.get(key);
      if (prev) {
        prev.count += 1;
        if (!prev.color && detectedColor) prev.color = detectedColor;
        return;
      }
      map.set(key, { key, name: key, count: 1, color: detectedColor || toColor(key) });
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [issues]);

  const filteredIssuesByTable = useMemo(() => {
    if (selectedTableKey === "all") return issues;
    return issues.filter((issue: any) => {
      const tableName = (issue?.tableName ?? issue?.table?.name ?? issue?.group?.name ?? "메인 테이블") as string;
      return tableName === selectedTableKey;
    });
  }, [issues, selectedTableKey]);

  const filteredStatusBuckets = useMemo(() => {
    const list = filteredIssuesByTable;
    return [
      { key: "backlog", name: ISSUE_STATUS_LABELS.backlog, count: list.filter((i) => i.status === "backlog").length, color: "#64748b" },
      { key: "todo", name: ISSUE_STATUS_LABELS.todo, count: list.filter((i) => i.status === "todo").length, color: "#f43f5e" },
      { key: "in_progress", name: ISSUE_STATUS_LABELS.in_progress, count: list.filter((i) => i.status === "in_progress").length, color: "#f59e0b" },
      { key: "review", name: ISSUE_STATUS_LABELS.review, count: list.filter((i) => i.status === "review").length, color: "#8b5cf6" },
      { key: "done", name: ISSUE_STATUS_LABELS.done, count: list.filter((i) => i.status === "done").length, color: "#10b981" },
    ];
  }, [filteredIssuesByTable]);

  const filteredPriorityBuckets = useMemo(() => {
    const map = new Map<string, { key: string; name: string; count: number; color: string }>();
    const colorMap: Record<string, string> = {
      very_low: "#94a3b8",
      low: "#38bdf8",
      medium: "#f59e0b",
      high: "#f97316",
      urgent: "#f43f5e",
    };
    filteredIssuesByTable.forEach((issue) => {
      const key = issue.priority ?? "medium";
      const prev = map.get(key);
      if (prev) {
        prev.count += 1;
        return;
      }
      map.set(key, {
        key,
        name: ISSUE_PRIORITY_LABELS[key as keyof typeof ISSUE_PRIORITY_LABELS] ?? key,
        count: 1,
        color: colorMap[key] ?? "#64748b",
      });
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [filteredIssuesByTable]);

  const getTableMeta = (issue: any) => {
    const tableName = (issue?.tableName ?? issue?.table?.name ?? issue?.group?.name ?? "메인 테이블") as string;
    const found = issueTableBuckets.find((item) => item.name === tableName);
    return { name: tableName, color: found?.color ?? "#3b82f6" };
  };

  const resolveAssignee = (issue: { assigneeId?: string; assignee?: string }) => {
    const byId = issue.assigneeId ? members.find((member) => member.id === issue.assigneeId) : undefined;
    if (byId) {
      return {
        name: byId.name,
        avatarUrl: byId.avatarUrl ?? null,
      };
    }
    const byName = issue.assignee ? members.find((member) => member.name === issue.assignee) : undefined;
    if (byName) {
      return {
        name: byName.name,
        avatarUrl: byName.avatarUrl ?? null,
      };
    }
    return {
      name: issue.assignee || "담당자 미지정",
      avatarUrl: null,
    };
  };

  const formatYYMMDD = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yy}.${mm}.${dd}`;
  };

  const getKanbanTone = (status: "backlog" | "todo" | "in_progress" | "review" | "done") => {
    switch (status) {
      case "done":
        return { badge: "bg-emerald-500 text-emerald-100", card: "bg-emerald-500/8", icon: BadgeCheck };
      case "in_progress":
        return { badge: "bg-amber-500 text-amber-100", card: "bg-amber-500/8", icon: Sparkles };
      case "review":
        return { badge: "bg-violet-500 text-violet-100", card: "bg-violet-500/8", icon: Eye };
      case "backlog":
        return { badge: "bg-slate-500 text-slate-100", card: "bg-slate-500/8", icon: CircleDot };
      default:
        return { badge: "bg-rose-500 text-rose-100", card: "bg-rose-500/8", icon: Flame };
    }
  };
        return (
          <>
            {renderHeader(
              "Issue Dashboard",
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-border bg-panel px-3 py-1.5 text-[11px] font-semibold text-foreground hover:bg-accent"
                onClick={() => onNavigate(`${pathname}/issues`)}
              >
                이슈로 이동 <ArrowUpRight size={12} />
              </button>,
              renderDetailTabs(issueTab, setIssueTab, [
                { key: "all", label: "전체", icon: FolderKanban },
                { key: "table", label: "테이블", icon: Table2 },
                { key: "kanban", label: "칸반", icon: LayoutGrid },
                { key: "timeline", label: "타임라인", icon: CalendarDays },
                { key: "chart", label: "차트", icon: LineChart },
              ])
            )}
            <section className="grid gap-5 md:grid-cols-5">
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><FolderKanban size={16} /> 총 이슈</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">{issueCount}</div>
              </div>
              <div className="rounded-2xl border border-border bg-panel/70 p-4">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><CheckCircle2 size={16} /> 완료</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">{issueStats.done}</div>
              </div>
              <div className="rounded-2xl border border-border bg-panel/70 p-4">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><Clock4 size={16} /> 리뷰 대기</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">{issueStats.review}</div>
              </div>
              <div className="rounded-2xl border border-border bg-panel/70 p-4">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><Clock4 size={16} /> 작업 중</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">{issueStats.in_progress}</div>
              </div>
              <div className="rounded-2xl border border-border bg-panel/70 p-4">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><Clock4 size={16} /> 할 일</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">{issueStats.todo}</div>
              </div>
            </section>
            {(issueTab === "all" || issueTab === "chart") && (
              <>
                {renderIssueSummary()}
                <section className="rounded-2xl border border-border bg-panel/70 p-6 pb-8">
                  <div className="flex flex-wrap items-start justify-between gap-3 text-sm text-muted">
                    <span className="flex items-center gap-2"><LineChart size={16} /> 이슈 그래프</span>
                    <div className="flex flex-col items-end gap-2">
                      {renderGraphFilter(
                        issueGraphMode,
                        { day: issueHourlyDate, month: issueDailyMonth, year: issueMonthlyYear },
                        (next) => {
                          setIssueHourlyDate(next.day);
                          setIssueDailyMonth(next.month);
                          setIssueMonthlyYear(next.year);
                        }
                      )}
                      {renderGraphTabs(issueGraphMode, setIssueGraphMode)}
                    </div>
                  </div>
                <div className="mt-4">
                  {issueGraphMode === "hourly" &&
                      renderBars(
                        issueCounts.hourly.length
                          ? issueCounts.hourly
                          : buildSeriesFromDates(filterDates(issues.map((i) => new Date(i.updatedAt || i.createdAt).getTime()).filter((ts) => !Number.isNaN(ts)), "hourly", { day: issueHourlyDate, month: issueDailyMonth, year: issueMonthlyYear })).hourly,
                        72
                      )}
                    {issueGraphMode === "daily" &&
                      renderBars(
                        issueCounts.daily.length
                          ? issueCounts.daily
                          : buildSeriesFromDates(filterDates(issues.map((i) => new Date(i.updatedAt || i.createdAt).getTime()).filter((ts) => !Number.isNaN(ts)), "daily", { day: issueHourlyDate, month: issueDailyMonth, year: issueMonthlyYear })).daily,
                        72
                      )}
                    {issueGraphMode === "monthly" &&
                      renderBars(
                        issueCounts.monthly.length
                          ? issueCounts.monthly
                          : buildSeriesFromDates(filterDates(issues.map((i) => new Date(i.updatedAt || i.createdAt).getTime()).filter((ts) => !Number.isNaN(ts)), "monthly", { day: issueHourlyDate, month: issueDailyMonth, year: issueMonthlyYear })).monthly,
                        72
                      )}
                  {issueGraphMode === "hourly" && renderRangeLabels("hourly", 24)}
                  {issueGraphMode === "daily" && renderRangeLabels("daily", issueCounts.daily.length || 31)}
                  {issueGraphMode === "monthly" && renderRangeLabels("monthly", 12)}
                </div>
              </section>
              </>
            )}
            {(issueTab === "all" || issueTab === "table") && (
              <section className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="mb-3 flex items-center gap-2 text-sm text-muted">
                  <Table2 size={16} /> 최근 업데이트 테이블
                </div>
                <div className="overflow-x-auto rounded-lg border border-border/60">
                  <div className="grid min-w-[720px] grid-cols-[120px_1.2fr_160px_110px_110px_100px] bg-panel px-3 py-2 text-[11px] text-muted">
                    <span>구분</span>
                    <span>이슈</span>
                    <span>담당자</span>
                    <span>상태</span>
                    <span>우선순위</span>
                    <span>수정일</span>
                  </div>
                  <div className="min-w-[720px] divide-y divide-border/60">
                    {issues
                      .slice()
                      .sort((a: any, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                      .slice(0, 10)
                      .map((issue) => (
                        <button
                          key={issue.id}
                          type="button"
                          onClick={() => onNavigate(`${pathname}/issues/${issue.id}`)}
                          className="grid w-full grid-cols-[120px_1.2fr_160px_110px_110px_100px] items-center px-3 py-2 text-left text-xs hover:bg-accent"
                        >
                          <span className="inline-flex">
                            {(() => {
                              const table = getTableMeta(issue);
                              return (
                                  <span
                                    className="inline-flex max-w-[120px] truncate rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white"
                                    style={{ backgroundColor: table.color }}
                                  >
                                    {table.name}
                                  </span>
                              );
                            })()}
                          </span>
                          <span className="truncate font-medium text-foreground">{issue.title}</span>
                          {(() => {
                            const assignee = resolveAssignee(issue);
                            return (
                              <span className="inline-flex min-w-0 items-center gap-2">
                                <span className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-muted/40">
                                  {assignee.avatarUrl ? (
                                    <img src={assignee.avatarUrl} alt={assignee.name} className="h-full w-full object-cover" />
                                  ) : (
                                    <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold">{assignee.name.slice(0, 1)}</span>
                                  )}
                                </span>
                                <span className="truncate text-[11px] text-muted">{assignee.name}</span>
                              </span>
                            );
                          })()}
                          <span className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold ${ISSUE_STATUS_STYLES[issue.status] ?? "border-border/60 bg-panel text-muted"}`}>{ISSUE_STATUS_LABELS[issue.status] ?? issue.status}</span>
                          <span className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold ${ISSUE_PRIORITY_STYLES[issue.priority ?? "normal"] ?? "border-border/60 bg-panel text-muted"}`}>{ISSUE_PRIORITY_LABELS[issue.priority ?? "normal"] ?? (issue.priority ?? "보통")}</span>
                          <span className="text-[11px] text-muted">{new Date(issue.updatedAt).toLocaleDateString("ko-KR")}</span>
                        </button>
                      ))}
                  </div>
                </div>
              </section>
            )}
            {(issueTab === "all" || issueTab === "kanban") && (
              <section className="grid gap-4 lg:grid-cols-4">
                {(["todo", "in_progress", "review", "done"] as const).map((status) => (
                  <div key={status} className="rounded-2xl border border-border bg-panel/70 p-3">
                    <div className="mb-3 flex items-center justify-between text-xs">
                      {(() => {
                        const tone = getKanbanTone(status);
                        const Icon = tone.icon;
                        return (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone.badge}`}>
                            <Icon size={11} />
                            {ISSUE_STATUS_LABELS[status] ?? status}
                          </span>
                        );
                      })()}
                      <span className="text-muted">{issuesByStatus[status].length}</span>
                    </div>
                    <div className="space-y-2">
                      {issuesByStatus[status].slice(0, 4).map((issue) => (
                        (() => {
                          const assignee = resolveAssignee(issue);
                          const table = getTableMeta(issue);
                          const tone = getKanbanTone(status);
                          return (
                        <button
                          key={issue.id}
                          type="button"
                          onClick={() => onNavigate(`${pathname}/issues/${issue.id}`)}
                          className={`w-full rounded-lg border border-border/60 px-2 py-2 text-left text-[11px] hover:bg-accent ${tone.card}`}
                        >
                          <div className="mb-1 inline-flex max-w-full rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white" style={{ backgroundColor: table.color }}>
                            <span className="truncate">{table.name}</span>
                          </div>
                          <div className="truncate font-medium text-foreground">{issue.title}</div>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className="inline-flex min-w-0 items-center gap-1.5">
                              <span className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-muted/40">
                                {assignee.avatarUrl ? (
                                  <img src={assignee.avatarUrl} alt={assignee.name} className="h-full w-full object-cover" />
                                ) : (
                                  <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold">{assignee.name.slice(0, 1)}</span>
                                )}
                              </span>
                              <span className="truncate text-[10px] text-muted">{assignee.name}</span>
                            </span>
                            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${ISSUE_PRIORITY_STYLES[issue.priority ?? "normal"] ?? "border-border/60 bg-panel text-muted"}`}>
                              {ISSUE_PRIORITY_LABELS[issue.priority ?? "normal"] ?? (issue.priority ?? "보통")}
                            </span>
                          </div>
                          <div className="mt-1 text-[10px] text-muted">
                            {formatYYMMDD(issue.startAt)} ~ {formatYYMMDD(issue.endAt)}
                          </div>
                        </button>
                          );
                        })()
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            )}
            {(issueTab === "all" || issueTab === "timeline") && (
              <section className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="mb-3 flex items-center gap-2 text-sm text-muted">
                  <CalendarDays size={16} /> 타임라인 뷰
                </div>
                <div className="space-y-2">
                  {issues
                    .slice()
                    .sort((a: any, b) => new Date(a.startAt || a.createdAt).getTime() - new Date(b.startAt || b.createdAt).getTime())
                    .slice(0, 12)
                    .map((issue) => {
                      const assignee = resolveAssignee(issue);
                      return (
                      <div key={issue.id} className="flex flex-col gap-2 rounded-lg border border-border/60 bg-panel px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted/40">
                            {assignee.avatarUrl ? (
                              <img src={assignee.avatarUrl} alt={assignee.name} className="h-full w-full object-cover" />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-foreground">
                                {assignee.name.slice(0, 1)}
                              </span>
                            )}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate text-[11px] text-foreground">{assignee.name}</div>
                            <div className="inline-flex items-center gap-2">
                              {(() => {
                                const table = getTableMeta(issue);
                                return (
                                  <span
                                    className="inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white"
                                    style={{ backgroundColor: table.color }}
                                  >
                                    {table.name}
                                  </span>
                                );
                              })()}
                              <span className="truncate text-[11px] font-semibold text-foreground">{issue.title}</span>
                            </div>
                            <div className="truncate text-[11px] text-muted">
                              {formatYYMMDD(issue.startAt)} ~ {formatYYMMDD(issue.endAt)}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1 self-end sm:self-auto">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ISSUE_STATUS_STYLES[issue.status] ?? "border-border/60 bg-panel text-muted"}`}>{ISSUE_STATUS_LABELS[issue.status] ?? issue.status}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ISSUE_PRIORITY_STYLES[issue.priority ?? "normal"] ?? "border-border/60 bg-panel text-muted"}`}>{ISSUE_PRIORITY_LABELS[issue.priority ?? "normal"] ?? (issue.priority ?? "보통")}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
            {(issueTab === "all" || issueTab === "chart") && (
              <section className="rounded-2xl border border-border bg-panel/70 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold text-foreground">테이블별 이슈</div>
                  <div className="relative">
                    <button
                      type="button"
                      className="inline-flex min-w-[180px] items-center justify-between rounded-full border border-border bg-panel px-3 py-1 text-[11px] text-foreground"
                      onClick={() => setTableMenuOpen((prev) => !prev)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {selectedTableKey !== "all" ? (
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: issueTableBuckets.find((b) => b.key === selectedTableKey)?.color ?? "#64748b" }}
                          />
                        ) : null}
                        {selectedTableKey === "all"
                          ? "전체"
                          : issueTableBuckets.find((bucket) => bucket.key === selectedTableKey)?.name ?? "전체"}
                      </span>
                      <span>▾</span>
                    </button>
                    {tableMenuOpen ? (
                      <div className="absolute right-0 z-20 mt-1 w-56 rounded-lg border border-border bg-panel p-1 shadow-sm">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTableKey("all");
                            setTableMenuOpen(false);
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[11px] text-foreground hover:bg-accent"
                        >
                          전체
                        </button>
                        {issueTableBuckets.map((bucket) => (
                          <button
                            key={bucket.key}
                            type="button"
                            onClick={() => {
                              setSelectedTableKey(bucket.key);
                              setTableMenuOpen(false);
                            }}
                            className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[11px] text-foreground hover:bg-accent"
                          >
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: bucket.color }} />
                            <span className="truncate">{bucket.name}</span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                  <div className="space-y-4">
                  {selectedTableKey === "all" ? (
                    <PieStatCard title="테이블 분포" items={issueTableBuckets.slice(0, 8)} />
                  ) : null}
                  <div className="rounded-xl border border-border/60 bg-panel p-4">
                    <div className="mb-3 text-[11px] font-semibold text-muted">상태/우선순위 분포</div>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <PieStatCard title="상태 분포" items={filteredStatusBuckets.filter((bucket) => bucket.count > 0)} />
                      <PieStatCard title="우선순위 분포" items={filteredPriorityBuckets.filter((bucket) => bucket.count > 0)} />
                    </div>
                  </div>
                </div>
              </section>
            )}
          </>
        );

}
