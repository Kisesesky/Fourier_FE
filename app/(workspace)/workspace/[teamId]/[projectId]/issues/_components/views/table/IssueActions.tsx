"use client";

import { ExternalLink, MessageSquareMore, Pencil, SquarePlus, Trash2 } from "lucide-react";
import type React from "react";

import type { Issue, IssueComment } from "@/workspace/issues/_model/types";
import {
  addComment,
  deleteComment,
  updateComment,
} from "@/workspace/issues/_service/api";
import { formatCommentDateTime } from "@/workspace/issues/_components/utils/issueViewUtils";

export default function IssueActions({
  issue,
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
  issue: Issue;
  issueActionsId: string | null;
  setIssueActionsId: React.Dispatch<React.SetStateAction<string | null>>;
  issueActionsRef: React.RefObject<HTMLDivElement>;
  onOpenIssue?: (issueId: string) => void;
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
        <div className="flex items-center gap-1">
          {onOpenIssue && (
            <button
              type="button"
              onClick={() => onOpenIssue(issue.id)}
              className="rounded-md px-1 py-1 text-xs text-blue-400 hover:bg-subtle/60"
            >
              <ExternalLink size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setIssueCreateModal({
                groupKey: issue.group?.id ?? "ungrouped",
                title: "",
                status: issue.status,
                priority: issue.priority ?? "medium",
                startAt: "",
                endAt: "",
                parentId: issue.id,
                parentTitle: issue.title,
                parentStartAt: issue.startAt ?? undefined,
                parentEndAt: issue.endAt ?? undefined,
                isSubtask: true,
              });
              setIssueActionsId(null);
            }}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-blue-400 hover:bg-subtle/60"
          >
            <SquarePlus size={14} />
            이슈 추가
          </button>
          <button
            type="button"
            onClick={() => {
              void handleToggleComments(issue);
            }}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-blue-400 hover:bg-subtle/60"
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
            className="rounded-md px-2 py-1 text-xs text-sky-600 hover:bg-sky-400 hover:text-white"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={() => {
              setIssueDeleteModal(issue);
              setIssueActionsId(null);
            }}
            className="rounded-md px-2 py-1 text-xs text-rose-600 hover:bg-rose-400 hover:text-white"
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
}
