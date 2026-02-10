// app/(workspace)/workspace/[teamId]/[projectId]/calendar/_components/CalendarHeader.tsx
'use client';

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { CALENDAR_VIEW_OPTIONS } from "@/workspace/calendar/_model/view.constants";
import type { CalendarHeaderProps } from "@/workspace/calendar/_model/view.types";
import type { ViewMode } from "@/workspace/calendar/_model/types";

export function CalendarHeader({
  current,
  view,
  searchTerm,
  categories,
  focusedCalendar,
  onSearch,
  onPrev,
  onNext,
  onToday,
  onChangeView,
  onOpenCreate,
  onToggleCategoryGroup,
  onAddCategory,
}: CalendarHeaderProps) {
  return (
    <header className="flex flex-col gap-3 border-b border-border/70 bg-panel/80 px-5 py-4 backdrop-blur-md">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays size={18} className="text-brand" />
          <div className="flex items-baseline gap-2">
            <div className="text-xl font-semibold text-foreground">캘린더</div>
            <div className="text-sm text-muted">
              {focusedCalendar?.name ?? "전체 캘린더"}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1 text-sm text-muted focus-within:ring-2 focus-within:ring-brand/40">
            <Search size={14} />
            <input
              value={searchTerm}
              onChange={(event) => onSearch(event.target.value)}
              placeholder="일정 검색"
              className="w-44 bg-transparent text-sm text-foreground focus:outline-none md:w-56"
            />
          </div>
          <button
            type="button"
            onClick={onToday}
            className="rounded-md border border-border px-3 py-1 text-sm font-medium text-foreground/80 transition hover:bg-subtle/60"
          >
            오늘
          </button>
          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex items-center gap-2 rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand/90"
          >
            <Plus size={14} />
            새 일정
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="inline-flex items-center gap-1 rounded-md border border-border bg-background p-1 shadow-sm">
          <button
            type="button"
            onClick={onPrev}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-subtle/60"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="px-3 text-base font-semibold text-foreground">
            {format(current, "yyyy.MM", { locale: ko })}
          </div>
          <button
            type="button"
            onClick={onNext}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-subtle/60"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="inline-flex items-center gap-1 rounded-md border border-border bg-background/80 p-1 text-xs font-medium shadow-sm">
          {CALENDAR_VIEW_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChangeView(value as ViewMode)}
              className={cn(
                "rounded-md px-3 py-1 transition",
                view === value ? "bg-brand text-white shadow-sm" : "text-muted hover:bg-subtle/60",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <section className="flex flex-wrap gap-2 rounded-xl border border-border/60 bg-background/80 p-3 shadow-sm">
        {categories.map((calendar) => (
          <label
            key={calendar.key}
            className={cn(
              "inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs transition",
              calendar.visible
                ? "border-border bg-panel/80 text-foreground"
                : "border-border/60 bg-background text-muted hover:bg-sidebar-accent/40 hover:text-foreground",
            )}
          >
            <input
              type="checkbox"
              className="accent-brand"
              checked={calendar.visible}
              onChange={() => onToggleCategoryGroup(calendar.key)}
            />
            <span
              className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
              style={{ backgroundColor: calendar.color }}
            />
            <span className="truncate">{calendar.name}</span>
          </label>
        ))}
        {onAddCategory && (
          <button
            type="button"
            onClick={onAddCategory}
            className="inline-flex items-center gap-1 rounded-md border border-dashed border-border/70 px-2.5 py-1 text-xs text-muted transition hover:border-brand hover:text-brand"
          >
            <CalendarPlus size={12} />
            추가
          </button>
        )}
      </section>
    </header>
  );
}
