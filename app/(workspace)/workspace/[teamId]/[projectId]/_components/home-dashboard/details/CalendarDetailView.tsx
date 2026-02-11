// app/(workspace)/workspace/[teamId]/[projectId]/_components/home-dashboard/details/CalendarDetailView.tsx
'use client';

import { ArrowUpRight, CalendarDays, Clock4, LayoutGrid, LineChart } from 'lucide-react';
import { buildSeriesFromDates, filterDates } from '../../../_model/dashboard-page.utils';
import type { DetailViewBaseProps } from './detail-view.types';

export default function CalendarDetailView({ pathname, onNavigate, renderHeader, renderDetailTabs, renderGraphFilter, renderGraphTabs, renderBars, model }: DetailViewBaseProps) {
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
  } = model;
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
              </button>
            )}
            <section className="rounded-2xl border border-border bg-panel/70 p-4">
              {renderDetailTabs(calendarTab, setCalendarTab, [
                { key: "all", label: "전체", icon: CalendarDays },
                { key: "calendars", label: "캘린더별", icon: LayoutGrid },
                { key: "events", label: "일정", icon: Clock4 },
                { key: "analytics", label: "분석", icon: LineChart },
              ])}
            </section>
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
                <div className="mt-2 text-2xl font-semibold">{calendarBuckets.length}</div>
              </div>
            </section>
            {(calendarTab === "all" || calendarTab === "events") && (
              <section className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="mb-3 flex items-center gap-2 text-sm text-muted">
                  <Clock4 size={16} /> 다가오는 일정
                </div>
                <div className="space-y-2">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-panel px-3 py-2 text-xs">
                      <span className="truncate font-semibold text-foreground">{event.title}</span>
                      <span className="text-[11px] text-muted">{new Date(event.start).toLocaleDateString("ko-KR")}</span>
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
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {calendarBuckets.map((bucket) => (
                    <div key={bucket.key} className="rounded-lg border border-border/60 bg-panel px-3 py-2 text-xs">
                      <div className="truncate font-semibold text-foreground">{bucket.name}</div>
                      <div className="mt-1 text-muted">{bucket.count}개 일정</div>
                    </div>
                  ))}
                  {calendarBuckets.length === 0 && (
                    <div className="rounded-lg border border-dashed border-border/70 px-3 py-2 text-xs text-muted">캘린더 데이터가 없습니다.</div>
                  )}
                </div>
              </section>
            )}
            {(calendarTab === "all" || calendarTab === "analytics") && (
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
                </div>
              </section>
            )}
          </>
        );

}
