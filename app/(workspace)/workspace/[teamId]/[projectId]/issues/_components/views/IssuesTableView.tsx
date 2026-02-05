"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import { Filter, Pencil, Trash2 } from "lucide-react";

import type { Issue, IssueComment, IssueGroup } from "@/workspace/issues/_model/types";
import IssueRow from "@/workspace/issues/_components/views/table/IssueRow";
import IssueActions from "@/workspace/issues/_components/views/table/IssueActions";
import SubtaskList from "@/workspace/issues/_components/views/table/SubtaskList";
import { formatIssueDateRange } from "@/workspace/issues/_components/utils/issueViewUtils";

export type IssueGroupSection = {
  key: string;
  label: string;
  color?: string | null;
  items: Issue[];
};

type IssueCreateModalState = {
  groupKey: string;
  title: string;
  status: Issue["status"];
  priority: Issue["priority"];
  startAt: string;
  endAt: string;
  parentId?: string;
  parentTitle?: string;
  parentStartAt?: string;
  parentEndAt?: string;
  isSubtask?: boolean;
} | null;

type IssueEditModalState = {
  issue: Issue;
  title: string;
  status: Issue["status"];
  priority: Issue["priority"];
  startAt: string;
  endAt: string;
} | null;

export default function IssuesTableView({
  tableGroups,
  issueGroups,
  columns,
  memberMap,
  openFilter,
  setOpenFilter,
  tableDateFilter,
  setTableDateFilter,
  tableOwnerFilter,
  setTableOwnerFilter,
  tableStatusFilter,
  setTableStatusFilter,
  tablePriorityFilter,
  setTablePriorityFilter,
  tableDateSort,
  setTableDateSort,
  tableOwnerSort,
  setTableOwnerSort,
  tablePrioritySort,
  setTablePrioritySort,
  issueActionsId,
  setIssueActionsId,
  issueActionsRef,
  setIssueCreateModal,
  setIssueEditModal,
  setIssueDeleteModal,
  setGroupDeleteModal,
  onRenameGroup,
  onAddGroup,
  handleStatusChange,
  handleProgressCommit,
  handlePriorityChange,
  setIssues,
  handleToggleComments,
  commentThreads,
  setCommentThreads,
  openCommentThreads,
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
  profile,
  projectId,
}: {
  tableGroups: IssueGroupSection[];
  issueGroups: IssueGroup[];
  columns: Array<{ key: Issue["status"]; label: string }>;
  memberMap: Record<string, { name: string; avatarUrl?: string | null }>;
  openFilter: string | null;
  setOpenFilter: Dispatch<SetStateAction<string | null>>;
  tableDateFilter: Record<string, Set<string>>;
  setTableDateFilter: Dispatch<SetStateAction<Record<string, Set<string>>>>;
  tableOwnerFilter: Record<string, Set<string>>;
  setTableOwnerFilter: Dispatch<SetStateAction<Record<string, Set<string>>>>;
  tableStatusFilter: Record<string, Set<Issue["status"]>>;
  setTableStatusFilter: Dispatch<SetStateAction<Record<string, Set<Issue["status"]>>>>;
  tablePriorityFilter: Record<string, Set<Issue["priority"]>>;
  setTablePriorityFilter: Dispatch<SetStateAction<Record<string, Set<Issue["priority"]>>>>;
  tableDateSort: Record<string, "none" | "asc" | "desc">;
  setTableDateSort: Dispatch<SetStateAction<Record<string, "none" | "asc" | "desc">>>;
  tableOwnerSort: Record<string, "none" | "asc" | "desc">;
  setTableOwnerSort: Dispatch<SetStateAction<Record<string, "none" | "asc" | "desc">>>;
  tablePrioritySort: Record<string, "none" | "asc" | "desc">;
  setTablePrioritySort: Dispatch<SetStateAction<Record<string, "none" | "asc" | "desc">>>;
  issueActionsId: string | null;
  setIssueActionsId: Dispatch<SetStateAction<string | null>>;
  issueActionsRef: RefObject<HTMLDivElement>;
  setIssueCreateModal: Dispatch<SetStateAction<IssueCreateModalState>>;
  setIssueEditModal: Dispatch<SetStateAction<IssueEditModalState>>;
  setIssueDeleteModal: Dispatch<SetStateAction<Issue | null>>;
  setGroupDeleteModal: Dispatch<SetStateAction<IssueGroup | null>>;
  onRenameGroup: (group: IssueGroup) => void;
  onAddGroup: () => void;
  handleStatusChange: (issue: Issue, next: Issue["status"]) => void | Promise<void>;
  handleProgressCommit: (issue: Issue, next: number) => void | Promise<void>;
  handlePriorityChange: (issue: Issue, next: Issue["priority"]) => void | Promise<void>;
  setIssues: Dispatch<SetStateAction<Issue[]>>;
  handleToggleComments: (issue: Issue) => void | Promise<void>;
  commentThreads: Record<string, IssueComment[]>;
  setCommentThreads: Dispatch<SetStateAction<Record<string, IssueComment[]>>>;
  openCommentThreads: Record<string, boolean>;
  commentThreadDrafts: Record<string, string>;
  setCommentThreadDrafts: Dispatch<SetStateAction<Record<string, string>>>;
  commentSubmitting: Record<string, boolean>;
  setCommentSubmitting: Dispatch<SetStateAction<Record<string, boolean>>>;
  commentEditingId: string | null;
  setCommentEditingId: Dispatch<SetStateAction<string | null>>;
  commentEditingDraft: string;
  setCommentEditingDraft: Dispatch<SetStateAction<string>>;
  commentReactions: Record<string, Record<string, number>>;
  setCommentReactions: Dispatch<SetStateAction<Record<string, Record<string, number>>>>;
  profile: { id?: string | null; name?: string | null; displayName?: string | null; email?: string | null; avatarUrl?: string | null } | null;
  projectId?: string;
}) {
  return (
    <div className="space-y-6">
      {tableGroups.map((group) => {
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
                      onClick={() => groupEntity && onRenameGroup(groupEntity)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-sky-600 transition hover:bg-sky-400 hover:text-white"
                      aria-label="테이블 이름 수정"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => groupEntity && setGroupDeleteModal(groupEntity)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-rose-600 transition hover:bg-rose-400 hover:text-white"
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
                                [group.key]: prev[group.key] === "asc" ? "none" : "asc",
                              }))
                            }
                            className={[
                              "flex h-7 w-7 items-center justify-center rounded-md border",
                              tableDateSort[group.key] === "asc"
                                ? "border-brand text-brand"
                                : "border-border text-muted",
                            ].join(" ")}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setTableDateSort((prev) => ({
                                ...prev,
                                [group.key]: prev[group.key] === "desc" ? "none" : "desc",
                              }))
                            }
                            className={[
                              "flex h-7 w-7 items-center justify-center rounded-md border",
                              tableDateSort[group.key] === "desc"
                                ? "border-brand text-brand"
                                : "border-border text-muted",
                            ].join(" ")}
                          >
                            ↓
                          </button>
                        </div>
                        <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-border/50 bg-background/60 p-2">
                          {Array.from(new Set(filteredTableItems.map((issue) => formatIssueDateRange(issue.startAt, issue.endAt)))).map((label) => (
                            <label key={label} className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-subtle/60">
                              <input
                                type="checkbox"
                                className="h-3 w-3"
                                checked={tableDateFilter[group.key]?.has(label) ?? false}
                                onChange={(e) => {
                                  setTableDateFilter((prev) => {
                                    const next = new Set(prev[group.key] ?? []);
                                    if (e.target.checked) next.add(label);
                                    else next.delete(label);
                                    return { ...prev, [group.key]: next };
                                  });
                                }}
                              />
                              <span>{label}</span>
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
                                [group.key]: prev[group.key] === "asc" ? "none" : "asc",
                              }))
                            }
                            className={[
                              "flex h-7 w-7 items-center justify-center rounded-md border",
                              tableOwnerSort[group.key] === "asc"
                                ? "border-brand text-brand"
                                : "border-border text-muted",
                            ].join(" ")}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setTableOwnerSort((prev) => ({
                                ...prev,
                                [group.key]: prev[group.key] === "desc" ? "none" : "desc",
                              }))
                            }
                            className={[
                              "flex h-7 w-7 items-center justify-center rounded-md border",
                              tableOwnerSort[group.key] === "desc"
                                ? "border-brand text-brand"
                                : "border-border text-muted",
                            ].join(" ")}
                          >
                            ↓
                          </button>
                        </div>
                        <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-border/50 bg-background/60 p-2">
                          {Array.from(new Set(filteredTableItems.map((issue) => issue.assigneeId || issue.assignee || "unassigned"))).map((ownerId) => {
                            const member = memberMap[ownerId];
                            const name = member?.name || ownerId;
                            const avatar = member?.avatarUrl ?? null;
                            return (
                              <label key={ownerId} className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-subtle/60">
                                <input
                                  type="checkbox"
                                  className="h-3 w-3"
                                  checked={tableOwnerFilter[group.key]?.has(ownerId) ?? false}
                                  onChange={(e) => {
                                    setTableOwnerFilter((prev) => {
                                      const next = new Set(prev[group.key] ?? []);
                                      if (e.target.checked) next.add(ownerId);
                                      else next.delete(ownerId);
                                      return { ...prev, [group.key]: next };
                                    });
                                  }}
                                />
                                {avatar ? (
                                  <img src={avatar} alt={name} className="h-4 w-4 rounded-full object-cover" />
                                ) : (
                                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-subtle text-[8px] font-semibold text-muted">
                                    {name.slice(0, 1)}
                                  </div>
                                )}
                                <span>{name}</span>
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
                                [group.key]: prev[group.key] === "asc" ? "none" : "asc",
                              }))
                            }
                            className={[
                              "flex h-7 w-7 items-center justify-center rounded-md border",
                              tablePrioritySort[group.key] === "asc"
                                ? "border-brand text-brand"
                                : "border-border text-muted",
                            ].join(" ")}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setTablePrioritySort((prev) => ({
                                ...prev,
                                [group.key]: prev[group.key] === "desc" ? "none" : "desc",
                              }))
                            }
                            className={[
                              "flex h-7 w-7 items-center justify-center rounded-md border",
                              tablePrioritySort[group.key] === "desc"
                                ? "border-brand text-brand"
                                : "border-border text-muted",
                            ].join(" ")}
                          >
                            ↓
                          </button>
                        </div>
                        <div className="space-y-1 rounded-md border border-border/50 bg-background/60 p-2">
                          {(["very_low", "low", "medium", "high", "urgent"] as Issue["priority"][]).map((priority) => (
                            <label key={priority} className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-subtle/60">
                              <input
                                type="checkbox"
                                className="h-3 w-3"
                                checked={tablePriorityFilter[group.key]?.has(priority) ?? false}
                                onChange={(e) => {
                                  setTablePriorityFilter((prev) => {
                                    const next = new Set(prev[group.key] ?? []);
                                    if (e.target.checked) next.add(priority);
                                    else next.delete(priority);
                                    return { ...prev, [group.key]: next };
                                  });
                                }}
                              />
                              <span>{priority === "very_low" ? "매우 낮음" : priority === "low" ? "낮음" : priority === "medium" ? "중간" : priority === "high" ? "높음" : "매우 높음"}</span>
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
                      <IssueRow
                        issue={issue}
                        groupColor={group.color}
                        memberMap={memberMap}
                        columns={columns}
                        setIssueActionsId={setIssueActionsId}
                        setIssues={setIssues}
                        handleStatusChange={handleStatusChange}
                        handleProgressCommit={handleProgressCommit}
                        handlePriorityChange={handlePriorityChange}
                      />
                      {issue.subtasks?.length ? (
                        <SubtaskList
                          items={issue.subtasks}
                          groupColor={group.color}
                          memberMap={memberMap}
                          columns={columns}
                          setIssueActionsId={setIssueActionsId}
                          issueActionsId={issueActionsId}
                          issueActionsRef={issueActionsRef}
                          setIssueCreateModal={setIssueCreateModal}
                          setIssueEditModal={setIssueEditModal}
                          setIssueDeleteModal={setIssueDeleteModal}
                          handleToggleComments={handleToggleComments}
                          commentThreads={commentThreads}
                          setCommentThreads={setCommentThreads}
                          openCommentThreads={openCommentThreads}
                          commentThreadDrafts={commentThreadDrafts}
                          setCommentThreadDrafts={setCommentThreadDrafts}
                          commentSubmitting={commentSubmitting}
                          setCommentSubmitting={setCommentSubmitting}
                          commentEditingId={commentEditingId}
                          setCommentEditingId={setCommentEditingId}
                          commentEditingDraft={commentEditingDraft}
                          setCommentEditingDraft={setCommentEditingDraft}
                          commentReactions={commentReactions}
                          setCommentReactions={setCommentReactions}
                          profile={profile}
                          projectId={projectId}
                          setIssues={setIssues}
                          handleStatusChange={handleStatusChange}
                          handleProgressCommit={handleProgressCommit}
                          handlePriorityChange={handlePriorityChange}
                        />
                      ) : null}
                      <IssueActions
                        issue={issue}
                        issueActionsId={issueActionsId}
                        setIssueActionsId={setIssueActionsId}
                        issueActionsRef={issueActionsRef}
                        setIssueCreateModal={setIssueCreateModal}
                        setIssueEditModal={setIssueEditModal}
                        setIssueDeleteModal={setIssueDeleteModal}
                        handleToggleComments={handleToggleComments}
                        commentThreads={commentThreads}
                        setCommentThreads={setCommentThreads}
                        openCommentThreads={openCommentThreads}
                        commentThreadDrafts={commentThreadDrafts}
                        setCommentThreadDrafts={setCommentThreadDrafts}
                        commentSubmitting={commentSubmitting}
                        setCommentSubmitting={setCommentSubmitting}
                        commentEditingId={commentEditingId}
                        setCommentEditingId={setCommentEditingId}
                        commentEditingDraft={commentEditingDraft}
                        setCommentEditingDraft={setCommentEditingDraft}
                        commentReactions={commentReactions}
                        setCommentReactions={setCommentReactions}
                        profile={profile}
                        projectId={projectId}
                      />
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
        onClick={onAddGroup}
        className="flex items-center justify-center rounded-xl border border-dashed border-border/70 bg-panel/60 w-full py-3 text-sm text-muted transition hover:bg-subtle/60"
      >
        + 업무 테이블 추가
      </button>
    </div>
  );
}
