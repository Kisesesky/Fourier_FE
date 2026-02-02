"use client";

import { useEffect, useState } from "react";

type CalendarManageModalProps = {
  open: boolean;
  name: string;
  type: "TEAM" | "PERSONAL" | "PRIVATE";
  color: string;
  categories: Array<{ id: string; name: string; color: string; isDefault?: boolean }>;
  memberOptions: Array<{ id: string; name: string; avatarUrl?: string | null }>;
  memberIds: string[];
  error?: string | null;
  onChangeName: (value: string) => void;
  onChangeType: (value: "TEAM" | "PERSONAL" | "PRIVATE") => void;
  onChangeColor: (value: string) => void;
  onToggleMember: (id: string) => void;
  onAddCategory: (payload: { name: string; color?: string }) => void;
  onUpdateCategory: (id: string, patch: { name?: string; color?: string }) => void;
  onDeleteCategory: (id: string) => void;
  onSubmit: () => void;
  onDelete: () => void;
  onClose: () => void;
};

export function CalendarManageModal({
  open,
  name,
  type,
  color,
  categories,
  memberOptions,
  memberIds,
  error,
  onChangeName,
  onChangeType,
  onChangeColor,
  onToggleMember,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
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

  const trimmedLength = (name ?? "").trim().length;
  const isPersonal = type === "PERSONAL";
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#3b82f6");

  useEffect(() => {
    if (!open) return;
    setNewCategoryName("");
    setNewCategoryColor("#3b82f6");
  }, [open]);

  if (!open) return null;

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
                disabled={isPersonal}
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
            <label className="text-[11px] uppercase tracking-[0.08em] text-muted">유형</label>
            <select
              value={type}
              onChange={(e) => onChangeType(e.target.value as "TEAM" | "PERSONAL" | "PRIVATE")}
              disabled={isPersonal}
              className="w-full rounded-md border border-border bg-panel/80 px-3 py-2 text-sm shadow-inner outline-none ring-0 transition focus:border-brand/50 focus:ring-2 focus:ring-brand/30"
            >
              <option value="TEAM">팀 캘린더</option>
              <option value="PERSONAL" disabled>개인 캘린더</option>
              <option value="PRIVATE">특정 멤버</option>
            </select>
            {isPersonal ? (
              <p className="text-[11px] text-muted">개인 캘린더는 기본 설정으로 수정/삭제할 수 없습니다.</p>
            ) : (
              <p className="text-[11px] text-muted">팀 캘린더는 매니저 이상만 변경할 수 있어요.</p>
            )}
          </div>

          {type === "PRIVATE" && (
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-[0.08em] text-muted">멤버</label>
              <div className="max-h-40 space-y-2 overflow-auto rounded-md border border-border bg-panel/60 p-3 text-xs">
                {memberOptions.length === 0 && (
                  <p className="text-muted">불러올 멤버가 없습니다.</p>
                )}
                {memberOptions.map((member) => {
                  const checked = memberIds.includes(member.id);
                  return (
                    <label key={member.id} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleMember(member.id)}
                        disabled={isPersonal}
                        className="size-4 accent-brand"
                      />
                      <span className="truncate text-foreground">{member.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.08em] text-muted">색상</label>
            <div className="flex flex-wrap gap-2">
              {["#3b82f6","#22c55e","#ef4444","#f59e0b","#a855f7","#06b6d4","#ec4899","#64748b"].map((c) => {
                const selected = c.toLowerCase() === (color ?? "").toLowerCase();
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onChangeColor(c)}
                    disabled={isPersonal}
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
                  disabled={isPersonal}
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

          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-[0.08em] text-muted">카테고리 관리</label>
            <div className="space-y-2 rounded-md border border-border bg-panel/60 p-3">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center gap-2">
                  <input
                    value={category.name}
                    onChange={(e) => onUpdateCategory(category.id, { name: e.target.value })}
                    disabled={isPersonal}
                    className="flex-1 rounded-md border border-border bg-panel/80 px-2 py-1 text-xs"
                  />
                  <input
                    type="color"
                    value={category.color}
                    onChange={(e) => onUpdateCategory(category.id, { color: e.target.value })}
                    disabled={isPersonal}
                    className="h-7 w-10 cursor-pointer rounded border border-border"
                  />
                  <button
                    type="button"
                    onClick={() => onDeleteCategory(category.id)}
                    disabled={category.isDefault || isPersonal}
                    className={`text-xs ${category.isDefault ? "text-muted" : "text-rose-500"}`}
                  >
                    삭제
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-2">
                <input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  disabled={isPersonal}
                  placeholder="새 카테고리"
                  className="flex-1 rounded-md border border-border bg-panel/80 px-2 py-1 text-xs"
                />
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  disabled={isPersonal}
                  className="h-7 w-10 cursor-pointer rounded border border-border"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newCategoryName.trim()) return;
                    onAddCategory({ name: newCategoryName.trim(), color: newCategoryColor });
                    setNewCategoryName("");
                  }}
                  disabled={isPersonal}
                  className="rounded-md border border-border px-2 py-1 text-xs text-muted hover:text-foreground disabled:opacity-60 disabled:hover:text-muted"
                >
                  추가
                </button>
              </div>
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
            disabled={isPersonal}
            className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-60 disabled:hover:bg-transparent"
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
              disabled={isPersonal}
              className="rounded-md bg-brand px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand/90 disabled:opacity-60 disabled:hover:bg-brand"
            >
              저장
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
