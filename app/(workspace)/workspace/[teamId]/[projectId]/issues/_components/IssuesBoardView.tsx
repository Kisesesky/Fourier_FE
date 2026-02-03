"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  ArrowDownAZ,
  ArrowDownWideNarrow,
  ArrowUpAZ,
  ArrowUpWideNarrow,
  BarChart3,
  CalendarRange,
  Filter,
  KanbanSquare,
  LayoutDashboard,
  MoreHorizontal,
  Table2,
} from "lucide-react";

import NewIssueDialog from "@/workspace/issues/_components/NewIssueDialog";
import RightPanel from "@/workspace/issues/_components/RightPanel";
import type { Issue } from "@/workspace/issues/_model/types";
import { createIssue, getIssueBoard, updateIssueStatus } from "@/workspace/issues/_service/api";
import { fetchProjectMembers } from "@/lib/projects";
import { useAuthProfile } from "@/hooks/useAuthProfile";

const BASE_COLUMNS: Array<{ key: Issue["status"]; label: string }> = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "review", label: "Review" },
  { key: "done", label: "Done" },
];

type ViewMode = "table" | "timeline" | "kanban" | "chart" | "dashboard";

const VIEW_TABS: Array<{ key: ViewMode; label: string; icon: typeof Table2 }> = [
  { key: "table", label: "메인 테이블", icon: Table2 },
  { key: "timeline", label: "타임라인", icon: CalendarRange },
  { key: "kanban", label: "칸반", icon: KanbanSquare },
  { key: "chart", label: "차트", icon: BarChart3 },
  { key: "dashboard", label: "대시보드", icon: LayoutDashboard },
];

