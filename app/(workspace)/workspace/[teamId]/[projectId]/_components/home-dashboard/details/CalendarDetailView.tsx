// app/(workspace)/workspace/[teamId]/[projectId]/_components/home-dashboard/details/CalendarDetailView.tsx
'use client';

import { useMemo, useState } from 'react';
import { addMonths, format, subMonths } from 'date-fns';
import { ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, Clock4, LayoutGrid, LineChart } from 'lucide-react';
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

export default function CalendarDetailView({ pathname, onNavigate, renderHeader, renderDetailTabs, renderGraphFilter, renderGraphTabs, renderBars, renderRangeLabels, model }: DetailViewBaseProps) {
  const {
    calendarTab,
    setCalendarTab,
    upcomingEvents,
    calendarBuckets,
    calendarGraphMode,
    setCalendarGraphMode,
    calendarHourlyDate,
    setCalendarHourlyDate,
    calendarDailyMonth,
    setCalendarDailyMonth,
    calendarMonthlyYear,
    setCalendarMonthlyYear,
    calendarCounts,
    calendarEvents,
    calendarSources,
    members,
  } = model;
  const [shownMonth, setShownMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedCalendarBucketKey, setSelectedCalendarBucketKey] = useState<string>("all");
  const [selectedAnalyticsCalendarKey, setSelectedAnalyticsCalendarKey] = useState<string>("all");
  const [analyticsMenuOpen, setAnalyticsMenuOpen] = useState(false);

  const visibleCalendarBuckets = useMemo(() => {
    const sourceMap = new Map(calendarSources.map((source) => [source.id, source]));
    return calendarBuckets
      .filter((bucket) => {
        const source = sourceMap.get(bucket.key);
        const sourceType = (source?.type ?? "").toUpperCase();
        const sourceName = (source?.name ?? bucket.name ?? "").toLowerCase();
        if (sourceType === "PERSONAL") return false;
        if (sourceName.includes("개인")) return false;
        return true;
      })
      .map((bucket) => {
        const source = sourceMap.get(bucket.key);
        let normalizedName = bucket.name;
        const lowered = (source?.name ?? bucket.name).toLowerCase();
        if (lowered.includes("이슈")) normalizedName = "이슈보드 캘린더";
        else if (lowered.includes("프로젝트")) normalizedName = "프로젝트 캘린더";
        return { ...bucket, name: normalizedName };
      });
  }, [calendarBuckets, calendarSources]);

  const filteredCalendarEvents = useMemo(() => {
    if (selectedCalendarBucketKey === "all") {
      const visibleKeys = new Set(visibleCalendarBuckets.map((bucket) => bucket.key));
      return calendarEvents.filter((event) => visibleKeys.has(event.calendarId || event.categoryId || ""));
    }
    return calendarEvents.filter((event) => (event.calendarId || event.categoryId) === selectedCalendarBucketKey);
  }, [calendarEvents, selectedCalendarBucketKey, visibleCalendarBuckets]);

  const filteredCategoryBuckets = useMemo(() => {
    const map = new Map<string, { key: string; name: string; count: number; color: string }>();
    filteredCalendarEvents.forEach((event) => {
      const key = event.categoryId || "default";
      const prev = map.get(key);
      if (prev) {
        prev.count += 1;
        return;
      }
      map.set(key, {
        key,
        name: event.categoryName || "기본",
        color: event.categoryColor || "#3b82f6",
        count: 1,
      });
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [filteredCalendarEvents]);

  const filteredAnalyticsEvents = useMemo(() => {
    if (selectedAnalyticsCalendarKey === "all") {
      const visibleKeys = new Set(visibleCalendarBuckets.map((bucket) => bucket.key));
      return calendarEvents.filter((event) => visibleKeys.has(event.calendarId || event.categoryId || ""));
    }
    return calendarEvents.filter((event) => (event.calendarId || event.categoryId) === selectedAnalyticsCalendarKey);
  }, [calendarEvents, selectedAnalyticsCalendarKey, visibleCalendarBuckets]);

  const analyticsCategoryBuckets = useMemo(() => {
    const map = new Map<string, { key: string; name: string; count: number; color: string }>();
    filteredAnalyticsEvents.forEach((event) => {
      const key = event.categoryId || "default";
      const prev = map.get(key);
      if (prev) {
        prev.count += 1;
        return;
      }
      map.set(key, {
        key,
        name: event.categoryName || "기본",
        color: event.categoryColor || "#3b82f6",
        count: 1,
      });
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [filteredAnalyticsEvents]);

  const calendarEventMap = useMemo(() => {
    const eventByDay = new Map<string, typeof calendarEvents>();
    filteredCalendarEvents.forEach((event) => {
      const day = new Date(event.start);
      if (Number.isNaN(day.getTime())) return;
      const key = format(day, "yyyy-MM-dd");
      const prev = eventByDay.get(key) ?? [];
      prev.push(event);
      eventByDay.set(key, prev);
    });
    return eventByDay;
  }, [filteredCalendarEvents]);

  const calendarMatrix = useMemo(() => {
    const year = shownMonth.getFullYear();
    const month = shownMonth.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startWeekday = first.getDay();
    const daysInMonth = last.getDate();
    const cells: Array<{
      date: Date | null;
      count: number;
      categorySummaries: Array<{ key: string; label: string; count: number; color: string }>;
      dayEvents: typeof calendarEvents;
    }> = [];
    for (let i = 0; i < startWeekday; i += 1) {
      cells.push({ date: null, count: 0, categorySummaries: [], dayEvents: [] });
    }
    for (let d = 1; d <= daysInMonth; d += 1) {
      const date = new Date(year, month, d);
      const key = format(date, "yyyy-MM-dd");
      const dayEvents = calendarEventMap.get(key) ?? [];
      const categoryMap = new Map<string, { key: string; label: string; count: number; color: string }>();
      dayEvents.forEach((event) => {
        const categoryKey = event.categoryId || event.calendarId || "기본";
        const prev = categoryMap.get(categoryKey);
        if (prev) {
          prev.count += 1;
          return;
        }
        categoryMap.set(categoryKey, {
          key: categoryKey,
          label: event.categoryName || "기본",
          count: 1,
          color: event.categoryColor || "#3b82f6",
        });
      });
      cells.push({
        date,
        count: dayEvents.length,
        categorySummaries: Array.from(categoryMap.values()).sort((a, b) => b.count - a.count),
        dayEvents: [...dayEvents].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
      });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ date: null, count: 0, categorySummaries: [], dayEvents: [] });
    }
    return cells;
  }, [calendarEventMap, shownMonth]);

  const memberNameMap = useMemo(() => {
    const map = new Map<string, string>();
    members.forEach((member) => {
      map.set(member.id, member.displayName || member.name);
    });
    return map;
  }, [members]);

  const memberDisplayByNameMap = useMemo(() => {
    const map = new Map<string, string>();
    members.forEach((member) => {
      map.set(member.name, member.displayName || member.name);
    });
    return map;
  }, [members]);

  const calendarNameMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    calendarSources.forEach((calendar) => {
      map.set(calendar.id, { name: calendar.name, color: calendar.color });
    });
    return map;
  }, [calendarSources]);

  const getDisplayName = (event: (typeof calendarEvents)[number]) => {
    const byMember = event.createdBy?.id ? memberNameMap.get(event.createdBy.id) : undefined;
    const fromEvent = (event.createdBy as { displayName?: string; name?: string } | undefined)?.displayName;
    const byName = event.createdBy?.name ? memberDisplayByNameMap.get(event.createdBy.name) : undefined;
    return byMember || fromEvent || byName || event.createdBy?.name || "알 수 없음";
  };

  const formatEventTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatEventDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("ko-KR");
  };

  const getCalendarMeta = (event: (typeof calendarEvents)[number]) =>
    (event.calendarId ? calendarNameMap.get(event.calendarId) : undefined) || {
      name: "기본 캘린더",
      color: event.categoryColor || "#3b82f6",
    };

        return (
          <>
            {renderHeader(
              "Calendar Dashboard",
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-border bg-panel px-3 py-1.5 text-[11px] font-semibold text-foreground hover:bg-accent"
                onClick={() => onNavigate(`${pathname}/calendar`)}
              >
                일정으로 이동 <ArrowUpRight size={12} />
              </button>,
              renderDetailTabs(calendarTab, setCalendarTab, [
                { key: "all", label: "전체", icon: CalendarDays },
                { key: "calendars", label: "캘린더별", icon: LayoutGrid },
                { key: "events", label: "일정", icon: Clock4 },
                { key: "analytics", label: "분석", icon: LineChart },
              ])
            )}
            <section className="grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><CalendarDays size={16} /> 예정 일정</span>
                  <span className="text-xs text-muted">2주</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">{upcomingEvents.length}</div>
              </div>
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><LayoutGrid size={16} /> 캘린더 수</span>
                  <span className="text-xs text-muted">Source</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">{visibleCalendarBuckets.length}</div>
              </div>
            </section>
            {(calendarTab === "all" || calendarTab === "events") && (
              <section className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="mb-3 flex items-center gap-2 text-sm text-muted">
                  <Clock4 size={16} /> 다가오는 일정
                </div>
                <div className="space-y-2">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-panel px-3 py-2 text-xs">
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        {(() => {
                          const calendar = getCalendarMeta(event);
                          return (
                            <div
                              className="inline-flex max-w-[90px] items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                              style={{ backgroundColor: `${calendar.color}22`, color: calendar.color }}
                            >
                              <span className="truncate">{calendar.name}</span>
                            </div>
                          );
                        })()}
                        <div className="flex min-w-0 items-center gap-1">
                          <span
                            className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                            style={{
                              backgroundColor: `${(event.categoryColor || "#3b82f6")}22`,
                              color: event.categoryColor || "#3b82f6",
                            }}
                          >
                            {event.categoryName || "기본"}
                          </span>
                          <span className="truncate font-semibold text-foreground">{event.title}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-10 w-10 overflow-hidden rounded-full bg-muted/40">
                          {event.createdBy?.avatarUrl ? (
                            <img src={event.createdBy.avatarUrl} alt={getDisplayName(event)} className="h-full w-full object-cover" />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-muted">
                              {getDisplayName(event).slice(0, 1).toUpperCase()}
                            </span>
                          )}
                        </span>
                        <div className="flex min-w-0 flex-col text-left">
                          <span className="max-w-[120px] truncate text-[11px] font-medium text-foreground">{getDisplayName(event)}</span>
                          <span className="text-[11px] text-muted">{formatEventDate(event.start)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {upcomingEvents.length === 0 && (
                    <div className="rounded-lg border border-dashed border-border/70 px-3 py-2 text-xs text-muted">다가오는 일정이 없습니다.</div>
                  )}
                </div>
              </section>
            )}
            {(calendarTab === "all" || calendarTab === "calendars") && (
              <section className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="mb-3 flex items-center gap-2 text-sm text-muted">
                  <LayoutGrid size={16} /> 캘린더별 현황
                </div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCalendarBucketKey("all")}
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                      selectedCalendarBucketKey === "all" ? "border-brand/60 bg-brand/15 text-brand" : "border-border/70 bg-panel text-muted"
                    }`}
                  >
                    전체 캘린더
                  </button>
                  {visibleCalendarBuckets.map((bucket) => (
                    <button
                      key={bucket.key}
                      type="button"
                      onClick={() => setSelectedCalendarBucketKey(bucket.key)}
                      className="rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                      style={
                        selectedCalendarBucketKey === bucket.key
                          ? { borderColor: `${bucket.color}88`, backgroundColor: `${bucket.color}22`, color: bucket.color }
                          : undefined
                      }
                    >
                      {bucket.name}
                    </button>
                  ))}
                </div>
                <div className="mt-3 rounded-lg border border-border/60 bg-panel p-3">
                  <div className="mb-2 text-[11px] font-semibold text-muted">캘린더</div>
                  <div className="flex flex-wrap gap-2">
                  {visibleCalendarBuckets.map((bucket) => (
                    <button
                      key={bucket.key}
                      type="button"
                      onClick={() => setSelectedCalendarBucketKey(bucket.key)}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={
                        selectedCalendarBucketKey === bucket.key
                          ? { backgroundColor: `${bucket.color}22`, color: bucket.color, border: `1px solid ${bucket.color}88` }
                          : { backgroundColor: `${bucket.color}22`, color: bucket.color }
                      }
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: bucket.color }} />
                      {bucket.name} {bucket.count}개
                    </button>
                  ))}
                  {visibleCalendarBuckets.length === 0 && (
                    <span className="text-[11px] text-muted">캘린더 데이터가 없습니다.</span>
                  )}
                </div>
                </div>
                <div className="mt-3 rounded-lg border border-border/60 bg-panel p-3">
                  <div className="mb-2 text-[11px] font-semibold text-muted">카테고리</div>
                  <div className="flex flex-wrap gap-2">
                    {filteredCategoryBuckets.map((category) => (
                      <span
                        key={category.key}
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ backgroundColor: `${category.color}22`, color: category.color }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: category.color }} />
                        {category.name} {category.count}개
                      </span>
                    ))}
                    {filteredCategoryBuckets.length === 0 && <span className="text-[11px] text-muted">카테고리 데이터가 없습니다.</span>}
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-border/60 bg-panel p-4">
                  <div className="mb-3 flex items-center justify-center gap-1 text-xs font-semibold text-foreground">
                    <button
                      type="button"
                      className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border/70 bg-panel text-muted hover:bg-accent"
                      onClick={() => setShownMonth((prev) => subMonths(prev, 1))}
                      aria-label="이전 달"
                    >
                      <ChevronLeft size={13} />
                    </button>
                    <span>{format(shownMonth, "yyyy.MM")}</span>
                    <button
                      type="button"
                      className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border/70 bg-panel text-muted hover:bg-accent"
                      onClick={() => setShownMonth((prev) => addMonths(prev, 1))}
                      aria-label="다음 달"
                    >
                      <ChevronRight size={13} />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted">
                    {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                      <div key={day} className="py-1">{day}</div>
                    ))}
                  </div>
                  <div className="mt-1 grid grid-cols-7 gap-1">
                    {calendarMatrix.map((cell, idx) => (
                      <div key={idx} className="group relative min-h-[84px] rounded-md border border-border/50 bg-panel px-1.5 py-1.5 text-[11px]">
                        {cell.date ? (
                          <>
                            <div className="text-foreground">{cell.date.getDate()}</div>
                            <div className="mt-1 space-y-1">
                              {cell.categorySummaries.slice(0, 2).map((summary) => (
                                <div
                                  key={summary.key}
                                  className="inline-flex max-w-full items-center gap-1 truncate rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                                  style={{ backgroundColor: `${summary.color}22`, color: summary.color }}
                                >
                                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: summary.color }} />
                                  <span className="truncate">{`${summary.label} ${summary.count}개`}</span>
                                </div>
                              ))}
                              {cell.categorySummaries.length > 2 ? (
                                <div className="text-[10px] text-muted">{`+${cell.categorySummaries.length - 2}개 카테고리`}</div>
                              ) : null}
                            </div>
                            {cell.count > 0 ? (
                              <div className="pointer-events-none absolute left-1/2 top-full z-20 hidden w-60 -translate-x-1/2 rounded-lg border border-border bg-panel p-2 shadow-lg group-hover:block">
                                <div className="mb-1 text-[10px] font-semibold text-foreground">
                                  {format(cell.date, "yyyy.MM.dd")} · {cell.count}개 일정
                                </div>
                                <div className="max-h-40 space-y-1 overflow-auto pr-1">
                                  {cell.dayEvents.map((event) => (
                                    <div key={event.id} className="rounded-md border border-border/60 bg-panel px-2 py-1">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex min-w-0 items-center gap-1">
                                          <span
                                            className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                                            style={{ backgroundColor: `${(event.categoryColor || "#3b82f6")}22`, color: event.categoryColor || "#3b82f6" }}
                                          >
                                            {event.categoryName || "기본"}
                                          </span>
                                          <span className="truncate text-[10px] text-foreground">{event.title}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <span className="h-4 w-4 overflow-hidden rounded-full bg-muted/40">
                                            {event.createdBy?.avatarUrl ? (
                                              <img src={event.createdBy.avatarUrl} alt={getDisplayName(event)} className="h-full w-full object-cover" />
                                            ) : (
                                              <span className="flex h-full w-full items-center justify-center text-[9px] text-muted">
                                                {getDisplayName(event).slice(0, 1).toUpperCase()}
                                              </span>
                                            )}
                                          </span>
                                          <span className="max-w-[72px] truncate text-[10px] text-muted">{getDisplayName(event)}</span>
                                        </div>
                                      </div>
                                      <div className="mt-0.5 text-[10px] text-muted">{formatEventTime(event.start)}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
            {(calendarTab === "all" || calendarTab === "analytics") && (
              <>
              <section className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3 text-sm text-muted">
                  <span className="flex items-center gap-2"><LineChart size={16} /> 일정 그래프</span>
                  <div className="flex flex-col items-end gap-2">
                    {renderGraphFilter(
                      calendarGraphMode,
                      { day: calendarHourlyDate, month: calendarDailyMonth, year: calendarMonthlyYear },
                      (next) => {
                        setCalendarHourlyDate(next.day);
                        setCalendarDailyMonth(next.month);
                        setCalendarMonthlyYear(next.year);
                      }
                    )}
                    {renderGraphTabs(calendarGraphMode, setCalendarGraphMode)}
                  </div>
                </div>
                <div className="mt-4">
                  {calendarGraphMode === "hourly" && renderBars(calendarCounts.hourly.length ? calendarCounts.hourly : buildSeriesFromDates(filterDates(calendarEvents.map((e) => new Date(e.start).getTime()).filter((ts) => !Number.isNaN(ts)), "hourly", { day: calendarHourlyDate, month: calendarDailyMonth, year: calendarMonthlyYear })).hourly, 72)}
                  {calendarGraphMode === "daily" && renderBars(calendarCounts.daily.length ? calendarCounts.daily : buildSeriesFromDates(filterDates(calendarEvents.map((e) => new Date(e.start).getTime()).filter((ts) => !Number.isNaN(ts)), "daily", { day: calendarHourlyDate, month: calendarDailyMonth, year: calendarMonthlyYear })).daily, 72)}
                  {calendarGraphMode === "monthly" && renderBars(calendarCounts.monthly.length ? calendarCounts.monthly : buildSeriesFromDates(filterDates(calendarEvents.map((e) => new Date(e.start).getTime()).filter((ts) => !Number.isNaN(ts)), "monthly", { day: calendarHourlyDate, month: calendarDailyMonth, year: calendarMonthlyYear })).monthly, 72)}
                  {calendarGraphMode === "hourly" && renderRangeLabels("hourly", 24)}
                  {calendarGraphMode === "daily" && renderRangeLabels("daily", calendarCounts.daily.length || 31)}
                  {calendarGraphMode === "monthly" && renderRangeLabels("monthly", 12)}
                </div>
              </section>
              <section className="rounded-2xl border border-border bg-panel/70 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold text-foreground">캘린더별 비중</div>
                  <div className="relative">
                    <button
                      type="button"
                      className="inline-flex min-w-[180px] items-center justify-between rounded-full border border-border bg-panel px-3 py-1 text-[11px] text-foreground"
                      onClick={() => setAnalyticsMenuOpen((prev) => !prev)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {selectedAnalyticsCalendarKey !== "all" ? (
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: visibleCalendarBuckets.find((bucket) => bucket.key === selectedAnalyticsCalendarKey)?.color ?? "#64748b" }}
                          />
                        ) : null}
                        {selectedAnalyticsCalendarKey === "all"
                          ? "전체"
                          : visibleCalendarBuckets.find((bucket) => bucket.key === selectedAnalyticsCalendarKey)?.name ?? "전체"}
                      </span>
                      <span>▾</span>
                    </button>
                    {analyticsMenuOpen ? (
                      <div className="absolute right-0 z-20 mt-1 w-56 rounded-lg border border-border bg-panel p-1 shadow-sm">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAnalyticsCalendarKey("all");
                            setAnalyticsMenuOpen(false);
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[11px] text-foreground hover:bg-accent"
                        >
                          전체
                        </button>
                        {visibleCalendarBuckets.map((bucket) => (
                          <button
                            key={bucket.key}
                            type="button"
                            onClick={() => {
                              setSelectedAnalyticsCalendarKey(bucket.key);
                              setAnalyticsMenuOpen(false);
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
                  {selectedAnalyticsCalendarKey === "all" ? (
                    <PieStatCard title="캘린더별 비중" items={visibleCalendarBuckets.slice(0, 8)} />
                  ) : null}
                  <PieStatCard title="카테고리별 비중" items={analyticsCategoryBuckets.filter((bucket) => bucket.count > 0)} />
                </div>
              </section>
              </>
            )}
          </>
        );

}
