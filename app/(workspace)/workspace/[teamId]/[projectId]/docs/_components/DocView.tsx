// app/(workspace)/workspace/[teamId]/[projectId]/docs/_components/DocView.tsx
'use client';

import * as Dialog from "@radix-ui/react-dialog";
import { format } from "date-fns";
import {
  Bold,
  Code2,
  Eye,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  MessageSquareQuote,
  Minus,
  Star,
  Strikethrough,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useDocEditor } from "./DocEditorContext";
import { cn } from "@/lib/utils";
import {
  countMarkdownWords,
  createMarkdownOutline,
  docToMarkdown,
  markdownToDoc,
  renderMarkdownToHtml,
} from "../_model/markdown";

export default function DocView() {
  const {
    meta,
    content,
    updateContent,
    setOutline,
    setWordCount,
    status,
    lastSavedAt,
    wordCount,
    updateMeta,
  } = useDocEditor();

  const [markdown, setMarkdown] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const next = docToMarkdown(content);
    setMarkdown(next);
    setOutline(createMarkdownOutline(next));
    setWordCount(countMarkdownWords(next));
  }, [content, setOutline, setWordCount]);

  const formattedDate = useMemo(() => {
    const target = lastSavedAt ?? meta?.updatedAt;
    if (!target) return "날짜 정보 없음";
    const parsed = new Date(target);
    if (Number.isNaN(parsed.getTime())) return "날짜 정보 없음";
    return format(parsed, "EEEE, MMMM d, yyyy");
  }, [lastSavedAt, meta?.updatedAt]);

  const previewHtml = useMemo(() => renderMarkdownToHtml(markdown), [markdown]);

  const applyMarkdown = (next: string) => {
    setMarkdown(next);
    setOutline(createMarkdownOutline(next));
    setWordCount(countMarkdownWords(next));
    updateContent(markdownToDoc(next));
  };

  const applyAtSelection = (
    transformer: (selected: string) => { text: string; selectOffsetStart?: number; selectOffsetEnd?: number },
  ) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = markdown.slice(0, start);
    const selected = markdown.slice(start, end);
    const after = markdown.slice(end);
    const transformed = transformer(selected);
    const next = `${before}${transformed.text}${after}`;
    applyMarkdown(next);
    const nextStart = before.length + (transformed.selectOffsetStart ?? transformed.text.length);
    const nextEnd = before.length + (transformed.selectOffsetEnd ?? transformed.text.length);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextStart, nextEnd);
    });
  };

  const applyLinePrefix = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const full = markdown;
    const lineStart = full.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = full.indexOf("\n", end);
    const scopedEnd = lineEnd === -1 ? full.length : lineEnd;
    const block = full.slice(lineStart, scopedEnd);
    const replaced = block
      .split("\n")
      .map((line) => (line.trim().length ? `${prefix}${line}` : line))
      .join("\n");
    const next = `${full.slice(0, lineStart)}${replaced}${full.slice(scopedEnd)}`;
    applyMarkdown(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart, lineStart + replaced.length);
    });
  };

  const insertLink = () => {
    const href = window.prompt("링크 주소를 입력하세요", "https://");
    if (!href) return;
    applyAtSelection((selected) => {
      const text = selected.trim() || "링크 텍스트";
      return {
        text: `[${text}](${href})`,
        selectOffsetStart: 1,
        selectOffsetEnd: 1 + text.length,
      };
    });
  };

  const onPickImage = () => imageInputRef.current?.click();

  const onImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === "string" ? reader.result : "";
      if (!src) return;
      applyAtSelection(() => ({
        text: `\n![image](${src})\n`,
      }));
    };
    reader.readAsDataURL(file);
    event.currentTarget.value = "";
  };

  if (!meta) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed bg-white text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
        선택된 문서를 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white dark:bg-slate-950">
      <div className="flex flex-1 flex-col overflow-hidden border-b border-border/70 bg-white dark:bg-slate-950">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-sm font-semibold text-foreground">
              {meta.title}
            </h2>
            <button
              type="button"
              onClick={() => updateMeta({ starred: !meta.starred })}
              className="rounded-md p-1 text-amber-500 hover:bg-amber-50"
              title="즐겨찾기"
            >
              <Star className="h-4 w-4" fill={meta.starred ? "currentColor" : "none"} />
            </button>
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border bg-white text-slate-700 hover:bg-slate-50 hover:text-foreground dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              title="미리보기"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1 border-b border-border/60 bg-[#fbfcff] px-6 py-2 dark:bg-slate-900/70">
          <ToolbarButton icon={Heading1} label="H1" onClick={() => applyLinePrefix("# ")} />
          <ToolbarButton icon={Heading2} label="H2" onClick={() => applyLinePrefix("## ")} />
          <ToolbarButton icon={Bold} label="굵게" onClick={() => applyAtSelection((s) => ({ text: `**${s || "텍스트"}**`, selectOffsetStart: 2, selectOffsetEnd: 2 + (s || "텍스트").length }))} />
          <ToolbarButton icon={Italic} label="기울임" onClick={() => applyAtSelection((s) => ({ text: `*${s || "텍스트"}*`, selectOffsetStart: 1, selectOffsetEnd: 1 + (s || "텍스트").length }))} />
          <ToolbarButton icon={Strikethrough} label="취소선" onClick={() => applyAtSelection((s) => ({ text: `~~${s || "텍스트"}~~`, selectOffsetStart: 2, selectOffsetEnd: 2 + (s || "텍스트").length }))} />
          <ToolbarButton icon={Code2} label="코드" onClick={() => applyAtSelection((s) => ({ text: s.includes("\n") ? `\`\`\`ts\n${s || "const value = 1;"}\n\`\`\`` : `\`${s || "code"}\`` }))} />
          <ToolbarButton icon={Link2} label="링크" onClick={insertLink} />
          <ToolbarButton icon={ImageIcon} label="이미지" onClick={onPickImage} />
          <ToolbarButton icon={MessageSquareQuote} label="인용" onClick={() => applyLinePrefix("> ")} />
          <ToolbarButton icon={List} label="리스트" onClick={() => applyLinePrefix("- ")} />
          <ToolbarButton icon={ListOrdered} label="번호" onClick={() => applyLinePrefix("1. ")} />
          <ToolbarButton icon={Minus} label="구분선" onClick={() => applyAtSelection(() => ({ text: "\n---\n" }))} />
        </div>

        <div className="flex-1 min-h-0 bg-white dark:bg-slate-950">
            <textarea
              ref={textareaRef}
              value={markdown}
              onChange={(event) => {
                applyMarkdown(event.currentTarget.value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Tab") {
                  event.preventDefault();
                  const textarea = event.currentTarget;
                  const start = textarea.selectionStart;
                  const end = textarea.selectionEnd;
                  const before = markdown.slice(0, start);
                  const selected = markdown.slice(start, end);
                  const after = markdown.slice(end);
                  const indent = "  ";
                  if (selected.includes("\n")) {
                    const value = selected
                      .split("\n")
                      .map((line) => (event.shiftKey ? line.replace(/^ {1,2}/, "") : `${indent}${line}`))
                      .join("\n");
                    const next = `${before}${value}${after}`;
                    applyMarkdown(next);
                    requestAnimationFrame(() => {
                      textarea.focus();
                      textarea.setSelectionRange(before.length, before.length + value.length);
                    });
                  } else {
                    const value = event.shiftKey
                      ? selected.replace(/^ {1,2}/, "")
                      : `${indent}${selected}`;
                    const next = `${before}${value}${after}`;
                    applyMarkdown(next);
                    requestAnimationFrame(() => {
                      const cursor = before.length + value.length;
                      textarea.focus();
                      textarea.setSelectionRange(cursor, cursor);
                    });
                  }
                }
                if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
                  event.preventDefault();
                  applyAtSelection((s) => ({ text: `**${s || "텍스트"}**`, selectOffsetStart: 2, selectOffsetEnd: 2 + (s || "텍스트").length }));
                }
                if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "i") {
                  event.preventDefault();
                  applyAtSelection((s) => ({ text: `*${s || "텍스트"}*`, selectOffsetStart: 1, selectOffsetEnd: 1 + (s || "텍스트").length }));
                }
                if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                  event.preventDefault();
                  insertLink();
                }
              }}
              placeholder="마크다운으로 작성하세요. 예) # 제목, ## 소제목, ```ts"
              className="h-full min-h-full w-full resize-none border-0 bg-white px-6 py-4 font-mono text-[14px] font-semibold leading-7 text-slate-900 outline-none ring-offset-background placeholder:text-slate-500 focus-visible:ring-0 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-400"
              spellCheck={false}
            />
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onImageFileChange}
            />
        </div>

        <DocStatusBar
          status={status}
          wordCount={wordCount}
          formattedDate={formattedDate}
        />

        <Dialog.Root open={previewOpen} onOpenChange={setPreviewOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px]" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-[60] h-[84vh] w-[min(980px,92vw)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-border bg-white shadow-2xl dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <Dialog.Title className="truncate text-sm font-semibold text-foreground">
                  {meta.title} 미리보기
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-slate-100 hover:text-foreground"
                    aria-label="닫기"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Dialog.Close>
              </div>
              <div className="h-[calc(84vh-57px)] overflow-auto bg-[#f8fafc] px-4 py-4 dark:bg-slate-950">
                <article
                  className="prose prose-sm min-h-full w-full max-w-none overflow-x-auto break-words bg-transparent p-0 text-slate-900 prose-headings:break-words prose-p:break-words prose-li:break-words prose-img:max-w-full prose-pre:overflow-x-auto prose-pre:rounded-lg prose-pre:border prose-pre:border-slate-300 prose-pre:bg-slate-100 prose-pre:text-slate-900 prose-code:rounded prose-code:bg-transparent prose-code:px-1 prose-code:py-0.5 prose-code:text-slate-900 prose-code:before:content-none prose-code:after:content-none prose-table:block prose-table:w-full prose-table:overflow-x-auto dark:text-slate-100 dark:prose-invert dark:prose-pre:border-slate-700 dark:prose-pre:bg-slate-800 dark:prose-pre:text-slate-100 dark:prose-code:bg-transparent dark:prose-code:text-slate-100"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Eye;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-muted-foreground transition hover:border-border hover:bg-white hover:text-foreground"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function DocStatusBar({
  status,
  wordCount,
  formattedDate,
}: {
  status: "idle" | "saving";
  wordCount: number;
  formattedDate: string;
}) {
  const isSaving = status === "saving";
  return (
    <div className="flex items-center justify-between border-t border-border/70 bg-white/90 px-6 py-2 text-xs text-slate-600 dark:bg-slate-900/90 dark:text-slate-300">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            isSaving ? "animate-pulse bg-amber-500" : "bg-emerald-500",
          )}
        />
        {isSaving ? "저장 중..." : "Ready"}
      </div>
      <div>{wordCount} words</div>
      <div className="hidden sm:block">Markdown: # ## - 1. {">"} ```ts</div>
      <div>{formattedDate}</div>
    </div>
  );
}
