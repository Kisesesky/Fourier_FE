// app/(workspace)/workspace/[teamId]/[projectId]/_components/home-dashboard/details/DocsDetailView.tsx
'use client';

import { ArrowUpRight, BookText, Clock4, FileText, FolderOpen, LineChart } from 'lucide-react';
import { buildSeriesFromDates, filterDates } from '../../../_model/dashboard-page.utils';
import type { DetailViewBaseProps } from './detail-view.types';

export default function DocsDetailView({ pathname, onNavigate, renderHeader, renderDetailTabs, renderGraphFilter, renderGraphTabs, renderBars, model }: DetailViewBaseProps) {
  const {
    docsTab,
    setDocsTab,
    docStats,
    recentDocs,
    docGraphMode,
    setDocGraphMode,
    docHourlyDate,
    setDocHourlyDate,
    docDailyMonth,
    setDocDailyMonth,
    docMonthlyYear,
    setDocMonthlyYear,
    docCounts,
    docSnapshots,
  } = model;
        return (
          <>
            {renderHeader(
              "Docs Dashboard",
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-border bg-panel px-3 py-1.5 text-[11px] font-semibold text-foreground hover:bg-accent"
                onClick={() => onNavigate(`${pathname}/docs`)}
              >
                Docs로 이동 <ArrowUpRight size={12} />
              </button>
            )}
            <section className="rounded-2xl border border-border bg-panel/70 p-4">
              {renderDetailTabs(docsTab, setDocsTab, [
                { key: "all", label: "전체", icon: BookText },
                { key: "documents", label: "문서", icon: FileText },
                { key: "activity", label: "활동", icon: FolderOpen },
                { key: "analytics", label: "분석", icon: LineChart },
              ])}
            </section>
            <section className="grid gap-5 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><BookText size={16} /> 문서</span>
                  <span className="text-xs text-muted">Pages</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">{docStats.pages}</div>
              </div>
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><BookText size={16} /> 스냅샷</span>
                  <span className="text-xs text-muted">Snapshots</span>
                </div>
                <div className="mt-2 text-2xl font-semibold">{docStats.snapshots}</div>
              </div>
              <div className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex items-center justify-between text-sm text-muted">
                  <span className="flex items-center gap-2"><Clock4 size={16} /> 최근 저장</span>
                  <span className="text-xs text-muted">Last Saved</span>
                </div>
                <div className="mt-2 text-sm font-semibold text-foreground">
                  {docStats.lastSaved ? new Date(docStats.lastSaved).toLocaleString("ko-KR") : "-"}
                </div>
              </div>
            </section>
            {(docsTab === "all" || docsTab === "documents") && (
              <section className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="mb-3 flex items-center gap-2 text-sm text-muted">
                  <FileText size={16} /> 최근 문서
                </div>
                <div className="space-y-2">
                  {recentDocs.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-panel px-3 py-2 text-left text-xs hover:bg-accent"
                      onClick={() => onNavigate(`${pathname}/docs/${doc.id}`)}
                    >
                      <span className="truncate font-semibold text-foreground">{doc.title}</span>
                      <span className="text-[11px] text-muted">{new Date(doc.updatedAt).toLocaleDateString("ko-KR")}</span>
                    </button>
                  ))}
                  {recentDocs.length === 0 && (
                    <div className="rounded-lg border border-dashed border-border/70 px-3 py-2 text-xs text-muted">문서가 없습니다.</div>
                  )}
                </div>
              </section>
            )}
            {(docsTab === "all" || docsTab === "activity" || docsTab === "analytics") && (
              <section className="rounded-2xl border border-border bg-panel/70 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3 text-sm text-muted">
                  <span className="flex items-center gap-2"><LineChart size={16} /> 문서 그래프</span>
                  <div className="flex flex-col items-end gap-2">
                    {renderGraphFilter(
                      docGraphMode,
                      { day: docHourlyDate, month: docDailyMonth, year: docMonthlyYear },
                      (next) => {
                        setDocHourlyDate(next.day);
                        setDocDailyMonth(next.month);
                        setDocMonthlyYear(next.year);
                      }
                    )}
                    {renderGraphTabs(docGraphMode, setDocGraphMode)}
                  </div>
                </div>
                <div className="mt-4">
                  {docGraphMode === "hourly" && renderBars(docCounts.hourly.length ? docCounts.hourly : buildSeriesFromDates(filterDates(docSnapshots, "hourly", { day: docHourlyDate, month: docDailyMonth, year: docMonthlyYear })).hourly, 72)}
                  {docGraphMode === "daily" && renderBars(docCounts.daily.length ? docCounts.daily : buildSeriesFromDates(filterDates(docSnapshots, "daily", { day: docHourlyDate, month: docDailyMonth, year: docMonthlyYear })).daily, 72)}
                  {docGraphMode === "monthly" && renderBars(docCounts.monthly.length ? docCounts.monthly : buildSeriesFromDates(filterDates(docSnapshots, "monthly", { day: docHourlyDate, month: docDailyMonth, year: docMonthlyYear })).monthly, 72)}
                </div>
              </section>
            )}
          </>
        );

}
