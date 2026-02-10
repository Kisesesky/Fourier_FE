// app/(workspace)/workspace/[teamId]/[projectId]/issues/_components/views/IssuesDashboardView.tsx
'use client';

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock4,
  Layers,
  Sparkles,
  Users,
} from "lucide-react";

import type { Issue } from "@/workspace/issues/_model/types";
import {
  ISSUE_GROUP_PALETTE,
  ISSUE_PRIORITY_META_DASHBOARD,
  ISSUE_STATUS_META_DASHBOARD,
} from "@/workspace/issues/_model/analytics.constants";
import type { IssuesAnalyticsViewProps } from "@/workspace/issues/_model/view.types";

const parseDateValue = (value?: string) => {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

const formatCount = (value: number) => new Intl.NumberFormat("ko-KR").format(value);

export default function IssuesDashboardView({ issues, memberMap, issueGroups, loading }: IssuesAnalyticsViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [recentSort, setRecentSort] = useState<"updated" | "created">("updated");
  const [recentLimit, setRecentLimit] = useState(5);
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
  const hasMoreRecent = recentLimit < flatIssues.length;

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

  const totalCount = flatIssues.length;
  const doneCount = flatIssues.filter((issue) => issue.status === "done").length;
  const inProgressCount = flatIssues.filter((issue) => issue.status === "in_progress").length;
  const urgentCount = flatIssues.filter((issue) => issue.priority === "urgent").length;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const overdueCount = flatIssues.filter((issue) => {
    if (issue.status === "done") return false;
    const endAt = parseDateValue(issue.endAt);
    if (!endAt) return false;
    return endAt.getTime() < todayStart.getTime();
  }).length;
  const progressPct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  const statusCounts = useMemo(
    () =>
      ISSUE_STATUS_META_DASHBOARD.map((status) => ({
        ...status,
        value: flatIssues.filter((issue) => issue.status === status.key).length,
      })),
    [flatIssues],
  );

  const priorityCounts = useMemo(
    () =>
      ISSUE_PRIORITY_META_DASHBOARD.map((priority) => ({
        ...priority,
        value: flatIssues.filter((issue) => issue.priority === priority.key).length,
      })),
    [flatIssues],
  );

  const assigneeCounts = useMemo(() => {
    const map = new Map<string, { label: string; value: number; avatarUrl?: string | null }>();
    flatIssues.forEach((issue) => {
      const key = issue.assigneeId ?? issue.assignee ?? "unassigned";
      const label = issue.assigneeId ? memberMap[issue.assigneeId]?.name ?? issue.assigneeId : issue.assignee ?? "미지정";
      const avatarUrl = issue.assigneeId ? memberMap[issue.assigneeId]?.avatarUrl ?? null : null;
      const entry = map.get(key) ?? { label, value: 0, avatarUrl };
      entry.value += 1;
      map.set(key, entry);
    });
    return Array.from(map.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [flatIssues, memberMap]);

  const groupCounts = useMemo(() => {
    const map = new Map<string, { label: string; value: number; color: string }>();
    flatIssues.forEach((issue) => {
      const group = resolveGroup(issue);
      const key = group?.id ?? "ungrouped";
      const label = group?.name ?? "미분류";
      const color = group?.color ?? ISSUE_GROUP_PALETTE[map.size % ISSUE_GROUP_PALETTE.length];
      const entry = map.get(key) ?? { label, value: 0, color };
      entry.value += 1;
      map.set(key, entry);
    });
    return Array.from(map.values()).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [flatIssues, issueGroups]);

  const recentIssues = useMemo(() => {
    const sorted = [...flatIssues].sort((a, b) => {
      const aTs = recentSort === "created" ? new Date(a.createdAt).getTime() : new Date(a.updatedAt || a.createdAt).getTime();
      const bTs = recentSort === "created" ? new Date(b.createdAt).getTime() : new Date(b.updatedAt || b.createdAt).getTime();
      return bTs - aTs;
    });
    return sorted.slice(0, recentLimit);
  }, [flatIssues, recentLimit, recentSort]);

  const handleOpenIssue = (issueId: string) => {
    const basePath = pathname.replace(/\/issues(?:\/.*)?$/, "/issues");
    router.push(`${basePath}/${issueId}`);
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-panel/60 p-6 text-sm text-muted">
        대시보드를 불러오는 중입니다.
      </div>
    );
  }

  if (!flatIssues.length) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 bg-panel/60 px-6 py-10 text-center text-sm text-muted">
        아직 표시할 이슈가 없습니다. 이슈를 추가하면 대시보드가 자동으로 채워집니다.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-border bg-panel/70 p-4">
          <div className="flex items-center justify-between text-md font-semibold text-muted">
            <span className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500 text-cyan-200">
                <Sparkles size={15} />
              </span>
              전체 이슈
            </span>
          </div>
          <div className="mt-2 text-2xl font-semibold">{formatCount(totalCount)}</div>
          <div className="mt-2 text-xs text-muted">진행률 {progressPct}%</div>
        </div>
        <div className="rounded-2xl border border-border bg-panel/70 p-4">
          <div className="flex items-center justify-between text-md font-semibold text-muted">
            <span className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-emerald-200">
                <CheckCircle2 size={15} />
              </span>
              완료
            </span>
          </div>
          <div className="mt-2 text-2xl font-semibold">{formatCount(doneCount)}</div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border/60">
            <div className="h-full bg-emerald-400" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-panel/70 p-4">
          <div className="flex items-center justify-between text-md font-semibold text-muted">
            <span className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-amber-200">
                <Clock4 size={15} />
              </span>
              진행 중
            </span>
          </div>
          <div className="mt-2 text-2xl font-semibold">{formatCount(inProgressCount)}</div>
          <div className="mt-2 text-xs text-muted">활성 이슈 {formatCount(totalCount - doneCount)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-panel/70 p-4">
          <div className="flex items-center justify-between text-md font-semibold text-muted">
            <span className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-500 text-rose-200">
                <AlertTriangle size={15} />
              </span>
              마감 경과
            </span>
          </div>
          <div className="mt-2 text-2xl font-semibold">{formatCount(overdueCount)}</div>
          <div className="mt-2 text-xs text-muted">매우높음 {formatCount(urgentCount)}건</div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-panel/70 p-5">
          <div className="flex items-center gap-2 text-md font-semibold text-violet-500">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500 text-white">
              <Layers size={16} />
            </span>
            상태 분포
          </div>
          <div className="mt-4 space-y-3">
            {statusCounts.map((item) => {
              const total = totalCount || 1;
              const pct = Math.round((item.value / total) * 100);
              return (
                <div key={item.key} className="group relative flex items-center gap-3">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${item.chip}`}>{item.label}</span>
                  <div className="flex-1">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-border/60">
                      <div className={`h-full ${item.bar}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className={`w-12 text-right text-xs font-bold ${item.result}`}>{pct}%</div>
                  <div className="pointer-events-none absolute -top-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-border/80 bg-panel px-2 py-0.5 text-[10px] text-foreground shadow-md opacity-0 transition-opacity group-hover:opacity-100">
                    {item.label} · {item.value}건
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-panel/70 p-5">
          <div className="flex items-center gap-2 text-md font-semibold text-yellow-500">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-500 text-white">
              <AlertTriangle size={16} />
            </span>
            우선순위 분포
          </div>
          <div className="mt-4 space-y-3">
            {priorityCounts.map((item) => {
              const total = totalCount || 1;
              const pct = Math.round((item.value / total) * 100);
              return (
                <div key={item.key} className="group relative flex items-center gap-3">
                  <div className={`rounded-full px-3 py-0.5 text-[10px] ${item.chip}`}>{item.label}</div>
                  <div className="flex-1">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-border/60">
                      <div className={`h-full ${item.bar}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className={`w-12 text-right text-xs font-bold ${item.result}`}>{pct}%</div>
                  <div className="pointer-events-none absolute -top-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-border/80 bg-panel px-2 py-0.5 text-[10px] text-foreground shadow-md opacity-0 transition-opacity group-hover:opacity-100">
                    {item.label} · {item.value}건
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-panel/70 p-5">
          <div className="flex items-center gap-2 text-md font-semibold text-green-400">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-400 text-white">
              <Users size={16} />
            </span>
            담당자 분포
          </div>
          <div className="mt-4 space-y-3 text-xs">
            {assigneeCounts.map((item) => {
              const total = totalCount || 1;
              const pct = Math.round((item.value / total) * 100);
              const initials = item.label?.trim().slice(0, 2) || "??";
              return (
                <div key={`${item.label}-${item.value}`} className="flex items-center gap-3">
                  <div className="flex w-28 items-center gap-2 text-muted">
                    {item.avatarUrl ? (
                      <img src={item.avatarUrl} alt={item.label} className="h-7 w-7 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-border/60 text-[10px] text-muted">
                        {initials}
                      </div>
                    )}
                    <span className="truncate font-semibold">{item.label}</span>
                  </div>
                  <div className="flex-1">
                    <div className="h-3 w-full overflow-hidden rounded-full bg-border/60">
                      <div className="h-full bg-cyan-400" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="w-12 text-right text-xs text-muted">{item.value}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-panel/70 p-5">
          <div className="flex items-center gap-2 text-md font-semibold text-sky-400">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-400 text-white">
              <Layers size={16} />
            </span>
            그룹 분포
          </div>
          <div className="mt-4 space-y-3 text-xs">
            {groupCounts.map((item) => {
              const total = totalCount || 1;
              const pct = Math.round((item.value / total) * 100);
              return (
                <div key={`${item.label}-${item.value}`} className="flex items-center gap-3">
                  <div className="flex w-28 items-center gap-2 text-muted">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="truncate font-semibold">{item.label}</span>
                  </div>
                  <div className="flex-1">
                    <div className="h-3 w-full overflow-hidden rounded-full bg-border/60">
                      <div className="h-full" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                    </div>
                  </div>
                  <div className="w-12 text-right text-xs text-muted">{item.value}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-panel/70 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 text-md font-semibold text-rose-400">
          <span className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-400 text-white">
              <Clock4 size={16} />
            </span>
            최근 이슈
            <span className="rounded-full bg-rose-400 px-2 py-0.5 text-[10px] text-white">
              {recentIssues.length}개
            </span>
          </span>
          <div className="inline-flex rounded-full bg-sky-400 p-1 font-semibold text-[11px] text-muted">
            {([
              { key: "updated", label: "업데이트순" },
              { key: "created", label: "생성순" },
            ] as const).map((item) => (
              <button
                key={item.key}
                type="button"
                className={`rounded-full px-3 py-1.5 transition ${recentSort === item.key ? "bg-accent text-foreground" : "hover:text-foreground"}`}
                onClick={() => setRecentSort(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          {recentIssues.map((issue) => {
            const statusMeta = ISSUE_STATUS_META_DASHBOARD.find((item) => item.key === issue.status);
            const priorityMeta = ISSUE_PRIORITY_META_DASHBOARD.find((item) => item.key === issue.priority);
            const assigneeName = issue.assigneeId
              ? memberMap[issue.assigneeId]?.name ?? issue.assigneeId
              : issue.assignee ?? "미지정";
            const assigneeAvatar = issue.assigneeId ? memberMap[issue.assigneeId]?.avatarUrl ?? null : null;
            return (
              <button
                key={issue.id}
                type="button"
                onClick={() => handleOpenIssue(issue.id)}
                className="w-full rounded-xl border border-border/60 bg-panel px-3 py-3 text-left text-xs transition hover:border-border/80 hover:bg-panel/80"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {assigneeAvatar ? (
                      <img src={assigneeAvatar} alt={assigneeName} className="h-6 w-6 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-border/60 text-[10px] text-muted">
                        {assigneeName.trim().slice(0, 2) || "??"}
                      </div>
                    )}
                    <div className="text-xs text-muted">{assigneeName}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {statusMeta && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${statusMeta.chip}`}>
                        {statusMeta.label}
                      </span>
                    )}
                    {priorityMeta && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${priorityMeta.bar} text-white`}>
                        {priorityMeta.label}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-2 text-sm font-medium text-foreground">{issue.title}</div>
                <div className="mt-1 text-[10px] text-muted">
                  {recentSort === "created" ? "생성일" : "업데이트"}{" "}
                  {new Date(recentSort === "created" ? issue.createdAt : issue.updatedAt || issue.createdAt).toLocaleDateString("ko-KR")}
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex justify-center">
          {hasMoreRecent ? (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-panel px-4 py-2 text-[11px] text-muted transition hover:border-border/80 hover:text-foreground"
              onClick={() => setRecentLimit((prev) => prev + 5)}
            >
              더보기
            </button>
          ) : (
            <span className="text-[11px] text-muted">모든 이슈를 표시했습니다.</span>
          )}
        </div>
      </section>
    </div>
  );
}
