"use client";

import type { Editor } from "@tiptap/react";
import { EditorContent } from "@tiptap/react";

import type { AlignKey } from "./DocEditorToolbar";
import { cn } from "@/lib/utils";

interface DocEditorCanvasProps {
  editor: Editor;
  fontFamily: string;
  fontSize: string;
  paperTone: string;
  textAlign: AlignKey;
}

export default function DocEditorCanvas({
  editor,
  fontFamily,
  fontSize,
  paperTone,
  textAlign,
}: DocEditorCanvasProps) {
  const alignmentClass =
    textAlign === "center"
      ? "text-center"
      : textAlign === "right"
      ? "text-right"
      : "text-left";

  return (
    <div className="flex-1 bg-gradient-to-b from-[#f7f9fb] via-white to-[#f2f5fb] px-4 py-6">
      <div className="mx-auto w-full max-w-4xl rounded-[28px] border border-border/60 bg-white/95 shadow-[0_35px_80px_rgba(15,23,42,0.05)]">
        <div
          className="h-full overflow-auto rounded-[28px] px-12 py-10"
          style={{ backgroundColor: paperTone }}
        >
          <EditorContent
            editor={editor}
            className={cn(
              "prose prose-sm min-h-[640px] max-w-none text-slate-800 focus:outline-none",
              alignmentClass
            )}
            style={{
              fontFamily,
              fontSize: `${fontSize}px`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
