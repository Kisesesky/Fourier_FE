// app/(workspace)/workspace/[teamId]/[projectId]/docs/_components/DocCommentsPanel.tsx
'use client';

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { MoreHorizontal } from "lucide-react";

import type { OutlineItem } from "../_model/hooks/useDocOutline";
import { useDocEditor } from "./DocEditorContext";
import {
  createDocumentComment,
  deleteDocumentComment,
  listDocumentComments,
  updateDocumentComment,
  type DocumentCommentDto,
} from "../_service/api";
import { renderMarkdownToHtml } from "../_model/markdown";
import { useAuthProfile } from "@/hooks/useAuthProfile";

type ThreadComment = {
  id: string;
  message: string;
  createdAt: string;
  authorName: string;
  authorId: string | null;
  authorRole: string | null;
  avatarUrl?: string;
  mine: boolean;
};

function isInsideFencedCodeBlock(text: string, caret: number) {
  const prefix = text.slice(0, Math.max(0, caret));
  const fences = prefix.match(/```/g);
  return Boolean(fences && fences.length % 2 === 1);
}

export default function DocCommentsPanel({
  layout = "side",
  showOutline = true,
}: {
  layout?: "side" | "bottom";
  showOutline?: boolean;
}) {
  const { profile } = useAuthProfile();
  const { meta, outline } = useDocEditor();
  const [comments, setComments] = useState<ThreadComment[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    commentId: string;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const meId = profile?.id ?? "";

  useEffect(() => {
    if (!meta?.id) {
      setComments([]);
      return;
    }
    void loadComments(meta.id);
  }, [meta?.id]);

  useEffect(() => {
    if (!contextMenu) return;

    const handleOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setContextMenu(null);
    };

    window.addEventListener("mousedown", handleOutside);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [contextMenu]);

  const loadComments = async (documentId: string) => {
    setLoading(true);
    try {
      const rows = await listDocumentComments(documentId);
      const next = rows.map((row) => mapComment(row, meId));
      setComments(next);
      emitCommentsCount(documentId, next.length);
    } finally {
      setLoading(false);
    }
  };

  const createComment = async () => {
    if (!message.trim() || !meta) return;
    setSaving(true);
    try {
      const created = await createDocumentComment(meta.id, message.trim());
      setComments((prev) => {
        const next = [...prev, mapComment(created, meId)];
        emitCommentsCount(meta.id, next.length);
        return next;
      });
      setMessage("");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (comment: ThreadComment) => {
    setContextMenu(null);
    setEditingId(comment.id);
    setEditingValue(comment.message);
  };

  const submitEdit = async () => {
    if (!editingId || !editingValue.trim()) return;
    setSaving(true);
    try {
      const updated = await updateDocumentComment(editingId, editingValue.trim());
      setComments((prev) =>
        prev.map((item) =>
          item.id === editingId ? mapComment(updated, meId) : item,
        ),
      );
      setEditingId(null);
      setEditingValue("");
    } finally {
      setSaving(false);
    }
  };

  const removeComment = async (commentId: string) => {
    setContextMenu(null);
    if (!window.confirm("댓글을 삭제할까요?")) return;
    setSaving(true);
    try {
      await deleteDocumentComment(commentId);
      setComments((prev) => {
        const next = prev.filter((item) => item.id !== commentId);
        if (meta?.id) emitCommentsCount(meta.id, next.length);
        return next;
      });
    } finally {
      setSaving(false);
    }
  };

  if (!meta) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        문서를 선택해주세요.
      </div>
    );
  }

  return (
    <div
      className={
        layout === "side"
          ? "relative flex h-full flex-col border-l border-border bg-white dark:bg-slate-900"
          : "relative flex h-full min-h-0 flex-col bg-white dark:bg-slate-900"
      }
    >
      {showOutline && outline?.length > 0 && (
        <div className="border-b border-border/60 px-4 py-3">
          <OutlineList outline={outline} />
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col px-4 py-3">
        <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          댓글 {comments.length}개
        </h4>

        <div className="mt-2 flex-1 space-y-2 overflow-auto pr-1">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="group px-1 py-1"
              onMouseEnter={() => setHoverId(comment.id)}
              onMouseLeave={() => setHoverId((prev) => (prev === comment.id ? null : prev))}
              onContextMenu={(event) => {
                if (!comment.mine) return;
                event.preventDefault();
                setContextMenu({ x: event.clientX, y: event.clientY, commentId: comment.id });
              }}
            >
              <div className="flex gap-3">
                <Avatar name={comment.authorName} src={comment.avatarUrl} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="truncate font-semibold text-foreground">
                      {comment.authorName}
                    </span>
                    <span className="rounded-md bg-sky-100 px-1.5 py-0.5 text-[10px] text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                      {toRoleLabel(comment.authorRole)}
                    </span>
                    <time dateTime={comment.createdAt} className="text-muted-foreground">
                      {formatKoreanDateTime(comment.createdAt)}
                    </time>
                    {comment.mine && hoverId === comment.id && (
                      <button
                        type="button"
                        onClick={(event) => {
                          const rect = event.currentTarget.getBoundingClientRect();
                          setContextMenu({ x: rect.left, y: rect.bottom + 4, commentId: comment.id });
                        }}
                        className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-slate-800"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {editingId === comment.id ? (
                    <div className="mt-1 space-y-2">
                      <textarea
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onKeyDown={(event) => {
                          if ((event.nativeEvent as KeyboardEvent).isComposing) return;
                          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                            event.preventDefault();
                            void submitEdit();
                            return;
                          }
                          if (event.key === "Enter" && !event.shiftKey) {
                            const textarea = event.currentTarget;
                            const caret = textarea.selectionStart ?? textarea.value.length;
                            if (isInsideFencedCodeBlock(textarea.value, caret)) return;
                            event.preventDefault();
                            void submitEdit();
                          }
                        }}
                        className="w-full resize-y rounded-md bg-muted/40 px-2 py-1.5 text-sm focus:outline-none dark:bg-slate-800 dark:text-slate-100"
                        rows={3}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditingValue("");
                          }}
                          className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                        >
                          취소
                        </button>
                        <button
                          type="button"
                          disabled={saving || !editingValue.trim()}
                          onClick={submitEdit}
                          className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground disabled:opacity-60"
                        >
                          저장
                        </button>
                      </div>
                    </div>
                  ) : (
                    <article
                      className="prose prose-sm mt-1 max-w-none text-slate-900 prose-pre:rounded-lg prose-pre:border prose-pre:border-slate-300 prose-pre:bg-slate-100 prose-pre:text-slate-900 prose-code:rounded prose-code:bg-transparent prose-code:px-1 prose-code:py-0.5 prose-code:text-slate-900 prose-code:before:content-none prose-code:after:content-none dark:text-slate-100 dark:prose-invert dark:prose-pre:border-slate-700 dark:prose-pre:bg-slate-800 dark:prose-pre:text-slate-100 dark:prose-code:bg-transparent dark:prose-code:text-slate-100"
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdownToHtml(comment.message || ""),
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}

          {!loading && comments.length === 0 && (
            <p className="text-xs text-muted-foreground">아직 댓글이 없습니다.</p>
          )}
        </div>

        <div className="mt-1 flex h-24 flex-col gap-2 border border-border bg-white pt-1 dark:bg-slate-900">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(event) => {
              if ((event.nativeEvent as KeyboardEvent).isComposing) return;
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                void createComment();
                return;
              }
              if (event.key === "Enter" && !event.shiftKey) {
                const textarea = event.currentTarget;
                const caret = textarea.selectionStart ?? textarea.value.length;
                if (isInsideFencedCodeBlock(textarea.value, caret)) return;
                event.preventDefault();
                void createComment();
              }
            }}
            placeholder="댓글을 작성하세요..."
            className="h-full resize-none rounded-md bg-muted/40 px-3 py-2 text-sm focus:outline-none dark:bg-slate-800 dark:text-slate-100"
          />
          <div className="flex justify-end">
            <button
              type="button"
              disabled={saving || !message.trim()}
              onClick={createComment}
              className="rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground disabled:opacity-60"
            >
              등록
            </button>
          </div>
        </div>
      </div>

      {contextMenu && (
        <div
          ref={menuRef}
          className="fixed z-[120] w-32 rounded-md border border-border bg-white p-1 shadow-lg dark:bg-slate-900"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            type="button"
            className="w-full rounded px-2 py-1 text-left text-xs hover:bg-muted dark:hover:bg-slate-800"
            onClick={() => {
              const target = comments.find((item) => item.id === contextMenu.commentId);
              if (target) startEdit(target);
            }}
          >
            편집
          </button>
          <button
            type="button"
            className="w-full rounded px-2 py-1 text-left text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
            onClick={() => {
              void removeComment(contextMenu.commentId);
            }}
          >
            삭제
          </button>
        </div>
      )}
    </div>
  );
}

function OutlineList({ outline }: { outline: OutlineItem[] }) {
  return (
    <div className="text-sm">
      <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        아웃라인
      </h4>
      <div className="mt-3 space-y-1">
        {outline.map((item) => (
          <button
            key={item.id}
            className="flex w-full items-center rounded-md px-2 py-1 text-left text-sm text-muted-foreground transition hover:bg-accent hover:text-sidebar-primary"
            style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
            onClick={() => {
              const target = document.querySelector(`#${item.id}`);
              if (target) {
                target.scrollIntoView({ behavior: "smooth" });
              }
            }}
          >
            {item.text || "제목 없음"}
          </button>
        ))}
      </div>
    </div>
  );
}