export default function IssuesBoardView() {
  const params = useParams<{ teamId?: string; projectId?: string; id?: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const teamId = params?.teamId as string | undefined;
  const projectId = params?.projectId as string | undefined;
  const routeId = params?.id as string | undefined;

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberMap, setMemberMap] = useState<Record<string, { name: string; avatarUrl?: string | null }>>({});
  const [issueTags, setIssueTags] = useState<Record<string, string[]>>({});
  const { profile } = useAuthProfile();
  const [statusFilter, setStatusFilter] = useState<Set<Issue["status"]>>(new Set());
  const [priorityFilter, setPriorityFilter] = useState<Set<Issue["priority"]>>(new Set());
  const [ownerFilter, setOwnerFilter] = useState<Set<string>>(new Set());
  const [tagFilter, setTagFilter] = useState<Set<string>>(new Set());
  const [prioritySort, setPrioritySort] = useState<"none" | "asc" | "desc">("none");
  const [ownerSort, setOwnerSort] = useState<"none" | "asc" | "desc">("none");
  const [openFilter, setOpenFilter] = useState<null | "status" | "priority" | "owner" | "tag">(null);
  const filterRef = useRef<HTMLDivElement | null>(null);
  const [view, setView] = useState<ViewMode>("kanban");

  const refresh = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await getIssueBoard(projectId);
      setIssues(data ?? []);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!projectId || typeof window === "undefined") return;
    const raw = window.localStorage.getItem(`fd.issue.tags:${projectId}`);
    if (!raw) {
      setIssueTags({});
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Record<string, string[]>;
      setIssueTags(parsed ?? {});
    } catch {
      setIssueTags({});
    }
  }, [projectId]);

  useEffect(() => {
    if (!teamId || !projectId) return;
    fetchProjectMembers(teamId, projectId)
      .then((data) => {
        const map: Record<string, { name: string; avatarUrl?: string | null }> = {};
        (data ?? []).forEach((member: { userId?: string; id?: string; name: string; avatarUrl?: string | null }) => {
          const id = member.userId ?? member.id ?? member.name;
          if (!id) return;
          map[id] = { name: member.name, avatarUrl: member.avatarUrl ?? null };
        });
        setMemberMap(map);
      })
      .catch(() => setMemberMap({}));
  }, [teamId, projectId]);

  useEffect(() => {
    if (!openFilter) return;
    const onClick = (event: MouseEvent) => {
      if (!filterRef.current) return;
      if (event.target instanceof Node && !filterRef.current.contains(event.target)) {
        setOpenFilter(null);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [openFilter]);

  const columns = useMemo(() => {
    const hasBacklog = issues.some((issue) => issue.status === "backlog");
    return hasBacklog ? [{ key: "backlog" as const, label: "Backlog" }, ...BASE_COLUMNS] : BASE_COLUMNS;
  }, [issues]);

  const ownerOptions = useMemo(() => {
    const map = new Map<string, string>();
    issues.forEach((issue) => {
      const key = issue.assigneeId || issue.assignee || "unassigned";
      const label =
        (issue.assigneeId && memberMap[issue.assigneeId]?.name) ||
        issue.assignee ||
        "미지정";
      map.set(key, label);
    });
    return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
  }, [issues, memberMap]);

  const tagOptions = useMemo(() => {
    const set = new Set<string>();
    Object.values(issueTags).forEach((tags) => {
      (tags || []).forEach((tag) => set.add(tag));
    });
    return Array.from(set.values());
  }, [issueTags]);

  const filteredIssues = useMemo(() => {
    let list = [...issues];
    if (statusFilter.size > 0) {
      list = list.filter((issue) => statusFilter.has(issue.status));
    }
    if (priorityFilter.size > 0) {
      list = list.filter((issue) => priorityFilter.has(issue.priority));
    }
    if (ownerFilter.size > 0) {
      list = list.filter((issue) => ownerFilter.has(issue.assigneeId || issue.assignee || "unassigned"));
    }
    if (tagFilter.size > 0) {
      list = list.filter((issue) => {
        const tags = issueTags[issue.id] ?? [];
        return tags.some((tag) => tagFilter.has(tag));
      });
    }
    if (prioritySort !== "none") {
      const order: Record<Issue["priority"], number> = { low: 1, medium: 2, high: 3, urgent: 4 };
      list.sort((a, b) => (prioritySort === "asc" ? order[a.priority] - order[b.priority] : order[b.priority] - order[a.priority]));
    } else if (ownerSort !== "none") {
      list.sort((a, b) => {
        const aName = (a.assigneeId && memberMap[a.assigneeId]?.name) || a.assignee || "";
        const bName = (b.assigneeId && memberMap[b.assigneeId]?.name) || b.assignee || "";
        return ownerSort === "asc" ? aName.localeCompare(bName) : bName.localeCompare(aName);
      });
    }
    return list;
  }, [issues, statusFilter, priorityFilter, ownerFilter, tagFilter, issueTags, prioritySort, ownerSort, memberMap]);

  const grouped = useMemo(() => {
    const map = new Map<Issue["status"], Issue[]>();
    columns.forEach((col) => map.set(col.key, []));
    issues.forEach((issue) => {
      const list = map.get(issue.status) ?? [];
      list.push(issue);
      map.set(issue.status, list);
    });
    return map;
  }, [issues, columns]);

  const handleCreate = async (
    title: string,
    column: "todo" | "doing" | "done",
    priority: "very_low" | "low" | "medium" | "high" | "very_high",
    tags: string[],
    due?: string,
  ) => {
    if (!projectId) return;
    const status: Issue["status"] = column === "doing" ? "in_progress" : column;
    const mappedPriority: Issue["priority"] =
      priority === "very_high" ? "urgent" : priority === "high" ? "high" : priority === "medium" ? "medium" : "low";
    const created = await createIssue(projectId, { title, status, priority: mappedPriority, assigneeId: profile?.id, dueAt: due ?? undefined });
    if (typeof window !== "undefined" && tags.length > 0) {
      setIssueTags((prev) => {
        const next = { ...prev, [created.id]: tags };
        window.localStorage.setItem(`fd.issue.tags:${projectId}`, JSON.stringify(next));
        return next;
      });
    }
    await refresh();
  };

  const handleStatusChange = async (issue: Issue, next: Issue["status"]) => {
    if (!projectId || issue.status === next) return;
    const updated = await updateIssueStatus(projectId, issue.id, next);
    setIssues((prev) => prev.map((item) => (item.id === issue.id ? updated : item)));
  };

  const openIssue = (issueId: string) => {
    if (!pathname) return;
    if (pathname.endsWith(`/issues/${issueId}`)) return;
    router.push(`${pathname.replace(/\/issues(?:\/.*)?$/, "/issues")}/${issueId}`);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background text-foreground">
      <header className="border-b border-border bg-panel">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-10">
          <div className="space-y-1">
            <div className="text-lg font-semibold text-foreground">팀 반복</div>
            <div className="text-[11px] uppercase tracking-[0.3em] text-muted">Team Board</div>
          </div>
          <div className="flex items-center gap-2">
            <NewIssueDialog onCreate={(title, column, priority, tags, due) => handleCreate(title, column, priority, tags, due)} />
            <button className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition hover:bg-subtle/60 hover:text-foreground">
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>
        <div className="border-t border-border bg-panel/70">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-2 sm:px-10">
            <div className="flex flex-1 items-center gap-2 overflow-x-auto">
              {VIEW_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = view === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setView(tab.key)}
                    className={[
                      "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition",
                      isActive
                        ? "border-brand/50 bg-brand/10 text-brand"
                        : "border-transparent text-muted hover:border-border hover:bg-subtle/60 hover:text-foreground",
                    ].join(" ")}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <section className="flex min-h-0 flex-1 flex-col px-4 py-6 sm:px-10">
          {loading ? (
            <div className="rounded-xl border border-border bg-panel/60 p-6 text-sm text-muted">이슈를 불러오는 중입니다…</div>
          ) : (
            <>
              {view === "kanban" && (
                <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
                  {columns.map((col) => {
                    const items = grouped.get(col.key) ?? [];
                    return (
                      <div
                        key={col.key}
                        className={[
                          "flex min-h-0 flex-col rounded-xl border border-border p-3",
                          col.key === "done"
                            ? "bg-emerald-500/10"
                            : col.key === "in_progress"
                              ? "bg-amber-500/10"
                              : col.key === "review"
                                ? "bg-violet-500/10"
                                : "bg-rose-500/10",
                        ].join(" ")}
                      >
                        <div className="flex items-center justify-between pb-2">
                          <span className="text-sm font-semibold">{col.label}</span>
                          <span className="rounded-full bg-background/70 px-2 py-0.5 text-xs text-muted">{items.length}</span>
                        </div>
                        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
                          {items.length === 0 && (
                            <div className="rounded-lg border border-dashed border-border/60 bg-background/70 p-3 text-xs text-muted">
                              이슈가 없습니다.
                            </div>
                          )}
                          {items.map((issue) => (
                            <button
                              key={issue.id}
                              type="button"
                              onClick={() => openIssue(issue.id)}
                              className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-white/90 p-3 text-left shadow-sm transition hover:border-brand/50 hover:bg-white"
                            >
                              <div className="text-sm font-semibold text-foreground line-clamp-2">{issue.title}</div>
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-subtle text-xs font-semibold text-muted">
                                {(issue.assignee || "U").slice(0, 1).toUpperCase()}
                              </div>
                            </button>
                          ))}
                          <button
                            type="button"
                            className="rounded-lg border border-dashed border-border/60 bg-background/70 px-3 py-2 text-left text-xs text-muted hover:bg-subtle/60"
                          >
                            + 추가
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {view === "table" && (
                <div className="space-y-6">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-lg font-semibold text-rose-400">반복 112</div>
                      <button className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted transition hover:bg-subtle/60">
                        +
                      </button>
                    </div>
                    <div className="overflow-visible rounded-xl border border-border bg-panel/60">
                    <div className="grid grid-cols-[8px_1.5fr_120px_160px_120px_120px_1fr] items-center gap-2 border-b border-border px-4 py-2 text-xs font-semibold text-muted">
                      <div></div>
                      <div>업무</div>
                      <div>날짜</div>
                      <div className="relative flex items-center gap-1">
                        담당자
                        <button
                          type="button"
                          onClick={() => setOpenFilter((prev) => (prev === "owner" ? null : "owner"))}
                          className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted hover:bg-subtle/60"
                        >
                          <Filter size={12} />
                        </button>
                        {openFilter === "owner" && (
                          <div ref={filterRef} className="absolute left-0 top-7 z-30 w-56 rounded-xl border border-border bg-panel p-3 shadow-panel">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-xs font-semibold text-foreground">담당자</span>
                              <div className="flex items-center gap-1">
                                <button
                                  className={[
                                    "inline-flex h-6 w-6 items-center justify-center rounded-lg border",
                                    ownerSort === "asc" ? "border-brand/50 bg-brand/10 text-brand" : "border-border",
                                  ].join(" ")}
                                  onClick={() => setOwnerSort("asc")}
                                  title="이름 오름차순"
                                >
                                  <ArrowUpAZ size={12} />
                                </button>
                                <button
                                  className={[
                                    "inline-flex h-6 w-6 items-center justify-center rounded-lg border",
                                    ownerSort === "desc" ? "border-brand/50 bg-brand/10 text-brand" : "border-border",
                                  ].join(" ")}
                                  onClick={() => setOwnerSort("desc")}
                                  title="이름 내림차순"
                                >
                                  <ArrowDownAZ size={12} />
                                </button>
                                <button
                                  className="rounded-md border border-border px-2 py-1 text-[8px]"
                                  onClick={() => {
                                    setOwnerFilter(new Set());
                                    setOwnerSort("none");
                                  }}
                                >
                                  초기화
                                </button>
                              </div>
                            </div>
                            <div className="space-y-1 rounded-lg border border-border/60 bg-background/60 p-2">
                              {ownerOptions.map((owner) => {
                                const avatar = memberMap[owner.key]?.avatarUrl ?? null;
                                return (
                                  <button
                                    key={owner.key}
                                    type="button"
                                    onClick={() => {
                                      setOwnerFilter((prev) => {
                                        const next = new Set(prev);
                                        if (next.has(owner.key)) next.delete(owner.key);
                                        else next.add(owner.key);
                                        return next;
                                      });
                                    }}
                                    className={[
                                      "flex w-full items-center justify-between rounded-md px-2 py-1 text-[11px]",
                                      ownerFilter.has(owner.key) ? "bg-brand/10 text-brand" : "hover:bg-subtle/60",
                                    ].join(" ")}
                                  >
                                    <span className="flex items-center gap-2">
                                      {avatar ? (
                                        <img src={avatar} alt={owner.label} className="h-5 w-5 rounded-full object-cover" />
                                      ) : (
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-subtle text-[10px] font-semibold text-muted">
                                          {owner.label.slice(0, 1).toUpperCase()}
                                        </span>
                                      )}
                                      <span>{owner.label}</span>
                                    </span>
                                    <span className={ownerFilter.has(owner.key) ? "text-brand" : "text-muted"}>
                                      {ownerFilter.has(owner.key) ? "선택됨" : ""}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="relative flex items-center gap-1">
                        상태
                        <button
                          type="button"
                          onClick={() => setOpenFilter((prev) => (prev === "status" ? null : "status"))}
                          className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted hover:bg-subtle/60"
                        >
                          <Filter size={12} />
                        </button>
                        {openFilter === "status" && (
                          <div ref={filterRef} className="absolute left-0 top-7 z-30 w-44 rounded-xl border border-border bg-panel p-3 shadow-panel">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-xs font-semibold text-foreground">상태 필터</span>
                              <button
                                className="rounded-md border border-border px-2 py-1 text-[11px]"
                                onClick={() => setStatusFilter(new Set())}
                              >
                                초기화
                              </button>
                            </div>
                            <div className="space-y-1">
                              {[
                                { key: "todo" as const, label: "할 일" },
                                { key: "in_progress" as const, label: "작업 중" },
                                { key: "review" as const, label: "리뷰 대기" },
                                { key: "done" as const, label: "완료" },
                              ].map((item) => (
                                <button
                                  key={item.key}
                                  type="button"
                                  onClick={() => {
                                    setStatusFilter((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(item.key)) next.delete(item.key);
                                      else next.add(item.key);
                                      return next;
                                    });
                                  }}
                                  className={[
                                    "flex w-full items-center justify-between rounded-md px-2 py-1 text-[11px]",
                                    statusFilter.has(item.key) ? "bg-brand/10 text-brand" : "hover:bg-subtle/60",
                                  ].join(" ")}
                                >
                                  <span>{item.label}</span>
                                  <span className={statusFilter.has(item.key) ? "text-brand" : "text-muted"}>
                                    {statusFilter.has(item.key) ? "선택됨" : ""}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="relative flex items-center gap-1">
                        우선순위
                        <button
                          type="button"
                          onClick={() => setOpenFilter((prev) => (prev === "priority" ? null : "priority"))}
                          className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted hover:bg-subtle/60"
                        >
                          <Filter size={12} />
                        </button>
                        {openFilter === "priority" && (
                          <div ref={filterRef} className="absolute right-0 top-7 z-30 w-48 rounded-xl border border-border bg-panel p-3 shadow-panel">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-xs font-semibold text-foreground">우선순위</span>
                              <div className="flex items-center gap-1">
                                <button
                                  className={[
                                    "inline-flex h-6 w-6 items-center justify-center rounded-lg border",
                                    prioritySort === "asc" ? "border-brand/50 bg-brand/10 text-brand" : "border-border",
                                  ].join(" ")}
                                  onClick={() => setPrioritySort("asc")}
                                  title="우선순위 오름차순"
                                >
                                  <ArrowUpWideNarrow size={12} />
                                </button>
                                <button
                                  className={[
                                    "inline-flex h-6 w-6 items-center justify-center rounded-lg border",
                                    prioritySort === "desc" ? "border-brand/50 bg-brand/10 text-brand" : "border-border",
                                  ].join(" ")}
                                  onClick={() => setPrioritySort("desc")}
                                  title="우선순위 내림차순"
                                >
                                  <ArrowDownWideNarrow size={12} />
                                </button>
                                <button
                                  className="rounded-md border border-border px-2 py-1 text-[8px]"
                                  onClick={() => {
                                    setPriorityFilter(new Set());
                                    setPrioritySort("none");
                                  }}
                                >
                                  초기화
                                </button>
                              </div>
                            </div>
                            <div className="space-y-1">
                              {[
                                { key: "low" as const, label: "낮음" },
                                { key: "medium" as const, label: "중간" },
                                { key: "high" as const, label: "높음" },
                                { key: "urgent" as const, label: "매우 높음" },
                              ].map((item) => (
                                <button
                                  key={item.key}
                                  type="button"
                                  onClick={() => {
                                    setPriorityFilter((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(item.key)) next.delete(item.key);
                                      else next.add(item.key);
                                      return next;
                                    });
                                  }}
                                  className={[
                                    "flex w-full items-center justify-between rounded-md px-2 py-1 text-[11px]",
                                    priorityFilter.has(item.key) ? "bg-brand/10 text-brand" : "hover:bg-subtle/60",
                                  ].join(" ")}
                                >
                                  <span>{item.label}</span>
                                  <span className={priorityFilter.has(item.key) ? "text-brand" : "text-muted"}>
                                    {priorityFilter.has(item.key) ? "선택됨" : ""}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="relative flex items-center gap-1">
                        태그
                        <button
                          type="button"
                          onClick={() => setOpenFilter((prev) => (prev === "tag" ? null : "tag"))}
                          className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted hover:bg-subtle/60"
                        >
                          <Filter size={12} />
                        </button>
                        {openFilter === "tag" && (
                          <div ref={filterRef} className="absolute right-0 top-7 z-30 w-48 rounded-xl border border-border bg-panel p-3 shadow-panel">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-xs font-semibold text-foreground">태그 필터</span>
                              <button
                                className="rounded-md border border-border px-2 py-1 text-[11px]"
                                onClick={() => setTagFilter(new Set())}
                              >
                                초기화
                              </button>
                            </div>
                            {tagOptions.length === 0 && <div className="text-[11px] text-muted">태그 없음</div>}
                            <div className="space-y-1">
                              {tagOptions.map((tag) => (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => {
                                    setTagFilter((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(tag)) next.delete(tag);
                                      else next.add(tag);
                                      return next;
                                    });
                                  }}
                                  className={[
                                    "flex w-full items-center justify-between rounded-md px-2 py-1 text-[11px]",
                                    tagFilter.has(tag) ? "bg-brand/10 text-brand" : "hover:bg-subtle/60",
                                  ].join(" ")}
                                >
                                  <span>#{tag}</span>
                                  <span className={tagFilter.has(tag) ? "text-brand" : "text-muted"}>
                                    {tagFilter.has(tag) ? "선택됨" : ""}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="divide-y divide-border">
                        {filteredIssues.map((issue, index) => {
                          const member =
                            (issue.assigneeId && memberMap[issue.assigneeId]) ||
                            Object.values(memberMap).find((m) => m.name === issue.assignee);
                        const avatar = member?.avatarUrl;
                        const tags = issueTags[issue.id] ?? [];
                        return (
                          <div
                            key={issue.id}
                            className="grid grid-cols-[8px_1.5fr_120px_160px_120px_120px_1fr] items-center gap-2 px-4 py-2 text-sm"
                          >
                            <div className={["h-full rounded-full", STATUS_BAR_STYLE[issue.status]].join(" ")} />
                            <button
                              type="button"
                                onClick={() => openIssue(issue.id)}
                                className="truncate text-left font-medium hover:text-brand"
                              >
                                {issue.title}
                              </button>
                              <div className="text-xs text-muted">
                                {issue.startAt ? new Date(issue.startAt).toLocaleDateString("ko-KR") : "—"}
                              </div>
                              <div className="flex items-center gap-2">
                                {avatar ? (
                                  <img src={avatar} alt={issue.assignee || "avatar"} className="h-8 w-8 rounded-full object-cover" />
                                ) : (
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-subtle text-xs font-semibold text-muted">
                                    {(issue.assignee || "U").slice(0, 1).toUpperCase()}
                                  </div>
                                )}
                                <span className="text-sm">{issue.assignee || "미지정"}</span>
                              </div>
                              <select
                                className={["appearance-none rounded-md px-2 py-1 text-xs font-semibold cursor-pointer", STATUS_STYLE[issue.status]].join(" ")}
                                value={issue.status}
                                onChange={(e) => handleStatusChange(issue, e.target.value as Issue["status"])}
                              >
                                {columns.map((option) => (
                                  <option key={option.key} value={option.key}>
                                    {option.key === "in_progress"
                                      ? "작업 중"
                                      : option.key === "review"
                                        ? "리뷰 대기"
                                        : option.key === "done"
                                          ? "완료"
                                          : option.key === "backlog"
                                            ? "백로그"
                                            : "할 일"}
                                  </option>
                                ))}
                              </select>
                              <select
                                className={["appearance-none rounded-md px-2 py-1 text-xs font-semibold cursor-pointer", PRIORITY_STYLE[issue.priority]].join(" ")}
                                value={issue.priority}
                                onChange={(e) => {
                                  const next = e.target.value as Issue["priority"];
                                  setIssues((prev) => prev.map((item) => (item.id === issue.id ? { ...item, priority: next } : item)));
                                }}
                              >
                                <option value="low">낮음</option>
                                <option value="medium">중간</option>
                                <option value="high">높음</option>
                                <option value="urgent">매우 높음</option>
                              </select>
                              <div className="flex flex-wrap gap-1 text-xs font-semibold text-emerald-600">
                                {tags.length > 0 ? (
                                  tags.map((tag) => <span key={`${issue.id}-${tag}`}>#{tag}</span>)
                                ) : (
                                  <span className="text-muted">—</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                    </div>
                  </div>
                </div>
              )}

              {view === "timeline" && <TimelineView issues={issues} memberMap={memberMap} />}

              {view === "chart" && (
                <div className="rounded-xl border border-border bg-panel/60 p-6 text-sm text-muted">
                  차트 보드는 준비 중입니다.
                </div>
              )}

              {view === "dashboard" && (
                <div className="rounded-xl border border-border bg-panel/60 p-6 text-sm text-muted">
                  대시보드는 준비 중입니다.
                </div>
              )}
            </>
          )}
        </section>

        {routeId && (
          <aside className="hidden w-[360px] shrink-0 border-l border-border bg-panel md:flex">
            <RightPanel onClose={() => router.push(pathname.replace(/\/issues\/.*$/, "/issues"))} />
          </aside>
        )}
      </div>
    </div>
  );
}

const STATUS_STYLE: Record<Issue["status"], string> = {
  backlog: "bg-slate-100 text-slate-700",
  todo: "bg-rose-100 text-rose-700",
  in_progress: "bg-amber-100 text-amber-700",
  review: "bg-violet-100 text-violet-700",
  done: "bg-emerald-100 text-emerald-700",
};

const PRIORITY_STYLE: Record<Issue["priority"], string> = {
  low: "bg-sky-100 text-sky-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-rose-100 text-rose-700",
};

const STATUS_BAR_STYLE: Record<Issue["status"], string> = {
  backlog: "bg-slate-300",
  todo: "bg-rose-400",
  in_progress: "bg-amber-400",
  review: "bg-violet-400",
  done: "bg-emerald-400",
};

function StatusBadge({ status }: { status: Issue["status"] }) {
  const label =
    status === "in_progress" ? "작업 중" : status === "review" ? "리뷰 대기" : status === "done" ? "완료" : status === "backlog" ? "백로그" : "할 일";
  return (
    <span className={["inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-semibold", STATUS_STYLE[status]].join(" ")}>
      {label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: Issue["priority"] }) {
  const label = priority === "low" ? "낮음" : priority === "high" ? "높음" : priority === "urgent" ? "긴급" : "중간";
  return (
    <span className={["inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-semibold", PRIORITY_STYLE[priority]].join(" ")}>
      {label}
    </span>
  );
}

function TimelineView({
  issues,
  memberMap,
}: {
  issues: Issue[];
  memberMap: Record<string, { name: string; avatarUrl?: string | null }>;
}) {
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

  const byAssignee = useMemo(() => {
    const map = new Map<string, Issue[]>();
    issues.forEach((issue) => {
      const key = issue.assigneeId || issue.assignee || "unassigned";
      const list = map.get(key) ?? [];
      list.push(issue);
      map.set(key, list);
    });
    return Array.from(map.entries());
  }, [issues]);

  const rangeMs = timelineEnd.getTime() - timelineStart.getTime();
  const dayWidth = 36;
  const gridWidth = days.length * dayWidth;

  return (
    <div className="rounded-xl border border-border bg-panel/60 p-4">
      <div className="grid grid-cols-[160px_1fr] items-center gap-2 border-b border-border pb-3 text-xs font-semibold text-muted">
        <div></div>
        <div className="overflow-x-auto">
          <div className="flex" style={{ minWidth: gridWidth }}>
            {days.map((day) => (
              <span key={day} className="w-9 text-center">
                {day}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="divide-y divide-border">
        {byAssignee.map(([assigneeKey, items]) => {
          const name =
            memberMap[assigneeKey]?.name ||
            items[0]?.assignee ||
            "미지정";
          const avatar = memberMap[assigneeKey]?.avatarUrl ?? null;
          return (
            <div key={assigneeKey} className="grid grid-cols-[160px_1fr] items-center gap-2 py-4">
              <div className="flex items-center gap-3">
                {avatar ? (
                  <img src={avatar} alt={name} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-subtle text-xs font-semibold text-muted">
                    {name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium">{name}</span>
              </div>
              <div className="overflow-x-auto">
                <div className="relative h-10" style={{ minWidth: gridWidth }}>
                  {items.map((issue) => {
                    if (!issue.startAt || !issue.endAt) return null;
                    const start = Math.max(new Date(issue.startAt).getTime(), timelineStart.getTime());
                    const end = Math.min(new Date(issue.endAt).getTime(), timelineEnd.getTime());
                    if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
                    const left = ((start - timelineStart.getTime()) / rangeMs) * 100;
                    const width = Math.max(((end - start) / rangeMs) * 100, 4);
                    return (
                      <div
                        key={issue.id}
                        className="absolute top-1/2 -translate-y-1/2 rounded-full bg-rose-300 px-3 py-1 text-xs font-semibold text-white shadow-sm"
                        style={{ left: `${left}%`, width: `${width}%` }}
                      >
                        <span className="truncate">{issue.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
