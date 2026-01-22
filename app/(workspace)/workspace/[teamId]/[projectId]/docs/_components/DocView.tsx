"use client";

import { useEffect, useMemo, useState } from "react";
import type { JSONContent } from "@tiptap/react";
import { useEditor } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { format } from "date-fns";

import { useDocEditor } from "./DocEditorContext";
import { createDocOutline } from "../_model/hooks/useDocOutline";
import DocEditorToolbar, { type AlignKey } from "./DocEditorToolbar";
import DocEditorCanvas from "./DocEditorCanvas";
import DocLinkModal from "./DocLinkModal";
import DocImageModal from "./DocImageModal";
import { cn } from "@/lib/utils";

const FONT_OPTIONS = [
  { label: "Pretendard", value: "Pretendard" },
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Space Grotesk", value: "'Space Grotesk', sans-serif" },
  { label: "Noto Sans", value: "'Noto Sans KR', sans-serif" },
];

const FONT_SIZE_OPTIONS = ["10", "12", "14", "16", "18", "20", "24", "28"].map(
  (size) => ({
    label: `${size}px`,
    value: size,
  })
);

const PAPER_TONES = [
  { label: "White", value: "#ffffff" },
  { label: "Ivory", value: "#fdf5d3" },
  { label: "Sky", value: "#eef7ff" },
  { label: "Mint", value: "#ecfdf5" },
];

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
  } = useDocEditor();

  const [isReady, setIsReady] = useState(false);
  const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0].value);
  const [fontSize, setFontSize] = useState(FONT_SIZE_OPTIONS[1].value);
  const [paperTone, setPaperTone] = useState(PAPER_TONES[0].value);
  const [textAlign, setTextAlign] = useState<AlignKey>("left");
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!content) {
      setOutline([]);
      setWordCount(0);
      return;
    }
    setOutline(createDocOutline(content));
    setWordCount(countWords(content));
  }, [content, setOutline, setWordCount]);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3, 4],
          },
        }),
        Underline,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: "text-primary underline decoration-primary/40",
          },
        }),
        Image.configure({
          allowBase64: true,
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: "text-primary underline decoration-primary/40",
          },
        }),
        Image.configure({
          allowBase64: true,
        }),
        Placeholder.configure({
          placeholder: "Welcome to your rich text editor...",
        }),
      ],
      content: (content as JSONContent) || { type: "doc", content: [] },
      editorProps: {
        attributes: {
          class: "focus:outline-none min-h-[560px] leading-relaxed text-base",
        },
      },
      immediatelyRender: false,
      onUpdate({ editor }) {
        const json = editor.getJSON();
        updateContent(json);

        setOutline(createDocOutline(json));
        setWordCount(countWords(json));
      },
    },
    [isReady]
  );

  useEffect(() => {
    if (!editor) return;
    if (!content) {
      editor.commands.clearContent();
      return;
    }
    editor.commands.setContent(content as JSONContent);
  }, [content, editor]);

  const formattedDate = useMemo(() => {
    const target = lastSavedAt ?? meta?.updatedAt;
    if (!target) return "날짜 정보 없음";
    const parsed = new Date(target);
    if (Number.isNaN(parsed.getTime())) return "날짜 정보 없음";
    return format(parsed, "EEEE, MMMM d, yyyy");
  }, [lastSavedAt, meta?.updatedAt]);

  if (!meta) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed bg-white text-sm text-muted-foreground">
        선택된 문서를 찾을 수 없습니다.
      </div>
    );
  }

  if (!isReady || !editor) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
        에디터를 불러오는 중입니다...
      </div>
    );
  }

  const handleInsertLink = () => setLinkModalOpen(true);
  const handleInsertImage = () => setImageModalOpen(true);

  const submitLink = (url: string, text: string) => {
    if (!editor) return;
    const display = text?.trim() || url;
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url, target: "_blank" })
      .insertContent(display)
      .run();
    setLinkModalOpen(false);
  };

  const submitImage = (src: string, alt?: string) => {
    if (!editor) return;
    editor.chain().focus().setImage({ src, alt }).run();
    setImageModalOpen(false);
  };

  return (
    <div className="flex h-full flex-col bg-[#eef2f7] p-4">
      <div className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-border/70 bg-white">
        <DocEditorToolbar
          editor={editor}
          fontFamily={fontFamily}
          setFontFamily={setFontFamily}
          fontSize={fontSize}
          setFontSize={setFontSize}
          paperTone={paperTone}
          setPaperTone={setPaperTone}
          textAlign={textAlign}
          setTextAlign={setTextAlign}
          fontOptions={FONT_OPTIONS}
          fontSizeOptions={FONT_SIZE_OPTIONS}
          paperTones={PAPER_TONES}
          onInsertLink={handleInsertLink}
          onInsertImage={handleInsertImage}
        />

        <DocEditorCanvas
          editor={editor}
          fontFamily={fontFamily}
          fontSize={fontSize}
          paperTone={paperTone}
          textAlign={textAlign}
        />

        <DocStatusBar
          status={status}
          wordCount={wordCount}
          formattedDate={formattedDate}
        />
        <DocLinkModal
          open={linkModalOpen}
          onClose={() => setLinkModalOpen(false)}
          onSubmit={submitLink}
        />
        <DocImageModal
          open={imageModalOpen}
          onClose={() => setImageModalOpen(false)}
          onSubmit={submitImage}
        />
      </div>
    </div>
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
    <div className="flex items-center justify-between border-t border-border/70 bg-white/90 px-6 py-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            isSaving ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
          )}
        />
        {isSaving ? "저장 중..." : "Ready"}
      </div>
      <div>{wordCount} words</div>
      <div>{formattedDate}</div>
    </div>
  );
}

function countWords(doc?: JSONContent | null) {
  if (!doc) return 0;
  let count = 0;

  const walk = (node?: JSONContent) => {
    if (!node) return;
    if (typeof node.text === "string") {
      const words = node.text.trim().split(/\s+/).filter(Boolean);
      count += words.length;
    }
    if (node.content) {
      node.content.forEach((child) => walk(child));
    }
  };

  walk(doc);
  return count;
}
