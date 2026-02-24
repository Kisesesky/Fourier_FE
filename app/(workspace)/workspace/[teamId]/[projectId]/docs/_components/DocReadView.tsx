// app/(workspace)/workspace/[teamId]/[projectId]/docs/_components/DocReadView.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { Edit3, Star, Trash2 } from "lucide-react";

import { useDocEditor } from "./DocEditorContext";
import {
  countMarkdownWords,
  createMarkdownOutline,
  docToMarkdown,
  renderMarkdownToHtml,
} from "../_model/markdown";

export default function DocReadView({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => Promise<void>;
}) {
  const { meta, content, setOutline, setWordCount, updateMeta } = useDocEditor();
  const [isDeleting, setIsDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [overflowed, setOverflowed] = useState(false);
  const contentBoxRef = useRef<HTMLDivElement | null>(null);

  const markdown = useMemo(() => docToMarkdown(content), [content]);
  const html = useMemo(() => renderMarkdownToHtml(markdown), [markdown]);

  useEffect(() => {
    setOutline(createMarkdownOutline(markdown));
    setWordCount(countMarkdownWords(markdown));
  }, [markdown, setOutline, setWordCount]);

  useEffect(() => {
    const element = contentBoxRef.current;
    if (!element) return;
    const checkOverflow = () => {
      setOverflowed(element.scrollHeight > 480);
    };
    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [html]);

  useEffect(() => {
    setExpanded(false);
  }, [meta?.id]);

  const updatedLabel = useMemo(() => {
    const target = meta?.updatedAt;
    if (!target) return "날짜 정보 없음";
    const parsed = new Date(target);
    if (Number.isNaN(parsed.getTime())) return "날짜 정보 없음";
    return format(parsed, "yyyy.MM.dd HH:mm");
  }, [meta?.updatedAt]);

  if (!meta) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed bg-white text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
        선택된 문서를 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white dark:bg-slate-950">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-lg font-semibold text-foreground">{meta.title}</h1>
            <button
              type="button"
              onClick={() => updateMeta({ starred: !meta.starred })}
              className="rounded-md p-1 text-amber-500 hover:bg-amber-50"
              title="즐겨찾기"
            >
              <Star className="h-4 w-4" fill={meta.starred ? "currentColor" : "none"} />
            </button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">최근 수정: {updatedLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-foreground transition hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            <Edit3 className="h-4 w-4" />
            수정
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={async () => {
              if (!window.confirm("이 문서를 삭제할까요?")) return;
              setIsDeleting(true);
              try {
                await onDelete();
              } finally {
                setIsDeleting(false);
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
            삭제
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 pb-10 sm:px-6 sm:py-8 sm:pb-12 lg:px-10 dark:bg-slate-950">
        <div className="mx-auto w-full max-w-5xl">
          <div
            ref={contentBoxRef}
            className={!expanded ? "max-h-[480px] overflow-hidden" : ""}
          >
            <article
              className="prose prose-sm max-w-none overflow-x-auto break-words text-slate-900 prose-headings:break-words prose-p:break-words prose-li:break-words prose-img:max-w-full prose-pre:overflow-x-auto prose-pre:rounded-lg prose-pre:border prose-pre:border-slate-300 prose-pre:bg-slate-100 prose-pre:text-slate-900 prose-code:rounded prose-code:bg-transparent prose-code:px-1 prose-code:py-0.5 prose-code:text-slate-900 prose-code:before:content-none prose-code:after:content-none prose-table:block prose-table:w-full prose-table:overflow-x-auto dark:text-slate-100 dark:prose-invert dark:prose-pre:border-slate-700 dark:prose-pre:bg-slate-800 dark:prose-pre:text-slate-100 dark:prose-code:bg-transparent dark:prose-code:text-slate-100"
              dangerouslySetInnerHTML={{ __html: html || "<p>내용 없음</p>" }}
            />
          </div>
          {overflowed && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="text-sm font-medium text-primary hover:underline"
              >
                {expanded ? "...접기" : "...더보기"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
