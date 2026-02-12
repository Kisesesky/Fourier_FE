// app/(workspace)/workspace/[teamId]/[projectId]/page.tsx
'use client';

import { useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MessageSquare, FolderKanban, Users, BookText, CalendarDays, Flame, CheckCircle2, Clock4, ArrowUpRight, Archive } from "lucide-react";
import { useProject } from "@/hooks/useProject";
import type { WorkspaceProjectPageProps } from "./_model/dashboard-page.types";
import ProjectModuleDetailView from "./_components/home-dashboard/ProjectModuleDetailView";
import { formatBytes, renderBars, renderDetailTabs, renderGraphFilter, renderGraphTabs, renderRangeLabels } from "./_components/home-dashboard/graph-ui";
import { useProjectHomeDashboardData } from "./_model/hooks/useProjectHomeDashboardData";
import { useProjectDashboardUiStore } from "./_model/store/useProjectDashboardUiStore";
import { ISSUE_STATUS_LABELS } from "./_model/dashboard-page.constants";

export default function WorkspaceProjectPage({ params }: WorkspaceProjectPageProps) {
  const teamId = decodeURIComponent(params.teamId);
  const projectId = decodeURIComponent(params.projectId);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") ?? "overview";

  const { project, loading, error } = useProject(teamId, projectId);
  const {
    messageGraphMode,
    setMessageGraphMode,
    issueGraphMode,
    setIssueGraphMode,
    memberGraphMode,
    setMemberGraphMode,
    docGraphMode,
    setDocGraphMode,
    calendarGraphMode,
    setCalendarGraphMode,
    messageHourlyDate,
    setMessageHourlyDate,
    messageDailyMonth,
    setMessageDailyMonth,
    messageMonthlyYear,
    setMessageMonthlyYear,
    issueHourlyDate,
    setIssueHourlyDate,
    issueDailyMonth,
    setIssueDailyMonth,
    issueMonthlyYear,
    setIssueMonthlyYear,
    memberHourlyDate,
    setMemberHourlyDate,
    memberDailyMonth,
    setMemberDailyMonth,
    memberMonthlyYear,
    setMemberMonthlyYear,
    docHourlyDate,
    setDocHourlyDate,
    docDailyMonth,
    setDocDailyMonth,
    docMonthlyYear,
    setDocMonthlyYear,
    calendarHourlyDate,
    setCalendarHourlyDate,
    calendarDailyMonth,
    setCalendarDailyMonth,
    calendarMonthlyYear,
    setCalendarMonthlyYear,
    chatTab,
    setChatTab,
    issueTab,
    setIssueTab,
    calendarTab,
    setCalendarTab,
    memberTab,
    setMemberTab,
    docsTab,
    setDocsTab,
    fileTab,
    setFileTab,
    resetUiState,
  } = useProjectDashboardUiStore();

  useEffect(() => {
    resetUiState();
  }, [projectId, teamId, resetUiState]);

  const {
    channels,
    channelActivity,
    chatUsers,
    currentUserId,
    memberCount,
    members,
    issueCount,
    issues,
    issueStats,
    docStats,
    docSnapshots,
    upcomingEvents,
    calendarEvents,
    fileCount,
    fileTotalBytes,
    recentFiles,
    recentDocs,
    chatStats,
    chatThreadRows,
    messageDates,
    messageCounts,
    issueCounts,
    memberCounts,
    docCounts,
    calendarCounts,
    issuesByStatus,
    calendarBuckets,
    calendarCategoryBuckets,
    calendarSources,
  } = useProjectHomeDashboardData({
    teamId,
    projectId,
    messageHourlyDate,
    messageDailyMonth,
    messageMonthlyYear,
    issueHourlyDate,
    issueDailyMonth,
    issueMonthlyYear,
    memberHourlyDate,
    memberDailyMonth,
    memberMonthlyYear,
    docHourlyDate,
    docDailyMonth,
    docMonthlyYear,
    calendarHourlyDate,
    calendarDailyMonth,
    calendarMonthlyYear,
  });

  const iconIsImage = useMemo(() => {
    const value = project?.iconValue ?? "";
    return /^https?:\/\//i.test(value) || value.startsWith("data:");
  }, [project?.iconValue]);
  useEffect(() => {
    if (!project) return;
    if (typeof window === "undefined") return;
    if (!pathname) return;
    const STORAGE_KEY = "recently-visited";
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Array<Record<string, unknown>>) : [];
      const next = parsed.map((item) => {
        if (item.path !== pathname) return item;
        return {
          ...item,
          title: project.name,
          description: project.description || "프로젝트",
          tag: "Project",
          iconValue: project.iconValue ?? "",
        };
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent("recently-visited:update"));
    } catch (err) {
      console.error("Failed to update recent visited title", err);
    }
  }, [pathname, project]);

  if (loading) {
    return <div className="px-8 py-6 text-muted">프로젝트 불러오는 중…</div>;
  }

  if (error || !project) {
    return (
      <div className="px-8 py-6 text-red-500">
        {error ?? "프로젝트를 찾을 수 없습니다."}
      </div>
    );
  }

  const renderHeader = (label?: string, action?: React.ReactNode, tabs?: React.ReactNode) => (
    <section className="rounded-3xl border border-border bg-panel/80 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <div className="h-12 w-12 overflow-hidden rounded-2xl border border-border bg-muted/30">
            {iconIsImage ? (
              <img src={project.iconValue} alt={project.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-foreground">
                {project.name.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{project.name}</h1>
        </div>
        {action}
      </div>
      <p className="mt-3 text-xs uppercase tracking-[0.25em] text-muted md:tracking-[0.4em]">{label ?? "Project Dashboard"}</p>
      {tabs ? <div className="mt-3">{tabs}</div> : null}
    </section>
  );

  const renderIssueSummary = () => (
    <section className="rounded-2xl border border-border bg-panel/70 p-6">
      <div className="flex items-center gap-2 text-sm text-muted">
        <CheckCircle2 size={16} /> 이슈 상태 요약
      </div>
      <div className="mt-4 space-y-3">
        {([
          { key: "backlog", label: ISSUE_STATUS_LABELS.backlog, color: "bg-slate-500", value: issueStats.backlog },
          { key: "todo", label: ISSUE_STATUS_LABELS.todo, color: "bg-rose-500", value: issueStats.todo },
          { key: "in_progress", label: ISSUE_STATUS_LABELS.in_progress, color: "bg-amber-500", value: issueStats.in_progress },
          { key: "review", label: ISSUE_STATUS_LABELS.review, color: "bg-violet-500", value: issueStats.review },
          { key: "done", label: ISSUE_STATUS_LABELS.done, color: "bg-emerald-500", value: issueStats.done },
        ] as const).map((row) => {
          const total = issueCount || 1;
          const pct = Math.round((row.value / total) * 100);
          return (
            <div key={row.key} className="flex items-center gap-3">
              <div className="w-24 text-xs text-muted">{row.label}</div>
              <div className="flex-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-border/60">
                  <div className={`h-full ${row.color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="w-12 text-right text-xs text-muted">{row.value}</div>
            </div>
          );
        })}
      </div>
    </section>
  );

  const renderOverview = () => (
    <>
      {renderHeader()}

      <section className="grid gap-5 md:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-2xl border border-border bg-panel/70 p-6">
          <div className="flex items-center justify-between text-sm text-muted">
            <span className="flex items-center gap-2"><MessageSquare size={16} /> 채팅</span>
            <span className="text-xs text-muted">Active</span>
          </div>
          <div className="mt-2 text-2xl font-semibold">{channels.length}</div>
        </div>
        <div className="rounded-2xl border border-border bg-panel/70 p-6">
          <div className="flex items-center justify-between text-sm text-muted">
            <span className="flex items-center gap-2"><FolderKanban size={16} /> 이슈</span>
            <span className="text-xs text-muted">Open</span>
          </div>
          <div className="mt-2 text-2xl font-semibold">{issueCount}</div>
        </div>
        <div className="rounded-2xl border border-border bg-panel/70 p-6">
          <div className="flex items-center justify-between text-sm text-muted">
            <span className="flex items-center gap-2"><Users size={16} /> 멤버</span>
            <span className="text-xs text-muted">Active</span>
          </div>
          <div className="mt-2 text-2xl font-semibold">{memberCount}</div>
        </div>
        <div className="rounded-2xl border border-border bg-panel/70 p-6">
          <div className="flex items-center justify-between text-sm text-muted">
            <span className="flex items-center gap-2"><Archive size={16} /> 파일</span>
            <span className="text-xs text-muted">Total</span>
          </div>
          <div className="mt-2 text-2xl font-semibold">{fileCount}</div>
        </div>
        <div className="rounded-2xl border border-border bg-panel/70 p-6">
          <div className="flex items-center justify-between text-sm text-muted">
            <span className="flex items-center gap-2"><BookText size={16} /> 문서</span>
            <span className="text-xs text-muted">Docs</span>
          </div>
          <div className="mt-2 text-2xl font-semibold">{docStats.pages}</div>
        </div>
        <div className="rounded-2xl border border-border bg-panel/70 p-6">
          <div className="flex items-center justify-between text-sm text-muted">
            <span className="flex items-center gap-2"><CalendarDays size={16} /> 일정</span>
            <span className="text-xs text-muted">14일</span>
          </div>
          <div className="mt-2 text-2xl font-semibold">{upcomingEvents.length}</div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-panel/70 p-6">
        <div className="flex items-center justify-between text-sm text-muted">
          <span className="flex items-center gap-2"><ArrowUpRight size={16} /> 빠른 이동</span>
          <span className="text-xs text-muted">모듈 바로가기</span>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <button
            type="button"
            className="flex items-center justify-between rounded-xl border border-border/60 bg-panel px-3 py-2 text-left text-xs hover:bg-accent"
            onClick={() => router.push(`${pathname}/chat`)}
          >
            <span className="flex items-center gap-2 text-foreground"><MessageSquare size={14} /> 채팅</span>
            <span className="hidden text-[11px] text-muted sm:inline">상세 보기</span>
          </button>
          <button
            type="button"
            className="flex items-center justify-between rounded-xl border border-border/60 bg-panel px-3 py-2 text-left text-xs hover:bg-accent"
            onClick={() => router.push(`${pathname}/issues`)}
          >
            <span className="flex items-center gap-2 text-foreground"><FolderKanban size={14} /> 이슈</span>
            <span className="hidden text-[11px] text-muted sm:inline">상세 보기</span>
          </button>
          <button
            type="button"
            className="flex items-center justify-between rounded-xl border border-border/60 bg-panel px-3 py-2 text-left text-xs hover:bg-accent"
            onClick={() => router.push(`${pathname}/calendar`)}
          >
            <span className="flex items-center gap-2 text-foreground"><CalendarDays size={14} /> 일정</span>
            <span className="hidden text-[11px] text-muted sm:inline">상세 보기</span>
          </button>
          <button
            type="button"
            className="flex items-center justify-between rounded-xl border border-border/60 bg-panel px-3 py-2 text-left text-xs hover:bg-accent"
            onClick={() => router.push(`${pathname}/members`)}
          >
            <span className="flex items-center gap-2 text-foreground"><Users size={14} /> 멤버</span>
            <span className="hidden text-[11px] text-muted sm:inline">상세 보기</span>
          </button>
          <button
            type="button"
            className="flex items-center justify-between rounded-xl border border-border/60 bg-panel px-3 py-2 text-left text-xs hover:bg-accent"
            onClick={() => router.push(`${pathname}/docs`)}
          >
            <span className="flex items-center gap-2 text-foreground"><BookText size={14} /> 문서</span>
            <span className="hidden text-[11px] text-muted sm:inline">상세 보기</span>
          </button>
          <button
            type="button"
            className="flex items-center justify-between rounded-xl border border-border/60 bg-panel px-3 py-2 text-left text-xs hover:bg-accent"
            onClick={() => router.push(`${pathname}/file`)}
          >
            <span className="flex items-center gap-2 text-foreground"><Archive size={14} /> 파일</span>
            <span className="hidden text-[11px] text-muted sm:inline">상세 보기</span>
          </button>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-border bg-panel/70 p-6">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Flame size={16} /> 최근 채널 활동
          </div>
          <div className="mt-4 space-y-4">
            {channels
              .map((ch) => ({
                id: ch.id,
                name: ch.name,
                lastTs: channelActivity[ch.id]?.lastMessageTs ?? 0,
                preview: channelActivity[ch.id]?.lastPreview ?? "최근 메시지 없음",
                isDm: ch.id.startsWith("dm:"),
                dmUser: (() => {
                  if (!ch.id.startsWith("dm:")) return null;
                  const ids = ch.id.replace(/^dm:/, "").split("+").filter(Boolean);
                  const partnerId = ids.find((id) => id !== currentUserId) ?? ids[0];
                  return partnerId ? chatUsers[partnerId] : null;
                })(),
              }))
              .sort((a, b) => b.lastTs - a.lastTs)
              .slice(0, 4)
              .map((entry) => (
                <div key={entry.id} className="relative pl-5">
                  <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-brand/80" />
                  <div className="rounded-xl border border-border/60 bg-panel px-3 py-2">
                    <div className="flex items-center justify-between text-[11px] text-muted">
                      <span className="flex items-center gap-2 font-semibold text-foreground">
                        {entry.isDm ? (
                          <span className="h-5 w-5 overflow-hidden rounded-full bg-muted/40">
                            {entry.dmUser?.avatarUrl ? (
                              <img src={entry.dmUser.avatarUrl} alt={entry.dmUser.name} className="h-full w-full object-cover" />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-[9px]">
                                {(entry.dmUser?.name ?? entry.name).slice(0, 1)}
                              </span>
                            )}
                          </span>
                        ) : null}
                        {entry.isDm ? (entry.dmUser?.name ?? entry.name) : `#${entry.name}`}
                      </span>
                      <span>
                        {entry.lastTs ? new Date(entry.lastTs).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    </div>
                    <div className="mt-1 truncate text-[11px] text-muted">{entry.preview}</div>
                  </div>
                </div>
              ))}
            {channels.length === 0 && (
              <div className="rounded-xl border border-dashed border-border/70 px-3 py-2 text-xs text-muted">
                아직 채널이 없습니다.
              </div>
            )}
          </div>
        </div>
        <div className="grid gap-5">
          <div className="rounded-2xl border border-border bg-panel/70 p-6">
            <div className="flex items-center gap-2 text-sm text-muted">
              <BookText size={16} /> Docs
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-muted">
              <div className="rounded-lg border border-border/60 bg-panel px-3 py-2">
                <div className="text-[11px]">페이지</div>
                <div className="mt-1 text-sm font-semibold text-foreground">{docStats.pages}</div>
              </div>
              <div className="rounded-lg border border-border/60 bg-panel px-3 py-2">
                <div className="text-[11px]">스냅샷</div>
                <div className="mt-1 text-sm font-semibold text-foreground">{docStats.snapshots}</div>
              </div>
              <div className="rounded-lg border border-border/60 bg-panel px-3 py-2">
                <div className="text-[11px]">최근 저장</div>
                <div className="mt-1 text-[11px] text-muted">
                  {docStats.lastSaved ? new Date(docStats.lastSaved).toLocaleDateString() : "-"}
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-panel/70 p-6">
            <div className="flex items-center gap-2 text-sm text-muted">
              <CalendarDays size={16} /> 일정
            </div>
            <div className="mt-3 space-y-2">
              {upcomingEvents.length === 0 && (
                <div className="rounded-lg border border-dashed border-border/70 px-3 py-2 text-xs text-muted">
                  다가오는 일정이 없습니다.
                </div>
              )}
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-2 rounded-lg border border-border/60 bg-panel px-3 py-2">
                  <Clock4 size={14} className="text-muted" />
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-foreground">{event.title}</div>
                    <div className="text-[11px] text-muted">
                      {new Date(event.start).toLocaleDateString()} · {new Date(event.start).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {renderIssueSummary()}
    </>
  );


  const detailModel = {
    chatTab,
    setChatTab,
    channels,
    channelActivity,
    chatUsers,
    currentUserId,
    chatStats,
    chatThreadRows,
    messageGraphMode,
    setMessageGraphMode,
    messageHourlyDate,
    setMessageHourlyDate,
    messageDailyMonth,
    setMessageDailyMonth,
    messageMonthlyYear,
    setMessageMonthlyYear,
    messageCounts,
    messageDates,
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
    memberTab,
    setMemberTab,
    memberCount,
    memberGraphMode,
    setMemberGraphMode,
    memberHourlyDate,
    setMemberHourlyDate,
    memberDailyMonth,
    setMemberDailyMonth,
    memberMonthlyYear,
    setMemberMonthlyYear,
    memberCounts,
    members,
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
    calendarTab,
    setCalendarTab,
    upcomingEvents,
    calendarBuckets,
    calendarCategoryBuckets,
    calendarSources,
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
    fileTab,
    setFileTab,
    fileCount,
    fileTotalBytes,
    recentFiles,
  };

  return (
    <div className="flex min-h-full flex-col gap-6 px-4 pb-16 pt-6 md:px-8 md:pb-20">
      {view === "overview" ? (
        renderOverview()
      ) : (
        <ProjectModuleDetailView
          view={view}
          pathname={pathname}
          onNavigate={(href) => router.push(href)}
          renderHeader={renderHeader}
          renderIssueSummary={renderIssueSummary}
          renderDetailTabs={(current, setCurrent, tabs) => renderDetailTabs(current, setCurrent, tabs)}
          renderGraphTabs={renderGraphTabs}
          renderGraphFilter={renderGraphFilter}
          renderBars={renderBars}
          renderRangeLabels={renderRangeLabels}
          formatBytes={formatBytes}
          model={detailModel}
        />
      )}
    </div>
  );
}
