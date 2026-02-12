// app/(workspace)/workspace/[teamId]/[projectId]/issues/_components/views/IssuesKanbanView.tsx
'use client';

import { CornerDownRight, Sparkles, BadgeCheck, Flame, Eye, CircleDot, LayoutGrid } from "lucide-react";
import { useMemo, useState } from "react";
import type React from "react";
import type { Issue, IssueComment } from "@/workspace/issues/_model/types";
import IssueActions from "@/workspace/issues/_components/views/table/IssueActions";

export default function IssuesKanbanView({
  columns,
  grouped,
  memberMap,
  onCreateIssue,
  issueActionsId,
  setIssueActionsId,
  issueActionsRef,
  onOpenIssue,
  setIssueCreateModal,
  setIssueEditModal,
  setIssueDeleteModal,
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
  columns: Array<{ key: Issue["status"]; label: string }>;
  grouped: Map<Issue["status"], Issue[]>;
  memberMap: Record<string, { name: string; avatarUrl?: string | null }>;
  onCreateIssue: (status: Issue["status"]) => void;
  issueActionsId: string | null;
  setIssueActionsId: React.Dispatch<React.SetStateAction<string | null>>;
  issueActionsRef: React.RefObject<HTMLDivElement>;
  onOpenIssue: (issueId: string) => void;
  setIssueCreateModal: React.Dispatch<React.SetStateAction<{
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
  } | null>>;
  setIssueEditModal: React.Dispatch<React.SetStateAction<{
    issue: Issue;
    title: string;
    status: Issue["status"];
    priority: Issue["priority"];
    startAt: string;
    endAt: string;
  } | null>>;
  setIssueDeleteModal: React.Dispatch<React.SetStateAction<Issue | null>>;
  handleToggleComments: (issue: Issue) => void | Promise<void>;
  commentThreads: Record<string, IssueComment[]>;
  setCommentThreads: React.Dispatch<React.SetStateAction<Record<string, IssueComment[]>>>;
  openCommentThreads: Record<string, boolean>;
  commentThreadDrafts: Record<string, string>;
  setCommentThreadDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  commentSubmitting: Record<string, boolean>;
  setCommentSubmitting: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  commentEditingId: string | null;
  setCommentEditingId: React.Dispatch<React.SetStateAction<string | null>>;
  commentEditingDraft: string;
  setCommentEditingDraft: React.Dispatch<React.SetStateAction<string>>;
  commentReactions: Record<string, Record<string, number>>;
  setCommentReactions: React.Dispatch<React.SetStateAction<Record<string, Record<string, number>>>>;
  profile: { id?: string | null; name?: string | null; displayName?: string | null; email?: string | null; avatarUrl?: string | null } | null;
  projectId?: string;
}) {
  const [activeStatus, setActiveStatus] = useState<"all" | Issue["status"]>("all");

  const visibleColumns = useMemo(
    () => (activeStatus === "all" ? columns : columns.filter((col) => col.key === activeStatus)),
    [activeStatus, columns],
  );

  const getColumnTone = (key: Issue["status"]) => {
    switch (key) {
      case "done":
        return {
          badge: "bg-emerald-500/15 text-emerald-600",
          card: "bg-emerald-500/8",
          accent: "text-emerald-600",
          icon: BadgeCheck,
        };
      case "in_progress":
        return {
          badge: "bg-amber-500/15 text-amber-600",
          card: "bg-amber-500/8",
          accent: "text-amber-600",
          icon: Sparkles,
        };
      case "review":
        return {
          badge: "bg-violet-500/15 text-violet-600",
          card: "bg-violet-500/8",
          accent: "text-violet-600",
          icon: Eye,
        };
      case "backlog":
        return {
          badge: "bg-slate-500/15 text-slate-600",
          card: "bg-slate-500/8",
          accent: "text-slate-600",
          icon: CircleDot,
        };
      default:
        return {
          badge: "bg-rose-500/15 text-rose-600",
          card: "bg-rose-500/8",
          accent: "text-rose-600",
          icon: Flame,
        };
    }
  };

  const getFilterIcon = (key: "all" | Issue["status"]) => {
    if (key === "all") return LayoutGrid;
    return getColumnTone(key).icon;
  };

  const getFilterIconClass = (key: "all" | Issue["status"]) => {
    if (key === "all") return "text-muted";
    return getColumnTone(key).accent;
  };

  const statusMeta = (status: Issue["status"]) => {
    switch (status) {
      case "in_progress":
        return { label: "작업 중", className: "bg-amber-500/15 text-amber-700", icon: Sparkles };
      case "review":
        return { label: "리뷰 대기", className: "bg-violet-500/15 text-violet-700", icon: Eye };
      case "done":
        return { label: "완료", className: "bg-emerald-500/15 text-emerald-700", icon: BadgeCheck };
      case "backlog":
        return { label: "백로그", className: "bg-slate-500/15 text-slate-600", icon: CircleDot };
      default:
        return { label: "할 일", className: "bg-rose-500/15 text-rose-700", icon: Flame };
    }
  };

  const statusIconClass = (status: Issue["status"]) => {
    switch (status) {
      case "in_progress":
        return "text-amber-600";
      case "review":
        return "text-violet-600";
      case "done":
        return "text-emerald-600";
      case "backlog":
        return "text-slate-600";
      default:
        return "text-rose-600";
    }
  };

  const SubtaskRow = ({
    issue,
    depth = 1,
    memberMap,
    onClick,
  }: {
    issue: Issue;
    depth?: number;
    memberMap: Record<string, { name: string; avatarUrl?: string | null }>;
    onClick: () => void;
  }) => {
    const deeper = Math.min(depth, 3);
    const textSize = deeper >= 2 ? "text-[11px]" : "text-xs";
    const rowOpacity = deeper >= 2 ? "opacity-80" : "opacity-90";
    const meta = statusMeta(issue.status);
    const StatusIcon = meta.icon;
    const member =
      (issue.assigneeId && memberMap[issue.assigneeId]) ||
      Object.values(memberMap).find((m) => m.name === issue.assignee);
    const avatar = member?.avatarUrl ?? null;
    const name = member?.name || issue.assignee || "U";
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center gap-2 rounded-lg border border-border/60 bg-background/70 px-2 py-1 text-left ${textSize} ${rowOpacity}`}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <CornerDownRight size={12} className="text-muted" />
            <StatusIcon size={12} className={statusIconClass(issue.status)} />
            <span className="truncate text-foreground/90">{issue.title || "제목 없음"}</span>
          </div>
          <div className="flex flex-wrap items-center gap-1 pl-5">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityBadge(issue.priority)}`}>
              {issue.priority === "urgent"
                ? "매우 높음"
                : issue.priority === "high"
                  ? "높음"
                  : issue.priority === "low"
                    ? "낮음"
                    : issue.priority === "very_low"
                      ? "매우 낮음"
                      : "중간"}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.className}`}>
              <StatusIcon size={11} />
              {meta.label}
            </span>
            {issue.startAt && (
              <span className="hidden sm:inline-flex items-center rounded-full bg-subtle px-2 py-0.5 text-[10px] text-muted">
                {String(issue.startAt).slice(5, 10)}
              </span>
            )}
          </div>
        </div>
        <div className="ml-2 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-subtle sm:flex">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <span className="text-[9px] font-semibold text-muted">
              {name.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
      </button>
    );
  };

  const renderSubtasks = (issue: Issue, depth = 1) => {
    if (!issue.subtasks?.length) return null;
    return (
      <div className="mt-2 space-y-1 pl-3">
        {issue.subtasks.map((sub) => (
          <div key={sub.id}>
            <SubtaskRow
              issue={sub}
              depth={depth}
              memberMap={memberMap}
              onClick={() => setIssueActionsId(sub.id)}
            />
            <IssueActions
              issue={sub}
              issueActionsId={issueActionsId}
              setIssueActionsId={setIssueActionsId}
              issueActionsRef={issueActionsRef}
              onOpenIssue={onOpenIssue}
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
            {renderSubtasks(sub, depth + 1)}
          </div>
        ))}
      </div>
    );
  };

  const priorityBadge = (priority: Issue["priority"]) => {
    switch (priority) {
      case "urgent":
        return "bg-rose-500/15 text-rose-600";
      case "high":
        return "bg-orange-500/15 text-orange-600";
      case "low":
        return "bg-sky-500/15 text-sky-600";
      case "very_low":
        return "bg-slate-500/15 text-slate-600";
      default:
        return "bg-amber-500/15 text-amber-700";
    }
  };

  const statusBadge = (status: Issue["status"]) => {
    switch (status) {
      case "in_progress":
        return "bg-amber-500/15 text-amber-700";
      case "review":
        return "bg-violet-500/15 text-violet-700";
      case "done":
        return "bg-emerald-500/15 text-emerald-700";
      case "backlog":
        return "bg-slate-500/15 text-slate-600";
      default:
        return "bg-rose-500/15 text-rose-700";
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        <button
          type="button"
          onClick={() => setActiveStatus("all")}
          className={[
            "shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold transition sm:px-3 sm:py-1.5 sm:text-xs",
            activeStatus === "all"
              ? "border-brand bg-brand/10 text-brand"
              : "border-border bg-panel/70 text-muted hover:bg-subtle/70",
          ].join(" ")}
        >
          <span className="inline-flex items-center gap-1.5">
            {(() => {
              const Icon = getFilterIcon("all");
              return <Icon size={13} className={getFilterIconClass("all")} />;
            })()}
            전체
          </span>
        </button>
        {columns.map((col) => {
          const count = (grouped.get(col.key) ?? []).filter((issue) => !issue.parentId).length;
          return (
            <button
              key={`kanban-filter-${col.key}`}
              type="button"
              onClick={() => setActiveStatus(col.key)}
              className={[
                "shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold transition sm:px-3 sm:py-1.5 sm:text-xs",
                activeStatus === col.key
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-border bg-panel/70 text-muted hover:bg-subtle/70",
              ].join(" ")}
            >
              <span className="inline-flex items-center gap-1.5">
                {(() => {
                  const Icon = getFilterIcon(col.key);
                  return <Icon size={13} className={getFilterIconClass(col.key)} />;
                })()}
                {col.label} {count}
              </span>
            </button>
          );
        })}
      </div>
      <div
        className={[
          "grid min-h-0 flex-1 items-start gap-5 overflow-hidden",
          activeStatus === "all" ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-4" : "grid-cols-1",
        ].join(" ")}
      >
      {visibleColumns.map((col) => {
        const items = (grouped.get(col.key) ?? []).filter((issue) => !issue.parentId);
        const tone = getColumnTone(col.key);
        const ColumnIcon = tone.icon;
        return (
          <div
            key={col.key}
            className={[
              "flex min-w-0 self-start flex-col rounded-2xl border border-border p-3 shadow-sm backdrop-blur overflow-hidden",
              tone.card,
            ].join(" ")}
            style={{ maxHeight: "min(760px, calc(100vh - 240px))" }}
          >
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <span className={`flex h-8 w-8 items-center justify-center rounded-xl bg-background/70 ${tone.accent}`}>
                  <ColumnIcon size={16} />
                </span>
                <div>
                  <div className="text-sm font-semibold text-foreground">{col.label}</div>
                  <div className="text-[11px] text-muted">총 {items.length}개</div>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone.badge}`}>
                {items.length}
              </span>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
              {items.length === 0 && (
                <div className="rounded-xl border border-dashed border-border/60 bg-background/70 p-4 text-xs text-muted">
                  아직 이 컬럼에 이슈가 없습니다.
                </div>
              )}
              {items.map((issue) => (
                <div key={issue.id} className="rounded-2xl border border-border bg-white/90 p-3 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setIssueActionsId(issue.id)}
                    className="group w-full text-left transition hover:border-brand/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                            style={{ backgroundColor: issue.group?.color ?? "#94a3b8" }}
                          >
                            {issue.group?.name ?? "미분류"}
                          </span>
                          <ColumnIcon size={14} className={tone.accent} />
                          <span className="line-clamp-2">{issue.title || "제목 없음"}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
                          <span className={`rounded-full px-2 py-0.5 ${priorityBadge(issue.priority)}`}>
                            {issue.priority === "urgent"
                              ? "매우 높음"
                              : issue.priority === "high"
                                ? "높음"
                                : issue.priority === "low"
                                  ? "낮음"
                                  : issue.priority === "very_low"
                                    ? "매우 낮음"
                                    : "중간"}
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${statusBadge(issue.status)}`}>
                            {(() => {
                              const meta = statusMeta(issue.status);
                              const StatusIcon = meta.icon;
                              return <StatusIcon size={11} />;
                            })()}
                            {issue.status === "in_progress"
                              ? "작업 중"
                              : issue.status === "review"
                                ? "리뷰 대기"
                                : issue.status === "done"
                                  ? "완료"
                                  : issue.status === "backlog"
                                    ? "백로그"
                                    : "할 일"}
                          </span>
                          {issue.startAt && (
                            <span className="rounded-full bg-subtle px-2 py-0.5">
                              {String(issue.startAt).slice(5, 10)}
                            </span>
                          )}
                        </div>
                        {renderSubtasks(issue)}
                      </div>
                      {(() => {
                        const member =
                          (issue.assigneeId && memberMap[issue.assigneeId]) ||
                          Object.values(memberMap).find((m) => m.name === issue.assignee);
                        const avatar = member?.avatarUrl ?? null;
                        const name = member?.name || issue.assignee || "U";
                        return avatar ? (
                          <img
                            src={avatar}
                            alt={name}
                            className="h-9 w-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-subtle text-xs font-semibold text-muted">
                            {name.slice(0, 1).toUpperCase()}
                          </div>
                        );
                      })()}
                    </div>
                  </button>
                  <IssueActions
                    issue={issue}
                    issueActionsId={issueActionsId}
                    setIssueActionsId={setIssueActionsId}
                    issueActionsRef={issueActionsRef}
                    onOpenIssue={onOpenIssue}
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
              ))}
              <button
                type="button"
                onClick={() => onCreateIssue(col.key)}
                className="rounded-xl border border-dashed border-border/60 bg-background/70 px-3 py-2 text-left text-xs text-muted hover:bg-subtle/60"
              >
                + 이슈 추가
              </button>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