function Avatar({ name, src }: { name: string; src?: string }) {
  if (src) {
    return (
      <div className="relative h-9 w-9 overflow-hidden rounded-full">
        <Image src={src} alt={name} fill sizes="36px" />
      </div>
    );
  }

  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700">
      {name?.slice(0, 1) ?? "?"}
    </div>
  );
}

function mapComment(row: DocumentCommentDto, meId?: string): ThreadComment {
  const mine = typeof row.mine === "boolean" ? row.mine : Boolean(meId && row.authorId === meId);
  return {
    id: row.id,
    message: row.content ?? "",
    createdAt: row.createdAt,
    authorId: row.authorId ?? null,
    authorName: row.authorName || "익명",
    authorRole: row.authorRole ?? null,
    avatarUrl: row.authorAvatarUrl ?? undefined,
    mine,
  };
}

function toRoleLabel(role?: string | null) {
  if (!role) return "멤버";
  if (role === "OWNER") return "소유자";
  if (role === "MANAGER") return "관리자";
  if (role === "GUEST") return "게스트";
  return "멤버";
}

function formatKoreanDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hours24 = date.getHours();
  const period = hours24 >= 12 ? "오후" : "오전";
  const hours12 = hours24 % 12 || 12;
  const hh = String(hours12).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd} ${period} ${hh}:${min}`;
}

function emitCommentsCount(docId: string, count: number) {
  window.dispatchEvent(
    new CustomEvent("docs:comments:changed", {
      detail: { docId, count },
    }),
  );
}
