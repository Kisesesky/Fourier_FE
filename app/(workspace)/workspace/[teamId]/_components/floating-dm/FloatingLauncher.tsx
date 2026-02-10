// app/(workspace)/workspace/[teamId]/_components/floating-dm/FloatingLauncher.tsx
'use client';

import { MessageSquare } from "lucide-react";
import type { MutableRefObject } from "react";

type FloatingLauncherProps = {
  hidden: boolean;
  pos: { x: number; y: number } | null;
  contextOpen: boolean;
  contextPos: { x: number; y: number };
  floatingBtnRef: MutableRefObject<HTMLButtonElement | null>;
  contextRef: MutableRefObject<HTMLDivElement | null>;
  dragState: MutableRefObject<{ active: boolean; offsetX: number; offsetY: number; moved: boolean }>;
  onOpen: () => void;
  onSetContextOpen: (open: boolean) => void;
  onSetContextPos: (pos: { x: number; y: number }) => void;
  onSetPos: (pos: { x: number; y: number } | null) => void;
  onHide: () => void;
};

export default function FloatingLauncher({
  hidden,
  pos,
  contextOpen,
  contextPos,
  floatingBtnRef,
  contextRef,
  dragState,
  onOpen,
  onSetContextOpen,
  onSetContextPos,
  onSetPos,
  onHide,
}: FloatingLauncherProps) {
  if (hidden || !pos) return null;

  return (
    <>
      <button
        ref={floatingBtnRef}
        type="button"
        className="fixed z-40 flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition hover:scale-[1.02] cursor-grab active:cursor-grabbing select-none touch-none"
        style={{ left: pos.x, top: pos.y }}
        onClick={(event) => {
          if (dragState.current.moved) {
            dragState.current.moved = false;
            event.preventDefault();
            return;
          }
          onOpen();
        }}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          dragState.current.active = true;
          dragState.current.moved = false;
          const rect = floatingBtnRef.current?.getBoundingClientRect();
          dragState.current.offsetX = rect ? event.clientX - rect.left : 0;
          dragState.current.offsetY = rect ? event.clientY - rect.top : 0;
          floatingBtnRef.current?.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!dragState.current.active) return;
          const size = 48;
          const margin = 12;
          const nextX = Math.min(
            Math.max(margin, event.clientX - dragState.current.offsetX),
            window.innerWidth - size - margin,
          );
          const nextY = Math.min(
            Math.max(margin, event.clientY - dragState.current.offsetY),
            window.innerHeight - size - margin,
          );
          dragState.current.moved = true;
          onSetPos({ x: nextX, y: nextY });
        }}
        onPointerUp={(event) => {
          if (!dragState.current.active) return;
          dragState.current.active = false;
          floatingBtnRef.current?.releasePointerCapture(event.pointerId);
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          onSetContextPos({ x: event.clientX, y: event.clientY });
          onSetContextOpen(true);
        }}
        aria-label="Open DM"
      >
        <MessageSquare size={18} />
      </button>
      {contextOpen && (
        <div
          ref={contextRef}
          className="fixed z-50 w-36 rounded-lg border border-border bg-panel shadow-panel"
          style={{ left: contextPos.x, top: contextPos.y }}
        >
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-muted transition hover:bg-accent hover:text-foreground"
            onClick={() => {
              onSetContextOpen(false);
              onOpen();
            }}
          >
            열기
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-rose-500 transition hover:bg-accent"
            onClick={() => {
              onSetContextOpen(false);
              onHide();
              onSetPos(null);
            }}
          >
            삭제하기
          </button>
        </div>
      )}
    </>
  );
}
