// app/(workspace)/workspace/[teamId]/[projectId]/docs/_components/DocEditorCanvas.tsx
'use client';

import type { Editor } from "@tiptap/react";
import { EditorContent } from "@tiptap/react";

import type { AlignKey } from "@/workspace/docs/_model/view.types";
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
    <div className="flex-1 overflow-auto bg-white px-10 py-8">
      <div
        className="mx-auto h-full w-full max-w-5xl px-2"
        style={{ backgroundColor: paperTone }}
      >
        <EditorContent
          editor={editor}
          className={cn(
            "prose prose-sm min-h-[640px] max-w-none text-slate-800 focus:outline-none",
            "prose-pre:my-4 prose-pre:rounded-lg prose-pre:bg-slate-900 prose-pre:text-slate-100",
            "prose-code:rounded prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:text-slate-800",
            "prose-code:before:content-none prose-code:after:content-none",
            alignmentClass
          )}
          style={{
            fontFamily,
            fontSize: `${fontSize}px`,
          }}
        />
      </div>
    </div>
  );
}
