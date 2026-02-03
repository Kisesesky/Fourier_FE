import { CalendarDays, Clock, CornerDownRight, MapPin, StickyNote } from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";

import type { CalendarEvent } from "@/workspace/calendar/_model/types";

type DayEventPillProps = {
  event: CalendarEvent;
  color?: string;
  variant: "single" | "start" | "middle" | "end";
  showLabel?: boolean;
  tooltip?: string;
};

const OFFSET = 6;

const RADIUS: Record<DayEventPillProps["variant"], string> = {
  single: "9999px",
  start: "9999px 0 0 9999px",
  middle: "0",
  end: "0 9999px 9999px 0",
};

const LEFT_MARGIN: Record<DayEventPillProps["variant"], number> = {
  single: 0,
  start: 0,
  middle: -OFFSET,
  end: -OFFSET,
};

const RIGHT_MARGIN: Record<DayEventPillProps["variant"], number> = {
  single: 0,
  start: -OFFSET,
  middle: -OFFSET,
  end: 0,
};

export function DayEventPill({
  event,
  color,
  variant,
  showLabel = false,
  tooltip,
}: DayEventPillProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const baseColor = color ?? "#2563eb";
  const avatarUrl = event.createdBy?.avatarUrl ?? null;
  const avatarLabel = event.createdBy?.name?.slice(0, 1) ?? "?";
  const showMemo = Boolean(event.description);
  const start = parseISO(event.start);
  const end = event.end ? parseISO(event.end) : start;
  const dateLabel = isSameDay(start, end)
    ? format(start, "M월 d일 (EEE)", { locale: ko })
    : `${format(start, "M월 d일", { locale: ko })} ~ ${format(end, "M월 d일", { locale: ko })}`;
  const timeLabel = event.allDay
    ? "종일"
    : `${format(start, "HH:mm")}${event.end ? ` ~ ${format(end, "HH:mm")}` : ""}`;

  useEffect(() => {
    if (!showTooltip) return;
    const updatePosition = () => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;
      const tooltipWidth = 256;
      const margin = 8;
      const tooltipHeight = tooltipRef.current?.offsetHeight ?? 120;
      let left = rect.left;
      if (left + tooltipWidth > window.innerWidth - margin) {
        left = window.innerWidth - tooltipWidth - margin;
      }
      if (left < margin) left = margin;
      let top = rect.bottom + 8;
      if (top + tooltipHeight > window.innerHeight - margin) {
        top = rect.top - tooltipHeight - 8;
      }
      if (top < margin) top = margin;
      setTooltipStyle({ top, left });
    };
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [showTooltip]);

  return (
    <div
      className="group relative w-full cursor-pointer text-[11px] font-medium leading-tight transition"
      style={{
        marginLeft: LEFT_MARGIN[variant],
        marginRight: RIGHT_MARGIN[variant],
      }}
      title={undefined}
      ref={wrapperRef}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {showLabel ? (
        <div className="flex min-w-0 flex-col gap-0.5">
          <div
            className="flex min-w-0 items-center gap-1.5 px-2 py-[5px] text-white shadow-sm"
            style={{
              backgroundColor: baseColor,
              borderRadius: RADIUS[variant],
            }}
          >
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/90 text-[10px] font-semibold text-slate-700">
              {avatarUrl ? (
                <img src={avatarUrl} alt={event.createdBy?.name ?? "User"} className="h-full w-full object-cover" />
              ) : (
                <span>{avatarLabel}</span>
              )}
            </div>
            <span className="truncate">{event.title}</span>
          </div>
          {showMemo && (
            <div className="ml-4 hidden min-w-0 items-start gap-1 text-[10px] text-muted md:flex">
              <CornerDownRight size={11} className="text-muted" />
              <span className="break-words whitespace-normal text-foreground/70">{event.description}</span>
            </div>
          )}
        </div>
      ) : (
        <div
          className="h-[26px] w-full shadow-sm"
          style={{
            backgroundColor: baseColor,
            borderRadius: RADIUS[variant],
          }}
          aria-hidden
        />
      )}
      {showLabel &&
        showTooltip &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={tooltipRef}
            className="pointer-events-none fixed z-[200] w-64 rounded-xl border border-border bg-panel p-3 text-xs text-foreground shadow-xl"
            style={{ top: tooltipStyle.top, left: tooltipStyle.left }}
          >
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-subtle text-[10px] font-semibold text-foreground/70">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={event.createdBy?.name ?? "User"} className="h-full w-full object-cover" />
                ) : (
                  <span>{avatarLabel}</span>
                )}
              </div>
              <span className="font-semibold">{event.title}</span>
            </div>
            <div className="mt-2 space-y-1 text-[11px] text-muted">
              <div className="inline-flex items-center gap-1">
                <CalendarDays size={12} />
                {dateLabel}
              </div>
              <div className="inline-flex items-center gap-1">
                <Clock size={12} />
                {timeLabel}
              </div>
              {event.location && (
                <div className="inline-flex items-center gap-1">
                  <MapPin size={12} />
                  {event.location}
                </div>
              )}
              {event.description && (
                <div className="hidden items-start gap-1 md:inline-flex">
                  <StickyNote size={12} className="mt-0.5" />
                  <span className="line-clamp-3">{event.description}</span>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
