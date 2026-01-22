"use client";

import { useEffect } from "react";

type CalendarManageModalProps = {
  open: boolean;
  name: string;
  color: string;
  error?: string | null;
  onChangeName: (value: string) => void;
  onChangeColor: (value: string) => void;
  onSubmit: () => void;
  onDelete: () => void;
  onClose: () => void;
};

export function CalendarManageModal({
  open,
  name,
  color,
  error,
  onChangeName,
  onChangeColor,
  onSubmit,
  onDelete,
  onClose,
}: CalendarManageModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const trimmedLength = (name ?? "").trim().length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[min(420px,90vw)] rounded-xl border border-border bg-panel p-5 shadow-xl">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
              캘린더 설정
            </div>
            <h2 className="text-lg font-semibold text-foreground">캘린더 수정 및 관리</h2>
          </div>
        </header>

        <div className="space-y-4 text-sm">
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.08em] text-muted">이름</label>
            <div className="relative">
              <input
                value={name}
                onChange={(e) => onChangeName(e.target.value)}
                className="w-full rounded-md border border-border bg-panel/80 px-3 py-2 text-sm shadow-inner outline-none ring-0 transition focus:border-brand/50 focus:ring-2 focus:ring-brand/30"
                placeholder="캘린더 이름"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] tabular-nums text-muted">
                {trimmedLength}/40
              </span>
            </div>
            <p className="text-[11px] text-muted">팀/프로젝트 약어를 사용하면 알아보기 쉬워요.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.08em] text-muted">색상</label>
            <div className="flex flex-wrap gap-2">
              {["#3b82f6","#22c55e","#ef4444","#f59e0b","#a855f7","#06b6d4","#ec4899","#64748b"].map((c) => {
                const selected = c.toLowerCase() === color.toLowerCase();
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onChangeColor(c)}
                    aria-label={`색상 ${c}`}
                    className={`h-7 w-7 rounded-md border transition active:scale-[.98] ${
                      selected ? "ring-2 ring-offset-2 ring-brand ring-offset-panel" : "ring-0"
                    }`}
                    style={{ background: c, borderColor: "color-mix(in oklab, black 10%, transparent)" as any }}
                  />
                );
              })}
              <label className="group inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-2 py-1 text-xs text-muted hover:bg-subtle/60">
                직접 선택
                <input
                  type="color"
                  value={color}
                  onChange={(e) => onChangeColor(e.target.value)}
                  className="h-6 w-10 cursor-pointer rounded border border-border"
                />
              </label>
            </div>
            <div className="mt-2 flex items-center justify-between rounded-md border border-border bg-subtle/40 px-3 py-2">
              <div className="flex items-center gap-2">
                <span
                  className="h-4 w-4 rounded-sm border"
                  style={{ background: color, borderColor: "color-mix(in oklab, black 18%, transparent)" as any }}
                />
                <code className="text-[12px] text-muted">{color.toUpperCase()}</code>
              </div>
              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium text-white"
                style={{ background: color }}
              >
                <span className="h-2 w-2 rounded-full bg-white/90" />
                {(name || "캘린더").trim()}
              </span>
            </div>
          </div>

          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </p>
          ) : null}
        </div>

        <footer className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50"
          >
            삭제
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:bg-subtle/60"
            >
              취소
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="rounded-md bg-brand px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand/90"
            >
              저장
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
