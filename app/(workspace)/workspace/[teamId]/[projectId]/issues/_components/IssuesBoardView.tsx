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
  CornerDownRight,
  Filter,
  KanbanSquare,
  LayoutDashboard,
  MessageSquareMore,
  MoreHorizontal,
  Pencil,
  SquarePlus,
  Table2,
  Trash2,
} from "lucide-react";

import NewIssueDialog from "@/workspace/issues/_components/NewIssueDialog";
import RightPanel from "@/workspace/issues/_components/RightPanel";
import type { Issue, IssueComment, IssueGroup } from "@/workspace/issues/_model/types";
import {
  addComment,
  addSubtask,
  createIssue,
  createIssueGroup,
  deleteComment,
  deleteIssue,
  deleteSubtask,
  getIssueById,
  listIssueGroups,
  listIssues,
  listComments,
  removeIssueGroup,
  updateIssue,
  updateComment,
  updateIssueGroup,
  updateIssueProgress,
  updateIssueStatus,
} from "@/workspace/issues/_service/api";
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
  const [issueGroups, setIssueGroups] = useState<IssueGroup[]>([]);
  const [groupModal, setGroupModal] = useState<{
    mode: "create" | "edit";
    group?: IssueGroup;
    name: string;
    color: string;
  } | null>(null);
  const [groupDeleteModal, setGroupDeleteModal] = useState<IssueGroup | null>(null);
  const [issueCreateModal, setIssueCreateModal] = useState<{
    groupKey: string;
    title: string;
    status: Issue["status"];
    priority: Issue["priority"];
    startAt: string;
    endAt: string;
    parentId?: string;
    parentTitle?: string;
    isSubtask?: boolean;
  } | null>(null);
  const [issueActionsId, setIssueActionsId] = useState<string | null>(null);
  const [issueDeleteModal, setIssueDeleteModal] = useState<Issue | null>(null);
  const [issueEditModal, setIssueEditModal] = useState<{
    issue: Issue;
    title: string;
    status: Issue["status"];
    priority: Issue["priority"];
    startAt: string;
    endAt: string;
  } | null>(null);
  const [issueDetail, setIssueDetail] = useState<Issue | null>(null);
  const [issueComments, setIssueComments] = useState<IssueComment[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [subtaskDraft, setSubtaskDraft] = useState("");
  const [commentThreads, setCommentThreads] = useState<Record<string, IssueComment[]>>({});
  const [openCommentThreads, setOpenCommentThreads] = useState<Record<string, boolean>>({});
  const [commentThreadDrafts, setCommentThreadDrafts] = useState<Record<string, string>>({});
  const [commentSubmitting, setCommentSubmitting] = useState<Record<string, boolean>>({});
  const [commentEditingId, setCommentEditingId] = useState<string | null>(null);
  const [commentEditingDraft, setCommentEditingDraft] = useState("");
  const [commentReactions, setCommentReactions] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);
  const [memberMap, setMemberMap] = useState<Record<string, { name: string; avatarUrl?: string | null }>>({});
  const [issueTags, setIssueTags] = useState<Record<string, string[]>>({});
  const { profile } = useAuthProfile();
  const [tableStatusFilter, setTableStatusFilter] = useState<Record<string, Set<Issue["status"]>>>({});
  const [tablePriorityFilter, setTablePriorityFilter] = useState<Record<string, Set<Issue["priority"]>>>({});
  const [tableOwnerFilter, setTableOwnerFilter] = useState<Record<string, Set<string>>>({});
  const [tableDateFilter, setTableDateFilter] = useState<Record<string, Set<string>>>({});
  const [tablePrioritySort, setTablePrioritySort] = useState<Record<string, "none" | "asc" | "desc">>({});
  const [tableOwnerSort, setTableOwnerSort] = useState<Record<string, "none" | "asc" | "desc">>({});
  const [tableDateSort, setTableDateSort] = useState<Record<string, "none" | "asc" | "desc">>({});
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("table");
  const issueActionsRef = useRef<HTMLDivElement | null>(null);

  const refresh = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [data, groups] = await Promise.all([listIssues(projectId), listIssueGroups(projectId)]);
      setIssues(data ?? []);
      setIssueGroups(groups ?? []);
      if (data?.length) {
        const map: Record<string, IssueComment[]> = {};
        const walk = (items: Issue[]) => {
          items.forEach((item) => {
            if (item.comments?.length) {
              map[item.id] = item.comments;
            }
            if (item.subtasks?.length) walk(item.subtasks);
          });
        };
        walk(data);
        setCommentThreads((prev) => ({ ...prev, ...map }));
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const handleToggleComments = useCallback(
    async (issue: Issue) => {
      if (!projectId) return;
      setOpenCommentThreads((prev) => ({ ...prev, [issue.id]: !prev[issue.id] }));
      if (commentThreads[issue.id]) return;
      const comments = await listComments(issue.id, projectId);
      setCommentThreads((prev) => ({ ...prev, [issue.id]: comments }));
    },
    [projectId, commentThreads],
  );

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
      if (!(event.target instanceof Element)) return;
      const root = event.target.closest(`[data-filter-root="${openFilter}"]`);
      if (!root) setOpenFilter(null);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [openFilter]);

  useEffect(() => {
    if (!issueActionsId) return;
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return;
      if (!issueActionsRef.current) return;
      if (!issueActionsRef.current.contains(event.target)) {
        setIssueActionsId(null);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [issueActionsId]);

  useEffect(() => {
    if (!issueEditModal?.issue?.id || !projectId) return;
    let active = true;
    const load = async () => {
      const [detail, comments] = await Promise.all([
        getIssueById(issueEditModal.issue.id, projectId),
        listComments(issueEditModal.issue.id, projectId),
      ]);
      if (!active) return;
      setIssueDetail(detail);
      setIssueComments(comments);
      setCommentDraft("");
      setSubtaskDraft("");
    };
    void load();
    return () => {
      active = false;
    };
  }, [issueEditModal?.issue?.id, projectId]);

  const columns = useMemo(() => {
    const hasBacklog = issues.some((issue) => issue.status === "backlog");
    return hasBacklog ? [{ key: "backlog" as const, label: "Backlog" }, ...BASE_COLUMNS] : BASE_COLUMNS;
  }, [issues]);

  const filteredIssues = useMemo(() => issues.filter((issue) => !issue.parentId), [issues]);

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
      priority === "very_high"
        ? "urgent"
        : priority === "high"
          ? "high"
          : priority === "medium"
            ? "medium"
            : priority === "low"
              ? "low"
              : "very_low";
    const defaultGroupId = issueGroups[0]?.id;
    const created = await createIssue(projectId, {
      title,
      status,
      priority: mappedPriority,
      assigneeId: profile?.id,
      groupId: defaultGroupId,
      dueAt: due ?? undefined,
    });
    if (typeof window !== "undefined" && tags.length > 0) {
      setIssueTags((prev) => {
        const next = { ...prev, [created.id]: tags };
        window.localStorage.setItem(`fd.issue.tags:${projectId}`, JSON.stringify(next));
        return next;
      });
    }
    await refresh();
  };

  const tableGroups = useMemo(() => {
    const groupedMap = new Map<string, Issue[]>();
    issueGroups.forEach((group) => groupedMap.set(group.id, []));
    const ungrouped: Issue[] = [];
    filteredIssues.forEach((issue) => {
      const gid = issue.group?.id;
      if (gid && groupedMap.has(gid)) {
        groupedMap.get(gid)!.push(issue);
      } else {
        ungrouped.push(issue);
      }
    });
    const sortedGroups = [...issueGroups].sort((a, b) => a.sortOrder - b.sortOrder);
    const groups = sortedGroups.map((group) => ({
      key: group.id,
      label: group.name,
      color: group.color,
      items: groupedMap.get(group.id) ?? [],
    }));
    if (ungrouped.length > 0) {
      groups.push({
        key: "ungrouped",
        label: "미분류",
        color: "#94a3b8",
        items: ungrouped,
      });
    }
    return groups;
  }, [filteredIssues, issueGroups]);

  const handleAddGroup = async () => {
    setGroupModal({ mode: "create", name: "", color: "#60a5fa" });
  };

  const handleRenameGroup = async (group: IssueGroup) => {
    setGroupModal({ mode: "edit", group, name: group.name, color: group.color || "#60a5fa" });
  };

  const handleRemoveGroup = async (group: IssueGroup) => {
    if (!projectId) return;
    await removeIssueGroup(projectId, group.id);
    setIssueGroups((prev) => prev.filter((item) => item.id !== group.id));
    setIssues((prev) => prev.map((issue) => (issue.group?.id === group.id ? { ...issue, group: undefined } : issue)));
  };


  const handleSubmitGroupModal = async () => {
    if (!projectId || !groupModal) return;
    const name = groupModal.name.trim() || undefined;
    const color = groupModal.color?.trim() || undefined;
    if (groupModal.mode === "create") {
      const created = await createIssueGroup(projectId, { name, color });
      setIssueGroups((prev) => [...prev, created]);
    } else if (groupModal.group) {
      const updated = await updateIssueGroup(projectId, groupModal.group.id, { name, color });
      setIssueGroups((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    }
    setGroupModal(null);
  };

  const handleStatusChange = async (issue: Issue, next: Issue["status"]) => {
    if (!projectId || issue.status === next) return;
    const updated = await updateIssueStatus(projectId, issue.id, next);
    setIssues((prev) =>
      prev.map((item) =>
        item.id === issue.id
          ? { ...updated, progress: next === "done" ? 100 : updated.progress }
          : item,
      ),
    );
    if (next === "done") {
      void handleProgressCommit(issue, 100);
    }
  };

  const handleProgressCommit = async (issue: Issue, next: number) => {
    if (!projectId) return;
    try {
      const updated = await updateIssueProgress(projectId, issue.id, next);
      setIssues((prev) => prev.map((item) => (item.id === issue.id ? updated : item)));
    } catch {
      // ignore
    }
  };

  const updateIssueTree = (items: Issue[], targetId: string, updater: (issue: Issue) => Issue): Issue[] =>
    items.map((item) => {
      if (item.id === targetId) return updater(item);
      if (item.subtasks?.length) {
        return { ...item, subtasks: updateIssueTree(item.subtasks, targetId, updater) };
      }
      return item;
    });

  const renderIssueRow = (issue: Issue, opts?: { isSubtask?: boolean }) => {
    const isSubtask = opts?.isSubtask ?? false;
    const member =
      (issue.assigneeId && memberMap[issue.assigneeId]) ||
      Object.values(memberMap).find((m) => m.name === issue.assignee);
    const avatar = member?.avatarUrl;
    const assigneeName = member?.name || issue.assignee || "미지정";
    const rowText = isSubtask ? "text-[11px]" : "text-sm";
    const titleHeight = isSubtask ? "h-9" : "h-11";
    const cellText = isSubtask ? "text-[11px]" : "text-md";
    const avatarSize = isSubtask ? "h-8 w-8" : "h-10 w-10";
    const selectHeight = isSubtask ? "h-9" : "h-11";
    const progressHeight = isSubtask ? "h-7" : "h-8";
    const progressInputHeight = isSubtask ? "h-5 w-10 text-[9px]" : "h-6 w-12 text-[10px]";

    return (
      <div className="space-y-2">
        <div
          className={[
            "flex flex-col gap-2 rounded-md px-3 py-3 md:grid md:grid-cols-[2fr_110px_120px_90px_90px_130px] md:items-center md:gap-2 md:py-2",
            rowText,
          ].join(" ")}
        >
          <div className={["md:hidden rounded-md bg-gray-200/30 px-2 py-1 font-semibold flex items-center gap-2", titleHeight, isSubtask ? "relative pl-6" : ""].join(" ")}>
            {isSubtask && (
              <span className="absolute -left-3 top-1/2 -translate-y-1/2 text-muted">
                <CornerDownRight size={12} />
              </span>
            )}
            <button
              type="button"
              onClick={() => setIssueActionsId((prev) => (prev === issue.id ? null : issue.id))}
              className="min-w-0 flex-1 truncate text-left"
            >
              {issue.title}
            </button>
          </div>
          <div className={["md:hidden flex items-center justify-between rounded-md bg-gray-200/30 px-2 py-1 text-muted", titleHeight].join(" ")}>
            <span className={isSubtask ? "text-[10px]" : "text-[11px]"}>{formatIssueDateRange(issue.startAt, issue.endAt)}</span>
            <div className="flex items-center gap-2 text-foreground">
              {avatar ? (
                <img
                  src={avatar}
                  alt={assigneeName || "avatar"}
                  className={["rounded-full object-cover", isSubtask ? "h-4 w-4" : "h-5 w-5"].join(" ")}
                />
              ) : (
                <div
                  className={[
                    "flex items-center justify-center rounded-full bg-subtle font-semibold text-muted",
                    isSubtask ? "h-4 w-4 text-[8px]" : "h-5 w-5 text-[9px]",
                  ].join(" ")}
                >
                  {assigneeName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <span className={isSubtask ? "text-[10px] font-medium" : "text-[11px] font-medium"}>
                {assigneeName}
              </span>
            </div>
          </div>
          <div className="md:hidden flex items-center gap-2">
            <select
              aria-label={`${issue.title} 우선순위`}
              className={[
                "appearance-none rounded-md px-3 py-1 font-semibold cursor-pointer flex items-center",
                isSubtask ? "h-7 text-[10px]" : "h-8 text-[11px]",
                PRIORITY_STYLE[issue.priority],
              ].join(" ")}
              value={issue.priority}
              onChange={(e) => {
                const next = e.target.value as Issue["priority"];
                setIssues((prev) => prev.map((item) => (item.id === issue.id ? { ...item, priority: next } : item)));
              }}
            >
              <option value="very_low">매우 낮음</option>
              <option value="low">낮음</option>
              <option value="medium">중간</option>
              <option value="high">높음</option>
              <option value="urgent">매우 높음</option>
            </select>
            <select
              aria-label={`${issue.title} 상태`}
              className={[
                "appearance-none rounded-md px-3 py-1 font-semibold cursor-pointer flex items-center",
                isSubtask ? "h-7 text-[10px]" : "h-8 text-[11px]",
                STATUS_STYLE[issue.status],
              ].join(" ")}
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
          </div>
          <div className="md:hidden flex h-10 w-full flex-col justify-center">
            <div className={["relative w-full", progressHeight].join(" ")}>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(issue.progress ?? 0)}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setIssues((prev) =>
                    prev.map((item) => (item.id === issue.id ? { ...item, progress: next } : item)),
                  );
                }}
                onMouseUp={(e) => void handleProgressCommit(issue, Number((e.target as HTMLInputElement).value))}
                onTouchEnd={(e) =>
                  void handleProgressCommit(issue, Number((e.target as HTMLInputElement).value))
                }
                onKeyUp={(e) => void handleProgressCommit(issue, Number((e.target as HTMLInputElement).value))}
                aria-label={`${issue.title} 진행률`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(issue.progress ?? 0)}
                aria-valuetext={`${Math.round(issue.progress ?? 0)}%`}
                className="absolute inset-0 h-2 w-full cursor-pointer appearance-none rounded-full"
                style={{
                  background: `linear-gradient(to right, #38bdf8 0%, #3b82f6 ${Math.round(
                    issue.progress ?? 0,
                  )}%, #f3f4f6 ${Math.round(issue.progress ?? 0)}%, #f3f4f6 100%)`,
                }}
              />
              <div className="absolute left-1/2 -bottom-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={100}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={Math.round(issue.progress ?? 0)}
                  onChange={(e) => {
                    const next = Math.max(0, Math.min(100, Number(e.target.value)));
                    setIssues((prev) =>
                      prev.map((item) => (item.id === issue.id ? { ...item, progress: next } : item)),
                    );
                  }}
                  onBlur={(e) => {
                    const next = Math.max(0, Math.min(100, Number(e.target.value)));
                    void handleProgressCommit(issue, next);
                  }}
                  aria-label={`${issue.title} 진행률 숫자 입력`}
                  className={["rounded-md border border-border bg-background px-1 text-center", progressInputHeight].join(" ")}
                />
                <span className="text-[10px] text-muted">%</span>
              </div>
            </div>
          </div>
          <div
            className={[
              "hidden md:flex truncate rounded-md bg-gray-200/30 px-2 py-1 font-semibold items-center gap-2",
              titleHeight,
              cellText,
              isSubtask ? "relative pl-6" : "",
            ].join(" ")}
          >
            {isSubtask && (
              <span className="absolute -left-3 top-1/2 -translate-y-1/2 text-muted">
                <CornerDownRight size={12} />
              </span>
            )}
            <button
              type="button"
              onClick={() => setIssueActionsId((prev) => (prev === issue.id ? null : issue.id))}
              className="truncate text-left"
            >
              {issue.title}
            </button>
          </div>
          <div className={["hidden md:flex rounded-md bg-gray-200/30 px-2 py-1 text-muted items-center", titleHeight, cellText].join(" ")}>
            {formatIssueDateRange(issue.startAt, issue.endAt)}
          </div>
          <div className={["hidden md:flex items-center gap-2 rounded-md px-2 py-1", isSubtask ? "h-9" : "h-10"].join(" ")}>
            {avatar ? (
              <img src={avatar} alt={assigneeName || "avatar"} className={["rounded-full object-cover", avatarSize].join(" ")} />
            ) : (
              <div className={["flex items-center justify-center rounded-full bg-subtle font-semibold text-muted", avatarSize, isSubtask ? "text-[10px]" : "text-md"].join(" ")}>
                {assigneeName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <span className={["font-medium", cellText].join(" ")}>{assigneeName}</span>
          </div>
          <div className="hidden md:block">
            <select
              aria-label={`${issue.title} 우선순위`}
              className={[
                "appearance-none rounded-md px-6 py-1 font-semibold cursor-pointer flex items-center",
                selectHeight,
                cellText,
                PRIORITY_STYLE[issue.priority],
              ].join(" ")}
              value={issue.priority}
              onChange={(e) => {
                const next = e.target.value as Issue["priority"];
                setIssues((prev) => prev.map((item) => (item.id === issue.id ? { ...item, priority: next } : item)));
              }}
            >
              <option value="very_low">매우 낮음</option>
              <option value="low">낮음</option>
              <option value="medium">중간</option>
              <option value="high">높음</option>
              <option value="urgent">매우 높음</option>
            </select>
          </div>
          <div className="hidden md:block">
            <select
              aria-label={`${issue.title} 상태`}
              className={[
                "appearance-none rounded-md px-6 py-1 font-semibold cursor-pointer flex items-center",
                selectHeight,
                cellText,
                STATUS_STYLE[issue.status],
              ].join(" ")}
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
          </div>
          <div className="hidden md:flex h-11 w-full flex-col justify-center">
            <div className={["relative w-full", progressHeight].join(" ")}>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(issue.progress ?? 0)}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setIssues((prev) =>
                    prev.map((item) => (item.id === issue.id ? { ...item, progress: next } : item)),
                  );
                }}
                onMouseUp={(e) => void handleProgressCommit(issue, Number((e.target as HTMLInputElement).value))}
                onTouchEnd={(e) =>
                  void handleProgressCommit(issue, Number((e.target as HTMLInputElement).value))
                }
                onKeyUp={(e) => void handleProgressCommit(issue, Number((e.target as HTMLInputElement).value))}
                aria-label={`${issue.title} 진행률`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(issue.progress ?? 0)}
                aria-valuetext={`${Math.round(issue.progress ?? 0)}%`}
                className="absolute inset-0 h-2 w-full cursor-pointer appearance-none rounded-full"
                style={{
                  background: `linear-gradient(to right, #38bdf8 0%, #3b82f6 ${Math.round(
                    issue.progress ?? 0,
                  )}%, #f3f4f6 ${Math.round(issue.progress ?? 0)}%, #f3f4f6 100%)`,
                }}
              />
              <div className="absolute left-1/2 -bottom-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={100}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={Math.round(issue.progress ?? 0)}
                  onChange={(e) => {
                    const next = Math.max(0, Math.min(100, Number(e.target.value)));
                    setIssues((prev) =>
                      prev.map((item) => (item.id === issue.id ? { ...item, progress: next } : item)),
                    );
                  }}
                  onBlur={(e) => {
                    const next = Math.max(0, Math.min(100, Number(e.target.value)));
                    void handleProgressCommit(issue, next);
                  }}
                  aria-label={`${issue.title} 진행률 숫자 입력`}
                  className={["rounded-md border border-border bg-background px-1 text-center", progressInputHeight].join(" ")}
                />
                <span className="text-[10px] text-muted">%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderIssueActions = (issue: Issue) => {
    if (issueActionsId !== issue.id) return null;
    const submitComment = async () => {
      if (!projectId) return;
      if (commentSubmitting[issue.id]) return;
      const body = (commentThreadDrafts[issue.id] ?? "").trim();
      if (!body) return;
      setCommentSubmitting((prev) => ({ ...prev, [issue.id]: true }));
      const authorName =
        profile?.displayName ?? profile?.name ?? profile?.email ?? "User";
      const created = await addComment(issue.id, authorName, body, projectId);
      const enriched = {
        ...created,
        author: authorName,
        authorAvatarUrl: created.authorAvatarUrl ?? profile?.avatarUrl ?? undefined,
      };
      setCommentThreads((prev) => ({
        ...prev,
        [issue.id]: [...(prev[issue.id] ?? []), enriched],
      }));
      setCommentThreadDrafts((prev) => ({ ...prev, [issue.id]: "" }));
      setCommentSubmitting((prev) => ({ ...prev, [issue.id]: false }));
    };
    return (
      <div ref={issueActionsRef} className="bg-panel/70 text-xs text-muted">
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIssueCreateModal({
                  groupKey: issue.group?.id ?? "ungrouped",
                  title: "",
                  status: issue.status,
                  priority: issue.priority,
                  startAt: "",
                  endAt: "",
                  parentId: issue.id,
                  parentTitle: issue.title,
                  isSubtask: true,
                });
                setIssueActionsId(null);
              }}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-foreground hover:bg-subtle/60"
            >
              <SquarePlus size={14} />
              이슈 추가
            </button>
            <button
              type="button"
              onClick={() => void handleToggleComments(issue)}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-foreground hover:bg-subtle/60"
            >
              <MessageSquareMore size={14} />
              {commentThreads[issue.id]?.length
                ? `댓글 ${commentThreads[issue.id].length}개`
                : "댓글"}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIssueEditModal({
                  issue,
                  title: issue.title,
                  status: issue.status,
                  priority: issue.priority,
                  startAt: issue.startAt ?? "",
                  endAt: issue.endAt ?? "",
                });
                setIssueActionsId(null);
              }}
              className="rounded-md border border-border px-2 py-1 text-xs text-foreground hover:bg-subtle/60"
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              onClick={() => {
                setIssueDeleteModal(issue);
                setIssueActionsId(null);
              }}
              className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-600 hover:bg-rose-100"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        {openCommentThreads[issue.id] && (
          <div className="border-t border-border/60 px-3 py-2">
            {commentThreads[issue.id]?.length ? (
              <div className="space-y-2">
                {commentThreads[issue.id].map((comment) => {
                  const isMine = comment.authorId && profile?.id && comment.authorId === profile.id;
                  const reactions = commentReactions[comment.id] ?? {};
                  const isEditing = commentEditingId === comment.id;
                  return (
                    <div key={comment.id} className="group rounded-md bg-background/70 px-2 py-2">
                      <div className="flex items-start gap-2">
                        <div className="h-6 w-6 overflow-hidden rounded-full border border-border bg-subtle/60">
                          {comment.authorAvatarUrl ? (
                            <img
                              src={comment.authorAvatarUrl}
                              alt={comment.author}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-muted">
                              {comment.author.slice(0, 1)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-[10px] text-muted">
                            <span className="font-semibold">{comment.author}</span>
                            <span>{formatCommentDateTime(comment.createdAt)}</span>
                          </div>
                          {isEditing ? (
                            <div className="mt-1 flex items-center gap-2">
                              <input
                                value={commentEditingDraft}
                                onChange={(e) => setCommentEditingDraft(e.target.value)}
                                className="h-7 flex-1 rounded-md border border-border bg-background px-2 text-xs"
                              />
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!projectId) return;
                                  const next = commentEditingDraft.trim();
                                  if (!next) return;
                                  await updateComment(projectId, comment.id, next, issue.id);
                                  setCommentThreads((prev) => ({
                                    ...prev,
                                    [issue.id]: (prev[issue.id] ?? []).map((c) =>
                                      c.id === comment.id ? { ...c, body: next } : c,
                                    ),
                                  }));
                                  setCommentEditingId(null);
                                }}
                                className="h-7 rounded-md border border-border px-2 text-[10px] text-muted hover:bg-subtle/60"
                              >
                                저장
                              </button>
                              <button
                                type="button"
                                onClick={() => setCommentEditingId(null)}
                                className="h-7 rounded-md border border-border px-2 text-[10px] text-muted hover:bg-subtle/60"
                              >
                                취소
                              </button>
                            </div>
                          ) : (
                            <div className="text-foreground">{comment.body}</div>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-muted opacity-0 transition group-hover:opacity-100">
                            {Object.entries(reactions).map(([emoji, count]) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() =>
                                  setCommentReactions((prev) => ({
                                    ...prev,
                                    [comment.id]: { ...(prev[comment.id] ?? {}), [emoji]: count + 1 },
                                  }))
                                }
                                className="rounded-full border border-border bg-background px-2 py-0.5"
                              >
                                {emoji} {count}
                              </button>
                            ))}
                            {["👍", "❤️", "😂", "🎉"].map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() =>
                                  setCommentReactions((prev) => ({
                                    ...prev,
                                    [comment.id]: {
                                      ...(prev[comment.id] ?? {}),
                                      [emoji]: (prev[comment.id]?.[emoji] ?? 0) + 1,
                                    },
                                  }))
                                }
                                className="rounded-full border border-border bg-background px-2 py-0.5"
                              >
                                {emoji}
                              </button>
                            ))}
                            {isMine && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCommentEditingId(comment.id);
                                    setCommentEditingDraft(comment.body);
                                  }}
                                  className="rounded-full border border-border bg-background px-2 py-0.5"
                                >
                                  수정
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!projectId) return;
                                    await deleteComment(projectId, comment.id);
                                    setCommentThreads((prev) => ({
                                      ...prev,
                                      [issue.id]: (prev[issue.id] ?? []).filter((c) => c.id !== comment.id),
                                    }));
                                  }}
                                  className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-rose-600"
                                >
                                  삭제
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-muted">댓글이 없습니다.</div>
            )}
            <div className="mt-2 flex items-center gap-2">
              <input
                value={commentThreadDrafts[issue.id] ?? ""}
                onChange={(e) =>
                  setCommentThreadDrafts((prev) => ({ ...prev, [issue.id]: e.target.value }))
                }
                onKeyDown={async (e) => {
                  if (e.key !== "Enter") return;
                  if (e.repeat) return;
                  e.preventDefault();
                  await submitComment();
                }}
                placeholder="댓글 입력"
                className="h-8 flex-1 rounded-md border border-border bg-background px-2 text-xs"
              />
              <button
                type="button"
                onClick={submitComment}
                disabled={commentSubmitting[issue.id]}
                className="h-8 rounded-md border border-border px-2 text-xs text-foreground hover:bg-subtle/60 disabled:opacity-50"
              >
                등록
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSubtasks = (items: Issue[], depth = 1) => {
    if (!items.length) return null;
    return (
      <div className="mt-1 space-y-1 border-l-2 border-border/60 pl-4 md:pl-5">
        {items.map((sub) => (
          <div key={sub.id} className="rounded-md bg-panel/40 px-1 py-1">
            {renderIssueRow(sub, { isSubtask: true })}
            {renderIssueActions(sub)}
            {sub.subtasks?.length ? (
              <div className="ml-2">{renderSubtasks(sub.subtasks, depth + 1)}</div>
            ) : null}
          </div>
        ))}
      </div>
    );
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
                  {tableGroups.map((group, index) => {
                    const groupEntity = issueGroups.find((item) => item.id === group.key);
                    const tableItems = [...group.items];
                    const dateFilter = tableDateFilter[group.key];
                    const ownerFilter = tableOwnerFilter[group.key];
                    const statusFilter = tableStatusFilter[group.key];
                    const priorityFilter = tablePriorityFilter[group.key];

                    const dateSort = tableDateSort[group.key] ?? "none";
                    const ownerSort = tableOwnerSort[group.key] ?? "none";
                    const prioritySort = tablePrioritySort[group.key] ?? "none";

                    const filteredTableItems = tableItems
                      .filter((issue) => {
                        if (!dateFilter || dateFilter.size === 0) return true;
                        return dateFilter.has(formatIssueDateRange(issue.startAt, issue.endAt));
                      })
                      .filter((issue) => {
                        if (!ownerFilter || ownerFilter.size === 0) return true;
                        return ownerFilter.has(issue.assigneeId || issue.assignee || "unassigned");
                      })
                      .filter((issue) => {
                        if (!statusFilter || statusFilter.size === 0) return true;
                        return statusFilter.has(issue.status);
                      })
                      .filter((issue) => {
                        if (!priorityFilter || priorityFilter.size === 0) return true;
                        return priorityFilter.has(issue.priority);
                      });

                    if (dateSort !== "none") {
                      filteredTableItems.sort((a, b) => {
                        const aTime = a.startAt ? new Date(a.startAt).getTime() : 0;
                        const bTime = b.startAt ? new Date(b.startAt).getTime() : 0;
                        return dateSort === "asc" ? aTime - bTime : bTime - aTime;
                      });
                    } else if (prioritySort !== "none") {
                      const order: Record<Issue["priority"], number> = { very_low: 1, low: 2, medium: 3, high: 4, urgent: 5 };
                      filteredTableItems.sort((a, b) =>
                        prioritySort === "asc" ? order[a.priority] - order[b.priority] : order[b.priority] - order[a.priority],
                      );
                    } else if (ownerSort !== "none") {
                      filteredTableItems.sort((a, b) => {
                        const aName = (a.assigneeId && memberMap[a.assigneeId]?.name) || a.assignee || "";
                        const bName = (b.assigneeId && memberMap[b.assigneeId]?.name) || b.assignee || "";
                        return ownerSort === "asc" ? aName.localeCompare(bName) : bName.localeCompare(aName);
                      });
                    }
                    return (
                    <div key={group.key}>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="group/title flex items-center gap-2">
                          <div className="text-lg font-semibold text-foreground">{group.label}</div>
                          {group.key !== "ungrouped" && (
                            <div className="flex items-center gap-1 opacity-0 transition group-hover/title:opacity-100">
                              <button
                                type="button"
                                onClick={() => groupEntity && handleRenameGroup(groupEntity)}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted transition hover:bg-subtle/60"
                                aria-label="테이블 이름 수정"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => groupEntity && setGroupDeleteModal(groupEntity)}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted transition hover:bg-subtle/60"
                                aria-label="테이블 삭제"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setIssueCreateModal({
                                groupKey: group.key,
                                title: "",
                                status: "todo",
                                priority: "medium",
                                startAt: "",
                                endAt: "",
                              })
                            }
                            className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2 text-xs text-muted transition hover:bg-subtle/60"
                          >
                            + 이슈 추가
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-[4px_1fr] gap-4">
                        <div
                          className="rounded-full"
                          style={{ backgroundColor: group.color || "#94a3b8" }}
                        />
                        <div className="space-y-2">
                          <div className="hidden md:grid grid-cols-[2fr_110px_120px_90px_90px_130px] items-center gap-2 px-3 py-2 text-xs font-bold text-muted">
                            <div className="text-center">업무</div>
                            <div
                              className="relative flex items-center justify-center gap-1"
                              data-filter-root={`date-${group.key}`}
                            >
                              <span>날짜</span>
                              <button
                                type="button"
                                onClick={() => setOpenFilter((prev) => (prev === `date-${group.key}` ? null : `date-${group.key}`))}
                                className={[
                                  "inline-flex h-5 w-5 items-center justify-center rounded-md transition",
                                  (tableDateFilter[group.key]?.size ?? 0) > 0 || (tableDateSort[group.key] ?? "none") !== "none"
                                    ? "text-brand"
                                    : "text-muted hover:text-foreground",
                                ].join(" ")}
                                aria-label="날짜 필터"
                              >
                                <Filter size={12} />
                              </button>
                              {openFilter === `date-${group.key}` && (
                                <div className="absolute right-0 top-6 z-20 w-52 rounded-xl border border-border bg-panel p-3 text-xs text-foreground shadow-lg">
                                  <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-muted">
                                    날짜 필터
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setTableDateFilter((prev) => ({ ...prev, [group.key]: new Set() }));
                                        setTableDateSort((prev) => ({ ...prev, [group.key]: "none" }));
                                      }}
                                      className="text-[10px] text-muted hover:text-foreground"
                                    >
                                      초기화
                                    </button>
                                  </div>
                                  <div className="mb-2 flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setTableDateSort((prev) => ({
                                          ...prev,
                                          [group.key]: (prev[group.key] ?? "none") === "asc" ? "none" : "asc",
                                        }))
                                      }
                                      className={[
                                        "inline-flex h-7 w-7 items-center justify-center rounded-md border",
                                        (tableDateSort[group.key] ?? "none") === "asc"
                                          ? "border-brand/40 bg-brand/10 text-brand"
                                          : "border-border text-muted",
                                      ].join(" ")}
                                      aria-label="날짜 오름차순"
                                    >
                                      <ArrowUpWideNarrow size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setTableDateSort((prev) => ({
                                          ...prev,
                                          [group.key]: (prev[group.key] ?? "none") === "desc" ? "none" : "desc",
                                        }))
                                      }
                                      className={[
                                        "inline-flex h-7 w-7 items-center justify-center rounded-md border",
                                        (tableDateSort[group.key] ?? "none") === "desc"
                                          ? "border-brand/40 bg-brand/10 text-brand"
                                          : "border-border text-muted",
                                      ].join(" ")}
                                      aria-label="날짜 내림차순"
                                    >
                                      <ArrowDownWideNarrow size={12} />
                                    </button>
                                  </div>
                                  <div className="max-h-44 space-y-1 overflow-y-auto rounded-md border border-border/50 bg-background/60 p-2">
                                    {Array.from(
                                      new Set(group.items.map((issue) => formatIssueDateRange(issue.startAt, issue.endAt))),
                                    ).map((value) => (
                                      <label key={value} className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-subtle/60">
                                        <input
                                          type="checkbox"
                                          className="h-3 w-3"
                                          checked={tableDateFilter[group.key]?.has(value) ?? false}
                                          onChange={(e) => {
                                            setTableDateFilter((prev) => {
                                              const next = new Set(prev[group.key] ?? []);
                                              if (e.target.checked) next.add(value);
                                              else next.delete(value);
                                              return { ...prev, [group.key]: next };
                                            });
                                          }}
                                        />
                                        <span className="truncate">{value}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div
                              className="relative flex items-center justify-center gap-1"
                              data-filter-root={`owner-${group.key}`}
                            >
                              <span>소유자</span>
                              <button
                                type="button"
                                onClick={() => setOpenFilter((prev) => (prev === `owner-${group.key}` ? null : `owner-${group.key}`))}
                                className={[
                                  "inline-flex h-5 w-5 items-center justify-center rounded-md transition",
                                  (tableOwnerFilter[group.key]?.size ?? 0) > 0 || (tableOwnerSort[group.key] ?? "none") !== "none"
                                    ? "text-brand"
                                    : "text-muted hover:text-foreground",
                                ].join(" ")}
                                aria-label="소유자 필터"
                              >
                                <Filter size={12} />
                              </button>
                              {openFilter === `owner-${group.key}` && (
                                <div className="absolute right-0 top-6 z-20 w-56 rounded-xl border border-border bg-panel p-3 text-xs text-foreground shadow-lg">
                                  <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-muted">
                                    소유자 필터
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setTableOwnerFilter((prev) => ({ ...prev, [group.key]: new Set() }));
                                        setTableOwnerSort((prev) => ({ ...prev, [group.key]: "none" }));
                                      }}
                                      className="text-[10px] text-muted hover:text-foreground"
                                    >
                                      초기화
                                    </button>
                                  </div>
                                  <div className="mb-2 flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setTableOwnerSort((prev) => ({
                                          ...prev,
                                          [group.key]: (prev[group.key] ?? "none") === "asc" ? "none" : "asc",
                                        }))
                                      }
                                      className={[
                                        "inline-flex h-7 w-7 items-center justify-center rounded-md border",
                                        (tableOwnerSort[group.key] ?? "none") === "asc"
                                          ? "border-brand/40 bg-brand/10 text-brand"
                                          : "border-border text-muted",
                                      ].join(" ")}
                                      aria-label="소유자 오름차순"
                                    >
                                      <ArrowUpAZ size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setTableOwnerSort((prev) => ({
                                          ...prev,
                                          [group.key]: (prev[group.key] ?? "none") === "desc" ? "none" : "desc",
                                        }))
                                      }
                                      className={[
                                        "inline-flex h-7 w-7 items-center justify-center rounded-md border",
                                        (tableOwnerSort[group.key] ?? "none") === "desc"
                                          ? "border-brand/40 bg-brand/10 text-brand"
                                          : "border-border text-muted",
                                      ].join(" ")}
                                      aria-label="소유자 내림차순"
                                    >
                                      <ArrowDownAZ size={12} />
                                    </button>
                                  </div>
                                  <div className="max-h-44 space-y-1 overflow-y-auto rounded-md border border-border/50 bg-background/60 p-2">
                                    {Array.from(
                                      new Map(
                                        group.items.map((issue) => {
                                          const key = issue.assigneeId || issue.assignee || "unassigned";
                                          const label =
                                            (issue.assigneeId && memberMap[issue.assigneeId]?.name) ||
                                            issue.assignee ||
                                            "미지정";
                                          return [key, label] as const;
                                        }),
                                      ),
                                    ).map(([key, label]) => {
                                      const avatar = key !== "unassigned" ? memberMap[key]?.avatarUrl : null;
                                      return (
                                        <label key={key} className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-subtle/60">
                                          <input
                                            type="checkbox"
                                            className="h-3 w-3"
                                            checked={tableOwnerFilter[group.key]?.has(key) ?? false}
                                            onChange={(e) => {
                                              setTableOwnerFilter((prev) => {
                                                const next = new Set(prev[group.key] ?? []);
                                                if (e.target.checked) next.add(key);
                                                else next.delete(key);
                                                return { ...prev, [group.key]: next };
                                              });
                                            }}
                                          />
                                          {avatar ? (
                                            <img src={avatar} alt={label} className="h-5 w-5 rounded-full object-cover" />
                                          ) : (
                                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-subtle text-[9px] font-semibold text-muted">
                                              {label.slice(0, 1).toUpperCase()}
                                            </div>
                                          )}
                                          <span className="truncate">{label}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div
                              className="relative flex items-center justify-center gap-1"
                              data-filter-root={`priority-${group.key}`}
                            >
                              <span>우선순위</span>
                              <button
                                type="button"
                                onClick={() => setOpenFilter((prev) => (prev === `priority-${group.key}` ? null : `priority-${group.key}`))}
                                className={[
                                  "inline-flex h-5 w-5 items-center justify-center rounded-md transition",
                                  (tablePriorityFilter[group.key]?.size ?? 0) > 0 || (tablePrioritySort[group.key] ?? "none") !== "none"
                                    ? "text-brand"
                                    : "text-muted hover:text-foreground",
                                ].join(" ")}
                                aria-label="우선순위 필터"
                              >
                                <Filter size={12} />
                              </button>
                              {openFilter === `priority-${group.key}` && (
                                <div className="absolute right-0 top-6 z-20 w-52 rounded-xl border border-border bg-panel p-3 text-xs text-foreground shadow-lg">
                                  <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-muted">
                                    우선순위 필터
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setTablePriorityFilter((prev) => ({ ...prev, [group.key]: new Set() }));
                                        setTablePrioritySort((prev) => ({ ...prev, [group.key]: "none" }));
                                      }}
                                      className="text-[10px] text-muted hover:text-foreground"
                                    >
                                      초기화
                                    </button>
                                  </div>
                                  <div className="mb-2 flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setTablePrioritySort((prev) => ({
                                          ...prev,
                                          [group.key]: (prev[group.key] ?? "none") === "asc" ? "none" : "asc",
                                        }))
                                      }
                                      className={[
                                        "inline-flex h-7 w-7 items-center justify-center rounded-md border",
                                        (tablePrioritySort[group.key] ?? "none") === "asc"
                                          ? "border-brand/40 bg-brand/10 text-brand"
                                          : "border-border text-muted",
                                      ].join(" ")}
                                      aria-label="우선순위 오름차순"
                                    >
                                      <ArrowUpWideNarrow size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setTablePrioritySort((prev) => ({
                                          ...prev,
                                          [group.key]: (prev[group.key] ?? "none") === "desc" ? "none" : "desc",
                                        }))
                                      }
                                      className={[
                                        "inline-flex h-7 w-7 items-center justify-center rounded-md border",
                                        (tablePrioritySort[group.key] ?? "none") === "desc"
                                          ? "border-brand/40 bg-brand/10 text-brand"
                                          : "border-border text-muted",
                                      ].join(" ")}
                                      aria-label="우선순위 내림차순"
                                    >
                                      <ArrowDownWideNarrow size={12} />
                                    </button>
                                  </div>
                                  <div className="space-y-1 rounded-md border border-border/50 bg-background/60 p-2">
                                    {[
                                      { key: "low", label: "낮음" },
                                      { key: "medium", label: "중간" },
                                      { key: "high", label: "높음" },
                                      { key: "urgent", label: "매우 높음" },
                                    ].map((opt) => (
                                      <label key={opt.key} className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-subtle/60">
                                        <input
                                          type="checkbox"
                                          className="h-3 w-3"
                                          checked={tablePriorityFilter[group.key]?.has(opt.key as Issue["priority"]) ?? false}
                                          onChange={(e) => {
                                            setTablePriorityFilter((prev) => {
                                              const next = new Set(prev[group.key] ?? []);
                                              if (e.target.checked) next.add(opt.key as Issue["priority"]);
                                              else next.delete(opt.key as Issue["priority"]);
                                              return { ...prev, [group.key]: next };
                                            });
                                          }}
                                        />
                                        <span>{opt.label}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div
                              className="relative flex items-center justify-center gap-1"
                              data-filter-root={`status-${group.key}`}
                            >
                              <span>상태</span>
                              <button
                                type="button"
                                onClick={() => setOpenFilter((prev) => (prev === `status-${group.key}` ? null : `status-${group.key}`))}
                                className={[
                                  "inline-flex h-5 w-5 items-center justify-center rounded-md transition",
                                  (tableStatusFilter[group.key]?.size ?? 0) > 0 ? "text-brand" : "text-muted hover:text-foreground",
                                ].join(" ")}
                                aria-label="상태 필터"
                              >
                                <Filter size={12} />
                              </button>
                              {openFilter === `status-${group.key}` && (
                                <div className="absolute right-0 top-6 z-20 w-52 rounded-xl border border-border bg-panel p-3 text-xs text-foreground shadow-lg">
                                  <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-muted">
                                    상태 필터
                                    <button
                                      type="button"
                                      onClick={() => setTableStatusFilter((prev) => ({ ...prev, [group.key]: new Set() }))}
                                      className="text-[10px] text-muted hover:text-foreground"
                                    >
                                      초기화
                                    </button>
                                  </div>
                                  <div className="space-y-1 rounded-md border border-border/50 bg-background/60 p-2">
                                    {columns.map((col) => (
                                      <label key={col.key} className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-subtle/60">
                                        <input
                                          type="checkbox"
                                          className="h-3 w-3"
                                          checked={tableStatusFilter[group.key]?.has(col.key) ?? false}
                                          onChange={(e) => {
                                            setTableStatusFilter((prev) => {
                                              const next = new Set(prev[group.key] ?? []);
                                              if (e.target.checked) next.add(col.key);
                                              else next.delete(col.key);
                                              return { ...prev, [group.key]: next };
                                            });
                                          }}
                                        />
                                        <span>{col.label}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="text-center">진행률</div>
                          </div>
                          {filteredTableItems.map((issue) => {
                            return (
                              <div key={issue.id} className="space-y-2">
                                {renderIssueRow(issue)}
                                {issue.subtasks?.length ? renderSubtasks(issue.subtasks) : null}
                                {renderIssueActions(issue)}
                              </div>
                            );
                          })}
                          {group.items.length === 0 && (
                            <div className="rounded-xl border border-dashed border-border/60 bg-panel/60 p-4 text-sm text-muted">
                              지금 처리할 이슈가 없습니다. "새 업무"를 생성해보세요.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                  })}
                  <button
                    type="button"
                    onClick={handleAddGroup}
                    className="flex items-center justify-center rounded-xl border border-dashed border-border/70 bg-panel/60 w-full py-3 text-sm text-muted transition hover:bg-subtle/60"
                  >
                    + 업무 테이블 추가
                  </button>
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
          <aside className="hidden w-[360px] shrink-1 border-l border-border bg-panel md:flex">
            <RightPanel onClose={() => router.push(pathname.replace(/\/issues\/.*$/, "/issues"))} />
          </aside>
        )}
      </div>
      {groupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-panel p-4 shadow-lg">
            <div className="mb-3 text-sm font-semibold text-foreground">
              {groupModal.mode === "create" ? "테이블 추가" : "테이블 수정"}
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted">이름</div>
                <input
                  value={groupModal.name}
                  onChange={(e) => setGroupModal((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                  className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                  placeholder="예: 메인업무"
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted">색상</div>
                <input
                  type="color"
                  value={groupModal.color}
                  onChange={(e) => setGroupModal((prev) => (prev ? { ...prev, color: e.target.value } : prev))}
                  className="h-9 w-16 cursor-pointer rounded-md border border-border bg-background p-0"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setGroupModal(null)}
                className="h-9 rounded-md border border-border px-3 text-sm text-muted hover:bg-subtle/60"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmitGroupModal}
                className="h-9 rounded-md bg-brand px-3 text-sm font-semibold text-white hover:bg-brand/90"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
      {groupDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-panel p-4 shadow-lg">
            <div className="mb-2 text-sm font-semibold text-foreground">테이블 삭제</div>
            <div className="text-sm text-muted">
              “{groupDeleteModal.name}” 테이블을 삭제할까요? 이슈는 미분류로 이동됩니다.
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setGroupDeleteModal(null)}
                className="h-9 rounded-md border border-border px-3 text-sm text-muted hover:bg-subtle/60"
              >
                취소
              </button>
              <button
                type="button"
                onClick={async () => {
                  const target = groupDeleteModal;
                  setGroupDeleteModal(null);
                  if (target) await handleRemoveGroup(target);
                }}
                className="h-9 rounded-md bg-rose-500 px-3 text-sm font-semibold text-white hover:bg-rose-600"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
      {issueCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-panel p-4 shadow-lg">
            <div className="mb-3 text-sm font-semibold text-foreground">이슈 추가</div>
            <div className="space-y-3">
              {issueCreateModal.isSubtask && (
                <div className="rounded-md border border-border/60 bg-background/60 px-3 py-2 text-xs text-muted">
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-[2px] rounded-full bg-border" />
                    <span className="text-foreground">하위 업무 추가</span>
                  </div>
                  {issueCreateModal.parentTitle && (
                    <div className="mt-1 pl-4 text-[11px] text-muted">상위: {issueCreateModal.parentTitle}</div>
                  )}
                </div>
              )}
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted">제목</div>
                <input
                  value={issueCreateModal.title}
                  onChange={(e) => setIssueCreateModal((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
                  className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                  placeholder="업무 제목을 입력하세요"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted">상태</div>
                  <select
                    value={issueCreateModal.status}
                    onChange={(e) =>
                      setIssueCreateModal((prev) =>
                        prev ? { ...prev, status: e.target.value as Issue["status"] } : prev,
                      )
                    }
                    className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                  >
                    <option value="todo">할 일</option>
                    <option value="in_progress">작업 중</option>
                    <option value="review">리뷰 대기</option>
                    <option value="done">완료</option>
                    {columns.some((c) => c.key === "backlog") && <option value="backlog">백로그</option>}
                  </select>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted">우선순위</div>
                  <select
                    value={issueCreateModal.priority}
                    onChange={(e) =>
                      setIssueCreateModal((prev) =>
                        prev ? { ...prev, priority: e.target.value as Issue["priority"] } : prev,
                      )
                    }
                    className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                  >
                                    <option value="very_low">매우 낮음</option>
                                    <option value="low">낮음</option>
                    <option value="medium">중간</option>
                    <option value="high">높음</option>
                    <option value="urgent">매우 높음</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted">시작일</div>
                  <input
                    type="date"
                    value={issueCreateModal.startAt}
                    onChange={(e) => setIssueCreateModal((prev) => (prev ? { ...prev, startAt: e.target.value } : prev))}
                    className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted">종료일</div>
                  <input
                    type="date"
                    value={issueCreateModal.endAt}
                    onChange={(e) => setIssueCreateModal((prev) => (prev ? { ...prev, endAt: e.target.value } : prev))}
                    className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIssueCreateModal(null)}
                className="h-9 rounded-md border border-border px-3 text-sm text-muted hover:bg-subtle/60"
              >
                취소
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!projectId || !issueCreateModal?.title.trim()) return;
                  if (issueCreateModal.isSubtask && !issueCreateModal.parentId) return;
                  const created = issueCreateModal.isSubtask
                    ? await addSubtask(projectId, {
                        parentId: issueCreateModal.parentId ?? "",
                        title: issueCreateModal.title.trim(),
                        assigneeId: profile?.id,
                        startAt: issueCreateModal.startAt || undefined,
                        dueAt: issueCreateModal.endAt || undefined,
                      })
                    : await createIssue(projectId, {
                        title: issueCreateModal.title.trim(),
                        status: issueCreateModal.status,
                        priority: issueCreateModal.priority,
                        assigneeId: profile?.id,
                        groupId: issueCreateModal.groupKey === "ungrouped" ? undefined : issueCreateModal.groupKey,
                        startAt: issueCreateModal.startAt || undefined,
                        endAt: issueCreateModal.endAt || undefined,
                        parentId: issueCreateModal.parentId,
                      });
                  setIssues((prev) => {
                    const next = [...prev, created];
                    if (issueCreateModal.isSubtask && issueCreateModal.parentId) {
                      return updateIssueTree(next, issueCreateModal.parentId, (item) => ({
                        ...item,
                        subtasks: [...(item.subtasks ?? []), created],
                      }));
                    }
                    return next;
                  });
                  if (issueCreateModal.isSubtask && issueCreateModal.parentId) {
                    setIssueDetail((prev) => {
                      if (!prev || prev.id !== issueCreateModal.parentId) return prev;
                      return { ...prev, subtasks: [...(prev.subtasks ?? []), created] };
                    });
                  }
                  setIssueCreateModal(null);
                }}
                className="h-9 rounded-md bg-brand px-3 text-sm font-semibold text-white hover:bg-brand/90"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
      {issueEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-panel p-4 shadow-lg">
            <div className="mb-3 text-sm font-semibold text-foreground">이슈 수정</div>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted">제목</div>
                <input
                  value={issueEditModal.title}
                  onChange={(e) => setIssueEditModal((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
                  className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted">시작일</div>
                  <input
                    type="date"
                    value={issueEditModal.startAt}
                    onChange={(e) => setIssueEditModal((prev) => (prev ? { ...prev, startAt: e.target.value } : prev))}
                    className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted">종료일</div>
                  <input
                    type="date"
                    value={issueEditModal.endAt}
                    onChange={(e) => setIssueEditModal((prev) => (prev ? { ...prev, endAt: e.target.value } : prev))}
                    className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted">테이블 이동</div>
                <select
                  value={issueEditModal.issue.group?.id ?? "ungrouped"}
                  onChange={(e) =>
                    setIssueEditModal((prev) =>
                      prev
                        ? {
                            ...prev,
                            issue: {
                              ...prev.issue,
                              group: e.target.value === "ungrouped"
                                ? undefined
                                : issueGroups.find((g) => g.id === e.target.value),
                            },
                          }
                        : prev,
                    )
                  }
                  className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                >
                  <option value="ungrouped">미분류</option>
                  {issueGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted">하위 이슈</div>
                <div className="space-y-2 rounded-md border border-border/60 bg-background/60 p-2 text-xs">
                  {issueDetail?.subtasks?.length ? (
                    issueDetail.subtasks.map((sub) => (
                      <div
                        key={sub.id}
                        className="relative ml-4 flex items-center justify-between rounded-md bg-panel/70 px-2 py-1 text-[11px] before:absolute before:-left-2 before:top-0 before:h-full before:w-[2px] before:rounded-full before:bg-border/70"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setIssueEditModal({
                              issue: sub,
                              title: sub.title,
                              status: sub.status,
                              priority: sub.priority,
                              startAt: sub.startAt ?? "",
                              endAt: sub.endAt ?? "",
                            })
                          }
                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        >
                          <span className="text-muted">
                            <CornerDownRight size={14} />
                          </span>
                          <span className="truncate text-foreground">{sub.title}</span>
                          <span className="text-[10px] text-muted">{formatIssueDateRange(sub.startAt, sub.endAt)}</span>
                        </button>
                        <button
                          type="button"
                          onClick={async (event) => {
                            event.stopPropagation();
                            if (!projectId) return;
                            await deleteSubtask(projectId, sub.id);
                            setIssueDetail((prev) => ({
                              ...(prev ?? issueEditModal.issue),
                              subtasks: (prev?.subtasks ?? []).filter((item) => item.id !== sub.id),
                            }));
                          }}
                          className="ml-2 rounded-md border border-border px-2 py-1 text-[10px] text-muted hover:bg-subtle/60"
                        >
                          삭제
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-muted">하위 이슈가 없습니다.</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={subtaskDraft}
                    onChange={(e) => setSubtaskDraft(e.target.value)}
                    placeholder="하위 이슈 추가"
                    className="h-9 flex-1 rounded-md border border-border bg-background px-3 text-sm"
                  />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!projectId || !issueEditModal.issue.id || !subtaskDraft.trim()) return;
                      const created = await addSubtask(projectId, {
                        parentId: issueEditModal.issue.id,
                        title: subtaskDraft.trim(),
                      });
                      setIssueDetail((prev) => ({
                        ...(prev ?? issueEditModal.issue),
                        subtasks: [...(prev?.subtasks ?? []), created],
                      }));
                      setIssues((prev) =>
                        updateIssueTree(prev, issueEditModal.issue.id, (item) => ({
                          ...item,
                          subtasks: [...(item.subtasks ?? []), created],
                        })),
                      );
                      setSubtaskDraft("");
                    }}
                    className="h-9 rounded-md border border-border px-3 text-xs text-muted hover:bg-subtle/60"
                  >
                    추가
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted">코멘트</div>
                <div className="space-y-2 rounded-md border border-border/60 bg-background/60 p-2 text-xs">
                  {issueComments.length ? (
                    issueComments.map((comment) => (
                      <div key={comment.id} className="rounded-md bg-panel/70 px-2 py-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <div className="h-6 w-6 overflow-hidden rounded-full border border-border bg-subtle/60">
                              {comment.authorAvatarUrl ? (
                                <img src={comment.authorAvatarUrl} alt={comment.author} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[10px] text-muted">
                                  {comment.author.slice(0, 1)}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-[10px] font-semibold text-muted">{comment.author}</div>
                              <div className="text-[10px] text-muted">{formatIssueDateTime(comment.createdAt)}</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!projectId) return;
                              await deleteComment(projectId, comment.id);
                              setIssueComments((prev) => prev.filter((item) => item.id !== comment.id));
                            }}
                            className="rounded-md border border-border px-2 py-1 text-[10px] text-muted hover:bg-subtle/60"
                          >
                            삭제
                          </button>
                        </div>
                        <div className="mt-2 text-foreground">{comment.body}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-muted">코멘트가 없습니다.</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    placeholder="코멘트 입력"
                    className="h-9 flex-1 rounded-md border border-border bg-background px-3 text-sm"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!projectId || !issueEditModal.issue.id || !commentDraft.trim()) return;
                      const created = await addComment(
                        issueEditModal.issue.id,
                        profile?.name ?? "User",
                        commentDraft.trim(),
                        projectId,
                      );
                      const enriched = {
                        ...created,
                        author: profile?.name ?? created.author,
                        authorAvatarUrl: created.authorAvatarUrl ?? profile?.avatarUrl ?? undefined,
                      };
                      setIssueComments((prev) => [...prev, enriched]);
                      setCommentDraft("");
                    }}
                    className="h-9 rounded-md border border-border px-3 text-xs text-muted hover:bg-subtle/60"
                  >
                    등록
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIssueEditModal(null)}
                className="h-9 rounded-md border border-border px-3 text-sm text-muted hover:bg-subtle/60"
              >
                취소
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!projectId) return;
                  const updated = await updateIssue(projectId, issueEditModal.issue.id, {
                    title: issueEditModal.title.trim(),
                    startAt: issueEditModal.startAt || undefined,
                    endAt: issueEditModal.endAt || undefined,
                    groupId: issueEditModal.issue.group?.id,
                  });
                  setIssues((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
                  setIssueDetail((prev) => {
                    if (!prev) return prev;
                    if (prev.id === updated.id) return { ...prev, ...updated };
                    if (!prev.subtasks?.length) return prev;
                    return {
                      ...prev,
                      subtasks: prev.subtasks.map((item) => (item.id === updated.id ? updated : item)),
                    };
                  });
                  setIssueEditModal(null);
                }}
                className="h-9 rounded-md bg-brand px-3 text-sm font-semibold text-white hover:bg-brand/90"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
      {issueDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-panel p-4 shadow-lg">
            <div className="mb-2 text-sm font-semibold text-foreground">이슈 삭제</div>
            <div className="text-sm text-muted">“{issueDeleteModal.title}” 이슈를 삭제할까요?</div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIssueDeleteModal(null)}
                className="h-9 rounded-md border border-border px-3 text-sm text-muted hover:bg-subtle/60"
              >
                취소
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!projectId) return;
                  await deleteIssue(projectId, issueDeleteModal.id);
                  setIssues((prev) => prev.filter((item) => item.id !== issueDeleteModal.id));
                  setIssueDeleteModal(null);
                }}
                className="h-9 rounded-md bg-rose-500 px-3 text-sm font-semibold text-white hover:bg-rose-600"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
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
  very_low: "bg-slate-100 text-slate-600",
  low: "bg-sky-100 text-sky-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-rose-100 text-rose-700",
};

function formatIssueDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${mm}.${dd}`;
}

function formatIssueDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${mm}.${dd} ${hh}:${min}`;
}

function formatCommentDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
}

function formatIssueDateRange(startAt?: string, endAt?: string) {
  if (!startAt) return "—";
  const start = new Date(startAt);
  if (Number.isNaN(start.getTime())) return "—";
  if (!endAt) return formatIssueDate(startAt);
  const end = new Date(endAt);
  if (Number.isNaN(end.getTime())) return formatIssueDate(startAt);

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  if (sameDay) {
    return formatIssueDate(startAt);
  }
  return `${formatIssueDate(startAt)} ~ ${formatIssueDate(endAt)}`;
}

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

  const rangeMs = timelineEnd.getTime() - timelineStart.getTime();
  const dayWidth = 56;
  const gridWidth = days.length * dayWidth;
  const rowHeight = 36;
  const dayMs = 24 * 60 * 60 * 1000;
  const toLocalDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = (date: Date, start: Date) =>
    Math.floor((toLocalDay(date).getTime() - toLocalDay(start).getTime()) / dayMs);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4">
        {issuesByGroup.map(([groupId, group]) => {
          const assigneeMap = new Map<string, Issue[]>();
          group.items.forEach((issue) => {
            const key = issue.assigneeId || issue.assignee || "unassigned";
            const list = assigneeMap.get(key) ?? [];
            if (!list.find((item) => item.id === issue.id)) {
              list.push(issue);
              assigneeMap.set(key, list);
            }
          });

          return (
            <div key={groupId} className="rounded-xl border border-border bg-panel/60">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: group.color }} />
                <span>{group.name}</span>
              </div>
              <div className="flex min-w-0">
                <div className="w-52 shrink-0 border-r border-border">
                  <div className="sticky top-0 z-10 h-11 border-b border-border bg-panel/90 px-4 text-xs font-semibold text-muted flex items-center">
                    구분
                  </div>
                  <div className="sticky top-11 z-10 h-9 border-b border-border bg-panel/90 px-4 text-xs font-semibold text-muted flex items-center">
                    담당자
                  </div>
                  <div className="divide-y divide-border">
                    {Array.from(assigneeMap.entries()).map(([assigneeKey, items], rowIdx) => {
                      const name =
                        memberMap[assigneeKey]?.name ||
                        items[0]?.assignee ||
                        "미지정";
                      const avatar = memberMap[assigneeKey]?.avatarUrl ?? null;
                      const totalHeight = Math.max(items.length, 1) * rowHeight;
                      return (
                        <div
                          key={`${groupId}-${assigneeKey}`}
                          className={[
                            "flex items-start gap-3 px-4 py-3 border-b border-border/60",
                            rowIdx % 2 === 1 ? "bg-subtle/20" : "",
                          ].join(" ")}
                          style={{ minHeight: totalHeight }}
                        >
                          {avatar ? (
                            <img src={avatar} alt={name} className="h-9 w-9 rounded-full object-cover" />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-subtle text-xs font-semibold text-muted">
                              {name.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <span className="text-sm font-medium">{name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex-1 min-w-0 overflow-x-auto overflow-y-hidden">
                  <div style={{ minWidth: gridWidth }}>
                    <div className="sticky top-0 z-10 flex h-11 items-center border-b border-border bg-panel/90 text-xs font-semibold text-muted">
                      {weeks.map((week) => (
                        <span
                          key={week}
                          className="flex items-center justify-center border-r border-border/60 last:border-r-0"
                          style={{ width: dayWidth * 7 }}
                        >
                          {week + 1}주차
                        </span>
                      ))}
                    </div>
                    <div
                      className="sticky top-11 z-10 flex h-9 items-center border-b border-border bg-panel/90 text-[10px] text-muted"
                      style={{
                        backgroundImage:
                          "linear-gradient(to right, rgba(148,163,184,0.2) 1px, transparent 1px), linear-gradient(to right, rgba(148,163,184,0.45) 1px, transparent 1px)",
                        backgroundSize: `${dayWidth}px 100%, ${dayWidth * 7}px 100%`,
                      }}
                    >
                      {days.map((day) => (
                        <span key={day} className="text-center" style={{ width: dayWidth }}>
                          {day}
                        </span>
                      ))}
                    </div>
                    {Array.from(assigneeMap.entries()).map(([assigneeKey, items], rowIdx) => {
                      const byId = new Map(items.map((item) => [item.id, item]));
                      const children = new Map<string, Issue[]>();
                      items.forEach((item) => {
                        if (item.parentId && byId.has(item.parentId)) {
                          const list = children.get(item.parentId) ?? [];
                          list.push(item);
                          children.set(item.parentId, list);
                        }
                      });
                      const sortedRoots = items
                        .filter((item) => !item.parentId || !byId.has(item.parentId))
                        .sort((a, b) => {
                          const aStart = parseTimelineDate(a.startAt ?? a.endAt ?? "", false)?.getTime() ?? 0;
                          const bStart = parseTimelineDate(b.startAt ?? b.endAt ?? "", false)?.getTime() ?? 0;
                          return aStart - bStart;
                        });
                      const ordered: Issue[] = [];
                      const walkOrdered = (root: Issue) => {
                        ordered.push(root);
                        const kids = (children.get(root.id) ?? []).sort((a, b) => {
                          const aStart = parseTimelineDate(a.startAt ?? a.endAt ?? "", false)?.getTime() ?? 0;
                          const bStart = parseTimelineDate(b.startAt ?? b.endAt ?? "", false)?.getTime() ?? 0;
                          return aStart - bStart;
                        });
                        kids.forEach(walkOrdered);
                      };
                      sortedRoots.forEach(walkOrdered);

                      return (
                        <div
                          key={`${groupId}-${assigneeKey}-bar`}
                          className={[
                            "relative border-b border-border/60",
                            rowIdx % 2 === 1 ? "bg-subtle/20" : "",
                          ].join(" ")}
                          style={{
                            height: Math.max(ordered.length, 1) * rowHeight,
                            backgroundImage:
                              "linear-gradient(to right, rgba(148,163,184,0.2) 1px, transparent 1px), linear-gradient(to right, rgba(148,163,184,0.45) 1px, transparent 1px)",
                            backgroundSize: `${dayWidth}px 100%, ${dayWidth * 7}px 100%`,
                          }}
                        >
                          {ordered.map((issue, idx) => {
                            if (!issue.startAt && !issue.endAt) return null;
                            const startRaw = issue.startAt ?? issue.endAt;
                            const endRaw = issue.endAt ?? issue.startAt;
                            if (!startRaw || !endRaw) return null;
                            const startDate = parseTimelineDate(startRaw, false);
                            const endDate = parseTimelineDate(endRaw, true);
                            if (!startDate || !endDate) return null;
                            const startIndex = Math.max(0, diffDays(startDate, timelineStart));
                            const endIndex = Math.min(days.length - 1, diffDays(endDate, timelineStart));
                            const leftPx = startIndex * dayWidth;
                            const widthPx = Math.max((endIndex - startIndex + 1) * dayWidth, 4);
                            const getDepth = (item: Issue) => {
                              let depth = 0;
                              let cursor = item.parentId ? byId.get(item.parentId) : undefined;
                              while (cursor) {
                                depth += 1;
                                cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
                              }
                              return depth;
                            };
                            const depth = getDepth(issue);
                            const isSubtask = depth > 0;
                            const isDeepSubtask = depth > 1;
                            const inset = depth ? 6 + Math.min(depth - 1, 2) * 4 : 0;
                            const barWidth = Math.max(widthPx - inset * 2, 12);
                            return (
                              <div
                                key={issue.id}
                                className={[
                                  "group absolute rounded-xl px-3 text-xs text-white shadow-sm",
                                  isSubtask ? "py-2 opacity-90 text-[10px] font-semibold" : "py-2.5 font-bold",
                                  isDeepSubtask ? "opacity-50 text-[9px] font-medium" : "",
                                ].join(" ")}
                                style={{
                                  top: idx * rowHeight + rowHeight / 2,
                                  transform: "translateY(-50%)",
                                  left: leftPx + inset,
                                  width: barWidth,
                                  backgroundColor: group.color,
                                }}
                                onMouseEnter={(e) => {
                                  const assignee = issue.assignee ?? "미지정";
                                  const avatarUrl =
                                    (issue.assigneeId && memberMap[issue.assigneeId]?.avatarUrl) ||
                                    Object.values(memberMap).find((m) => m.name === issue.assignee)?.avatarUrl ||
                                    null;
                                  setHoveredIssue({
                                    title: issue.title,
                                    range: formatIssueDateRange(issue.startAt, issue.endAt),
                                    assignee,
                                    avatarUrl,
                                    x: e.clientX,
                                    y: e.clientY,
                                  });
                                }}
                                onMouseMove={(e) => {
                                  setHoveredIssue((prev) =>
                                    prev
                                      ? { ...prev, x: e.clientX, y: e.clientY }
                                      : null,
                                  );
                                }}
                                onMouseLeave={() => setHoveredIssue(null)}
                              >
                                <span className="truncate">{isSubtask ? `↳ ${issue.title}` : issue.title}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {hoveredIssue && (
        <div
          className="fixed z-[60] w-56 rounded-lg border border-border bg-panel px-3 py-2 text-[11px] text-foreground shadow-lg"
          style={{ left: hoveredIssue.x + 12, top: hoveredIssue.y + 12 }}
        >
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-subtle px-2 py-0.5 text-[10px] font-semibold text-muted">타이틀</span>
            <span className="truncate font-semibold">{hoveredIssue.title}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-full bg-subtle px-2 py-0.5 text-[10px] font-semibold text-muted">날짜</span>
            <span className="text-muted">{hoveredIssue.range}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-full bg-subtle px-2 py-0.5 text-[10px] font-semibold text-muted">담당자</span>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 overflow-hidden rounded-full border border-border bg-subtle/60">
                {hoveredIssue.avatarUrl ? (
                  <img src={hoveredIssue.avatarUrl} alt={hoveredIssue.assignee} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[10px] text-muted">
                    {hoveredIssue.assignee.slice(0, 1).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="text-foreground">{hoveredIssue.assignee}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
