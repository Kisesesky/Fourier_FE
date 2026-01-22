"use client";

import { format, isSameDay, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarDays, Clock, MapPin, Pencil, StickyNote, Trash } from "lucide-react";

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

  return (
    <div className={containerClasses}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color ?? "#2563eb" }} />
          <span className={titleClasses}>{event.title}</span>
        </div>
        <div className="flex items-center gap-1">
          {onEdit && !compact && (
            <button
              type="button"
              onClick={() => onEdit(event)}
              className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-[11px] text-muted hover:bg-subtle/60"
            >
              <Pencil size={12} />
              편집
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(event.id)}
            className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-[11px] text-muted hover:bg-subtle/60"
          >
            <Trash size={12} />
            삭제
          </button>
        </div>
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
  );
}
