// app/(workspace)/workspace/[teamId]/[projectId]/docs/_components/SlashMenu.tsx
'use client';

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { DOC_SLASH_MENU_ITEMS } from "../_model/view.constants";

export default function SlashMenu({ editor }: { editor: Editor | null }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const activeIndex = useRef(0);

  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 슬래시 입력 시 SlashMenu 오픈
      if (e.key === "/") {
        const { from } = editor.state.selection;
        const rect = editor.view.coordsAtPos(from);

        setPos({ x: rect.left, y: rect.bottom + 6 });
        activeIndex.current = 0;
        setOpen(true);
        return;
      }

      if (!open) return;

      if (["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(e.key)) {
        e.preventDefault();

        if (e.key === "ArrowDown") {
          activeIndex.current = (activeIndex.current + 1) % DOC_SLASH_MENU_ITEMS.length;
        }
        if (e.key === "ArrowUp") {
          activeIndex.current =
            (activeIndex.current - 1 + DOC_SLASH_MENU_ITEMS.length) % DOC_SLASH_MENU_ITEMS.length;
        }
        if (e.key === "Enter") {
          DOC_SLASH_MENU_ITEMS[activeIndex.current].run(editor);
          setOpen(false);
        }
        if (e.key === "Escape") {
          setOpen(false);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [editor, open]);

  if (!open || !editor) return null;

  return (
    <div
      className="fixed z-50 w-48 border border-border rounded-md bg-panel shadow-panel text-sm"
      style={{ left: pos.x, top: pos.y }}
    >
      {DOC_SLASH_MENU_ITEMS.map((it, index) => (
        <button
          key={it.key}
          className={`w-full text-left px-3 py-2 hover:bg-subtle/60 ${
            activeIndex.current === index ? "bg-subtle/60" : ""
          }`}
          onMouseEnter={() => (activeIndex.current = index)}
          onClick={() => {
            it.run(editor);
            setOpen(false);
          }}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
