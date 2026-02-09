"use client";

import type React from "react";
import type { Issue, IssueComment } from "@/workspace/issues/_model/types";
import IssueRow from "@/workspace/issues/_components/views/table/IssueRow";
import IssueActions from "@/workspace/issues/_components/views/table/IssueActions";

export default function SubtaskList({
  items,
  depth = 1,
  groupColor,
  memberMap,
  columns,
  setIssueActionsId,
  issueActionsId,
  issueActionsRef,
  setIssueCreateModal,
  setIssueEditModal,
  setIssueDeleteModal,
  onOpenIssue,
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
  setIssues,
  handleStatusChange,
  handleProgressCommit,
  handlePriorityChange,
}: {
  items: Issue[];
  depth?: number;
  groupColor?: string | null;
  memberMap: Record<string, { name: string; avatarUrl?: string | null }>;
  columns: Array<{ key: Issue["status"]; label: string }>;
  setIssueActionsId: React.Dispatch<React.SetStateAction<string | null>>;
  issueActionsId: string | null;
  issueActionsRef: React.RefObject<HTMLDivElement>;
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
  onOpenIssue: (issueId: string) => void;
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
  setIssues: React.Dispatch<React.SetStateAction<Issue[]>>;
  handleStatusChange: (issue: Issue, next: Issue["status"]) => void | Promise<void>;
  handleProgressCommit: (issue: Issue, next: number) => void | Promise<void>;
  handlePriorityChange: (issue: Issue, next: Issue["priority"]) => void | Promise<void>;
}) {
  if (!items.length) return null;
  const colorBase = groupColor ?? "#94a3b8";
  const hexToRgba = (hex: string, alpha: number) => {
    const normalized = hex.replace("#", "");
    if (normalized.length !== 6) return `rgba(148,163,184,${alpha})`;
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  const borderTint = hexToRgba(colorBase, depth >= 2 ? 0.35 : 0.5);
  return (
    <div
      className="mt-1 space-y-1 border-l-2 pl-4 md:pl-5"
      style={{ borderLeftColor: borderTint }}
    >
      {items.map((sub, idx) => (
        <div key={`${sub.id ?? "sub"}-${depth}-${idx}`} className="rounded-md bg-panel/40 px-1 py-1">
          <IssueRow
            issue={sub}
            isSubtask
            depth={depth}
            groupColor={groupColor}
            memberMap={memberMap}
            columns={columns}
            setIssueActionsId={setIssueActionsId}
            setIssues={setIssues}
            handleStatusChange={handleStatusChange}
            handleProgressCommit={handleProgressCommit}
            handlePriorityChange={handlePriorityChange}
            onRowClick={() => setIssueActionsId((prev) => (prev === sub.id ? null : sub.id))}
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
          {sub.subtasks?.length ? (
            <div className="ml-2">
              <SubtaskList
                items={sub.subtasks}
                depth={depth + 1}
                groupColor={groupColor}
                memberMap={memberMap}
                columns={columns}
                setIssueActionsId={setIssueActionsId}
                issueActionsId={issueActionsId}
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
                setIssues={setIssues}
                handleStatusChange={handleStatusChange}
                handleProgressCommit={handleProgressCommit}
                handlePriorityChange={handlePriorityChange}
              />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
