"use client";

import { useEffect } from "react";

export default function DeleteConfirmModal({
  open,
  title,
  description,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  // ESC로 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/60 flex items-center justify-center">
      <div className="w-[340px] rounded-xl border border-border bg-panel p-6 text-foreground shadow-xl">
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        <p className="mb-5 text-sm text-muted">{description}</p>

        <div className="flex justify-end gap-2">
          <button
            className="h-9 min-w-[88px] rounded-lg bg-rose-500 px-4 text-sm font-semibold text-white transition hover:bg-rose-600"
            onClick={onConfirm}
          >
            예
          </button>

          <button
            className="h-9 min-w-[88px] rounded-lg border border-border bg-transparent px-4 text-sm font-semibold text-muted transition hover:bg-sidebar-accent hover:text-foreground"
            onClick={onCancel}
          >
            아니오
          </button>
        </div>
      </div>
    </div>
  );
}
