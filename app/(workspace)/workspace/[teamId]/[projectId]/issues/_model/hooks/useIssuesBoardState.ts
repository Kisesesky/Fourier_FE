// app/(workspace)/workspace/[teamId]/[projectId]/issues/_model/hooks/useIssuesBoardState.ts
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Issue, IssueComment, IssueGroup } from "@/workspace/issues/_model/types";
import {
  createIssue,
  createIssueGroup,
  getIssueById,
  listComments,
  listIssueGroups,
  listIssues,
  removeIssueGroup,
  updateIssue,
  updateIssueGroup,
  updateIssueProgress,
  updateIssueStatus,
} from "@/workspace/issues/_service/api";
import { fetchProjectMembers } from "@/lib/projects";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import type {
  GroupModalState,
  IssueCreateModalState,
  IssueEditModalState,
} from "@/workspace/issues/_model/board.types";
import { useIssuesViewStore } from "@/workspace/issues/_model/store/useIssuesViewStore";

export function useIssuesBoardState({
  teamId,
  projectId,
  baseColumns,
}: {
  teamId?: string;
  projectId?: string;
  baseColumns: Array<{ key: Issue["status"]; label: string }>;
}) {
  const pickText = (value: string | undefined, fallback: string | undefined) =>
    value == null || value === "" ? fallback : value;
  const pickId = (value: string | undefined, fallback: string | undefined) =>
    value == null || value === "" ? fallback : value;
  const mergeIssueUpdate = (item: Issue, updated: Issue) => ({
    ...item,
    ...updated,
    title: pickText(updated.title, item.title) ?? "",
    status: updated.status ?? item.status,
    priority: updated.priority ?? item.priority,
    assigneeId: pickId(updated.assigneeId, item.assigneeId),
    assignee: pickText(updated.assignee, item.assignee),
    startAt: updated.startAt ?? item.startAt,
    endAt: updated.endAt ?? item.endAt,
    parentId: updated.parentId ?? item.parentId,
    group: updated.group ?? item.group,
    subtasks: item.subtasks,
    comments: item.comments,
  });
  const [issues, setIssues] = useState<Issue[]>([]);
  const [issueGroups, setIssueGroups] = useState<IssueGroup[]>([]);
  const [groupModal, setGroupModal] = useState<GroupModalState | null>(null);
  const [groupDeleteModal, setGroupDeleteModal] = useState<IssueGroup | null>(null);
  const [issueCreateModal, setIssueCreateModal] = useState<IssueCreateModalState | null>(null);
  const [issueActionsId, setIssueActionsId] = useState<string | null>(null);
  const [issueDeleteModal, setIssueDeleteModal] = useState<Issue | null>(null);
  const [issueEditModal, setIssueEditModal] = useState<IssueEditModalState | null>(null);
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
  const { profile } = useAuthProfile();
  const {
    tableStatusFilter,
    setTableStatusFilter,
    tablePriorityFilter,
    setTablePriorityFilter,
    tableOwnerFilter,
    setTableOwnerFilter,
    tableDateFilter,
    setTableDateFilter,
    tablePrioritySort,
    setTablePrioritySort,
    tableOwnerSort,
    setTableOwnerSort,
    tableDateSort,
    setTableDateSort,
    openFilter,
    setOpenFilter,
    view,
    setView,
    resetIssuesViewState,
  } = useIssuesViewStore();
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
    resetIssuesViewState();
  }, [projectId, resetIssuesViewState]);

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
    return hasBacklog ? [{ key: "backlog" as const, label: "Backlog" }, ...baseColumns] : baseColumns;
  }, [issues, baseColumns]);

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
    _tags: string[],
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
    await createIssue(projectId, {
      title,
      status,
      priority: mappedPriority,
      assigneeId: profile?.id,
      groupId: defaultGroupId,
      dueAt: due ?? undefined,
    });
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
    if (!projectId || !issue.id || issue.id === "undefined" || issue.status === next) return;
    setIssues((prev) =>
      updateIssueTree(prev, issue.id, (item) => ({
        ...item,
        status: next,
        group: issue.group ?? item.group,
        parentId: item.parentId,
        assigneeId: issue.assigneeId ?? item.assigneeId,
        assignee: issue.assignee ?? item.assignee,
        progress: next === "done" ? 100 : item.progress,
      })),
    );
    const updated = await updateIssueStatus(projectId, issue.id, next);
    if (!updated?.id) return;
    setIssues((prev) =>
      updateIssueTree(prev, issue.id, (item) => ({
        ...mergeIssueUpdate(item, updated),
        progress: next === "done" ? 100 : updated.progress,
      })),
    );
    if (next === "done") {
      void handleProgressCommit(issue, 100);
    }
  };

  const handleProgressCommit = async (issue: Issue, next: number) => {
    if (!projectId || !issue.id || issue.id === "undefined") return;
    try {
      const updated = await updateIssueProgress(projectId, issue.id, next);
      setIssues((prev) =>
        updateIssueTree(prev, issue.id, (item) => mergeIssueUpdate(item, updated)),
      );
    } catch {
      // ignore
    }
  };

  const handlePriorityChange = async (issue: Issue, next: Issue["priority"]) => {
    if (!projectId || !issue.id || issue.id === "undefined" || issue.priority === next) return;
    try {
      const updated = await updateIssue(projectId, issue.id, { priority: next });
      setIssues((prev) =>
        updateIssueTree(prev, issue.id, (item) => mergeIssueUpdate(item, updated)),
      );
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

  return {
    issues,
    setIssues,
    issueGroups,
    setIssueGroups,
    groupModal,
    setGroupModal,
    groupDeleteModal,
    setGroupDeleteModal,
    issueCreateModal,
    setIssueCreateModal,
    issueActionsId,
    setIssueActionsId,
    issueDeleteModal,
    setIssueDeleteModal,
    issueEditModal,
    setIssueEditModal,
    issueDetail,
    setIssueDetail,
    issueComments,
    setIssueComments,
    commentDraft,
    setCommentDraft,
    subtaskDraft,
    setSubtaskDraft,
    commentThreads,
    setCommentThreads,
    openCommentThreads,
    setOpenCommentThreads,
    commentThreadDrafts,
    setCommentThreadDrafts,
    commentSubmitting,
    setCommentSubmitting,
    commentEditingId,
    setCommentEditingId,
    commentEditingDraft,
    setCommentEditingDraft,
    commentReactions,
    setCommentReactions,
    loading,
    memberMap,
    profile,
    tableStatusFilter,
    setTableStatusFilter,
    tablePriorityFilter,
    setTablePriorityFilter,
    tableOwnerFilter,
    setTableOwnerFilter,
    tableDateFilter,
    setTableDateFilter,
    tablePrioritySort,
    setTablePrioritySort,
    tableOwnerSort,
    setTableOwnerSort,
    tableDateSort,
    setTableDateSort,
    openFilter,
    setOpenFilter,
    view,
    setView,
    issueActionsRef,
    refresh,
    handleToggleComments,
    columns,
    filteredIssues,
    grouped,
    handleCreate,
    tableGroups,
    handleAddGroup,
    handleRenameGroup,
    handleRemoveGroup,
    handleSubmitGroupModal,
    handleStatusChange,
    handleProgressCommit,
    handlePriorityChange,
    updateIssueTree,
  };
}
