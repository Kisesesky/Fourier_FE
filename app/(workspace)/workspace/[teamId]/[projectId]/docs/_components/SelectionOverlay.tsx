"use client";

import { useEffect, useRef, useState } from "react";
import { useDocSelection } from "../_model/store";

type Rect = { x: number; y: number; w: number; h: number };

export default function SelectionOverlay({ items }: { items: { id: string }[] }) {
  const { selectMany } = useDocSelection();

  const [dragging, setDragging] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);

  const startRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;

      const target = e.target as HTMLElement;

      // 버튼, input, 링크 위에서는 드래그 선택 금지
      if (target.closest("button, input, a, textarea")) return;

      setDragging(true);

      startRef.current = { x: e.clientX, y: e.clientY };
      setRect({ x: e.clientX, y: e.clientY, w: 0, h: 0 });
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging) return;

      const start = startRef.current;

      setRect({
        x: Math.min(start.x, e.clientX),
        y: Math.min(start.y, e.clientY),
        w: Math.abs(e.clientX - start.x),
        h: Math.abs(e.clientY - start.y),
      });
    };

    const onMouseUp = () => {
      if (!dragging || !rect) return;

      const selected: string[] = [];

      items.forEach((item) => {
        const el = document.getElementById(`doc-${item.id}`);
        if (!el) return;

        const box = el.getBoundingClientRect();

        const hit =
          !(box.right < rect.x ||
            box.left > rect.x + rect.w ||
            box.bottom < rect.y ||
            box.top > rect.y + rect.h);

        if (hit) selected.push(item.id);
      });

      selectMany(selected);
      setDragging(false);
      setRect(null);
    };

    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging, rect, items, selectMany]);

  if (!rect) return null;

  return (
    <div
      className="fixed z-[500] bg-blue-500/20 border border-blue-500/40 pointer-events-none"
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
      }}
    />
  );
}
