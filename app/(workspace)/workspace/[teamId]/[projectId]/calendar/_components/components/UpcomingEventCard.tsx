"use client";

import { format, isSameDay, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarDays, Clock, MapPin, MoreHorizontal, StickyNote } from "lucide-react";
import { useEffect, useState } from "react";

import { formatEventTime } from "@/workspace/calendar/_model/utils";
import type { CalendarEvent } from "@/workspace/calendar/_model/types";

type UpcomingEventCardProps = {
  event: CalendarEvent;
  calendarName?: string;
  color?: string;
  onDelete: (id: string) => void;
  onEdit?: (event: CalendarEvent) => void;
  compact?: boolean;
};

export function UpcomingEventCard({
  event,
  calendarName,
  color,
  onDelete,
  onEdit,
  compact = false,
}: UpcomingEventCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const containerClasses = compact
    ? "rounded-md border border-border/50 bg-background px-3 py-2 text-xs shadow-sm"
    : "rounded-md border border-border/60 bg-background px-3 py-3 text-sm shadow-sm";
  const titleClasses = compact
    ? "font-semibold text-foreground/90"
    : "text-sm font-semibold text-foreground";
  const metaClasses = compact
    ? "mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted"
    : "mt-2 flex flex-wrap items-center gap-3 text-xs text-muted text-foreground/70";

  const start = parseISO(event.start);
  const end = event.end ? parseISO(event.end) : start;

  const dateLabel = isSameDay(start, end)
    ? format(start, "M월 d일 (EEE)", { locale: ko })
    : `${format(start, "M월 d일", { locale: ko })} ~ ${format(end, "M월 d일", { locale: ko })}`;

  const timeline = formatEventTime(event.start, event.end, event.allDay);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (eventInput: MouseEvent) => {
      const target = eventInput.target as HTMLElement | null;
      if (target?.closest?.("[data-event-menu]")) return;
      setMenuOpen(false);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [menuOpen]);

  return (
    <div className={`${containerClasses} group relative`}>
      <div className="flex items-start justify-between gap-3">
        <div className="grid min-w-0 flex-1 grid-cols-[auto,1fr] gap-2">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-subtle text-[10px] font-semibold text-foreground/70">
            {event.createdBy?.avatarUrl ? (
              <img src={event.createdBy.avatarUrl} alt={event.createdBy?.name ?? "User"} className="h-full w-full object-cover" />
            ) : (
              <span>{event.createdBy?.name?.slice(0, 1) ?? "?"}</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color ?? "#2563eb" }} />
              <span className={titleClasses}>{event.title}</span>
            </div>
            <div className={metaClasses}>
              <span className="inline-flex items-center gap-1">
                <CalendarDays size={12} />
                {dateLabel}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock size={12} />
                {timeline}
              </span>
              {calendarName && <span className="text-foreground/60">{calendarName}</span>}
              {event.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={12} />
                  {event.location}
                </span>
              )}
              {event.description && (
                <span className="inline-flex items-center gap-1">
                  <StickyNote size={12} />
                  {event.description.length > 30 ? `${event.description.slice(0, 30)}…` : event.description}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!compact && (
            <button
              type="button"
              onClick={(eventInput) => {
                eventInput.stopPropagation();
                setMenuOpen((prev) => !prev);
              }}
              onMouseDown={(eventInput) => eventInput.stopPropagation()}
              className="invisible inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition group-hover:visible hover:bg-subtle/60 hover:text-foreground"
              aria-label="일정 메뉴"
            >
              <MoreHorizontal size={16} />
            </button>
          )}
        </div>
      </div>
      {menuOpen && !compact && (
        <div
          className="absolute right-3 top-11 z-20 min-w-[140px] overflow-hidden rounded-md border border-border bg-panel text-sm shadow-lg"
          data-event-menu
          onMouseDown={(eventInput) => eventInput.stopPropagation()}
        >
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onEdit(event);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-foreground hover:bg-gray-300/60"
            >
              수정하기
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onDelete(event.id);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-rose-500 hover:bg-rose-500/40"
          >
            삭제하기
          </button>
        </div>
      )}
    </div>
  );
}
