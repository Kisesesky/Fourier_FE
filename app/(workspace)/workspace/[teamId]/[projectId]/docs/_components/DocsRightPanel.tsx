"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

import type { OutlineItem } from "../_model/hooks/useDocOutline";
import { useDocEditor } from "./DocEditorContext";
import { DOC_COMMENTS, type DocCommentMock } from "@/workspace/docs/lib/mocks/mocks";
import {
  defaultMembers,
  createMemberMap,
} from "@/workspace/members/_model/mocks";

type ThreadComment = {
  id: string;
  message: string;
  createdAt: string;
  authorName: string;
  avatarUrl?: string;
  role?: string;
};

export default function DocsRightPanel() {
  const { meta, outline } = useDocEditor();
  const memberMap = useMemo(() => createMemberMap(defaultMembers), []);
  const currentUser = memberMap["mem-you"] ?? defaultMembers[0];
  const [comments, setComments] = useState<ThreadComment[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!meta) return;
    const initial = DOC_COMMENTS.filter((comment) => comment.docId === meta.id).map(
      (comment) => hydrateComment(comment, memberMap)
    );
    setComments(initial);
  }, [meta, memberMap]);

  if (!meta) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        문서를 선택해주세요.
      </div>
    );
  }

  const createComment = () => {
    if (!message.trim() || !meta) return;
    const raw: DocCommentMock = {
      id: crypto.randomUUID(),
      docId: meta.id,
      authorId: currentUser?.id ?? "mem-you",
      message: message.trim(),
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => [hydrateComment(raw, memberMap), ...prev]);
    setMessage("");
  };

  return (
    <div className="flex h-full flex-col border-l border-border bg-white">
      {outline?.length > 0 && (
        <div className="border-b border-border/60 p-4">
          <OutlineList outline={outline} />
        </div>
      )}

      <div className="flex flex-1 flex-col p-4">
        <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          댓글 스레드
        </h4>
        <div className="mt-3 flex h-28 flex-col gap-2 rounded-xl border border-border bg-gray-50/80 px-3 py-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="메모를 작성하세요..."
            className="h-full resize-none bg-transparent text-sm focus:outline-none"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={createComment}
              className="rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground"
            >
              등록
            </button>
          </div>
        </div>

        <div className="mt-4 flex-1 space-y-4 overflow-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar name={comment.authorName} src={comment.avatarUrl} />
              <div className="flex-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-foreground">
                    {comment.authorName}
                  </span>
                  {comment.role && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-muted-foreground">
                      {comment.role}
                    </span>
                  )}
                  <time
                    dateTime={comment.createdAt}
                    className="text-muted-foreground"
                  >
                    {new Date(comment.createdAt).toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
                <div className="mt-1 rounded-2xl bg-gray-50 px-3 py-2 text-sm text-foreground shadow-sm">
                  {comment.message}
                </div>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-xs text-muted-foreground">
              아직 댓글이 없습니다.
            </p>
          )}
        </div>
      </div>
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
      <div className="relative h-10 w-10 overflow-hidden rounded-full border border-border/60">
        <Image src={src} alt={name} fill sizes="40px" />
      </div>
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700">
      {name?.slice(0, 1) ?? "?"}
    </div>
  );
}

function hydrateComment(
  comment: DocCommentMock,
  memberMap: ReturnType<typeof createMemberMap>
): ThreadComment {
  const author = memberMap[comment.authorId];
  return {
    id: comment.id,
    message: comment.message,
    createdAt: comment.createdAt,
    authorName: author?.name ?? "익명",
    avatarUrl: author?.avatarUrl ?? undefined,
    role: author?.title,
  };
}
