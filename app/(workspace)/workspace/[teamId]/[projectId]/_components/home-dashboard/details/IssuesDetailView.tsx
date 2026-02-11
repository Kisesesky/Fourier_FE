// app/(workspace)/workspace/[teamId]/[projectId]/_components/home-dashboard/details/IssuesDetailView.tsx
'use client';

import { ArrowUpRight, CalendarDays, CheckCircle2, Clock4, FolderKanban, LayoutGrid, LineChart, Table2 } from 'lucide-react';
import { ISSUE_PRIORITY_STYLES, ISSUE_STATUS_STYLES } from '../../../_model/dashboard-page.constants';
import { buildSeriesFromDates, filterDates } from '../../../_model/dashboard-page.utils';
import type { DetailViewBaseProps } from './detail-view.types';

export default function IssuesDetailView({ pathname, onNavigate, renderHeader, renderIssueSummary, renderDetailTabs, renderGraphFilter, renderGraphTabs, renderBars, model }: DetailViewBaseProps) {
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
  } = model;
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
              </button>
            )}
            <section className="rounded-2xl border border-border bg-panel/70 p-4">
              {renderDetailTabs(issueTab, setIssueTab, [
                { key: "all", label: "전체", icon: FolderKanban },
                { key: "table", label: "테이블", icon: Table2 },
                { key: "kanban", label: "칸반", icon: LayoutGrid },
                { key: "timeline", label: "타임라인", icon: CalendarDays },
                { key: "chart", label: "차트", icon: LineChart },
              ])}
            </section>
            <section className="grid gap-5 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><FolderKanban size={16} /> 총 이슈</span>
                  <span className="text-xs text-muted">Open</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">{issueCount}</div>
              </div>
              <div className="rounded-2xl border border-border bg-panel/70 p-4">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><CheckCircle2 size={16} /> 완료</span>
                  <span className="text-xs text-muted">Done</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">{issueStats.done}</div>
              </div>
              <div className="rounded-2xl border border-border bg-panel/70 p-4">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><Clock4 size={16} /> 진행중</span>
                  <span className="text-xs text-muted">In Progress</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">{issueStats.in_progress}</div>
              </div>
            </section>
            {(issueTab === "all" || issueTab === "chart") && (
              <>
                {renderIssueSummary()}
                <section className="rounded-2xl border border-border bg-panel/70 p-6">
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
                  </div>
                </section>
              </>
            )}
            {(issueTab === "all" || issueTab === "table") && (
              <section className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="mb-3 flex items-center gap-2 text-sm text-muted">
                  <Table2 size={16} /> 최근 업데이트 테이블
                </div>
                <div className="overflow-hidden rounded-lg border border-border/60">
                  <div className="grid grid-cols-[1.4fr_120px_120px_110px] bg-panel px-3 py-2 text-[11px] text-muted">
                    <span>이슈</span>
                    <span>상태</span>
                    <span>우선순위</span>
                    <span>수정일</span>
                  </div>
                  <div className="divide-y divide-border/60">
                    {issues
                      .slice()
                      .sort((a: any, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                      .slice(0, 10)
                      .map((issue) => (
                        <button
                          key={issue.id}
                          type="button"
                          onClick={() => onNavigate(`${pathname}/issues/${issue.id}`)}
                          className="grid w-full grid-cols-[1.4fr_120px_120px_110px] items-center px-3 py-2 text-left text-xs hover:bg-accent"
                        >
                          <span className="truncate font-medium text-foreground">{issue.title}</span>
                          <span className={`w-fit rounded-full border px-2 py-0.5 text-[10px] ${ISSUE_STATUS_STYLES[issue.status] ?? "border-border/60 bg-panel text-muted"}`}>{issue.status}</span>
                          <span className={`w-fit rounded-full border px-2 py-0.5 text-[10px] ${ISSUE_PRIORITY_STYLES[issue.priority ?? "normal"] ?? "border-border/60 bg-panel text-muted"}`}>{issue.priority ?? "normal"}</span>
                          <span className="text-[11px] text-muted">{new Date(issue.updatedAt).toLocaleDateString("ko-KR")}</span>
                        </button>
                      ))}
                  </div>
                </div>
              </section>
            )}
            {(issueTab === "all" || issueTab === "kanban") && (
              <section className="grid gap-4 lg:grid-cols-5">
                {(["backlog", "todo", "in_progress", "review", "done"] as const).map((status) => (
                  <div key={status} className="rounded-2xl border border-border bg-panel/70 p-4">
                    <div className="mb-3 flex items-center justify-between text-xs">
                      <span className={`rounded-full border px-2 py-0.5 ${ISSUE_STATUS_STYLES[status] ?? "border-border/60 bg-panel text-muted"}`}>{status}</span>
                      <span className="text-muted">{issuesByStatus[status].length}</span>
                    </div>
                    <div className="space-y-2">
                      {issuesByStatus[status].slice(0, 4).map((issue) => (
                        <button
                          key={issue.id}
                          type="button"
                          onClick={() => onNavigate(`${pathname}/issues/${issue.id}`)}
                          className="w-full rounded-lg border border-border/60 bg-panel px-2 py-2 text-left text-[11px] hover:bg-accent"
                        >
                          <div className="truncate font-medium text-foreground">{issue.title}</div>
                        </button>
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
                    .map((issue) => (
                      <div key={issue.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-panel px-3 py-2 text-xs">
                        <div className="min-w-0">
                          <div className="truncate font-medium text-foreground">{issue.title}</div>
                          <div className="text-[11px] text-muted">
                            {(issue.startAt ? new Date(issue.startAt).toLocaleDateString("ko-KR") : "-")} ~ {(issue.endAt ? new Date(issue.endAt).toLocaleDateString("ko-KR") : "-")}
                          </div>
                        </div>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] ${ISSUE_STATUS_STYLES[issue.status] ?? "border-border/60 bg-panel text-muted"}`}>{issue.status}</span>
                      </div>
                    ))}
                </div>
              </section>
            )}
          </>
        );

}
