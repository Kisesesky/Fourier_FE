// app/(workspace)/workspace/[teamId]/[projectId]/calendar/_components/DayEventPill.tsx
import { CalendarDays, Clock, CornerDownRight, MapPin, StickyNote } from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";

import {
  DAY_EVENT_LEFT_MARGIN,
  DAY_EVENT_RADIUS,
  DAY_EVENT_RIGHT_MARGIN,
} from "@/workspace/calendar/_model/view.constants";
import type { DayEventPillProps } from "@/workspace/calendar/_model/view.types";

export function DayEventPill({
  event,
  color,
  variant,
  showLabel = false,
}: DayEventPillProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const baseColor = color ?? "#2563eb";
  const avatarUrl = event.createdBy?.avatarUrl ?? null;
  const avatarLabel = event.createdBy?.name?.slice(0, 1) ?? "?";
  const isIssue = event.sourceType === "issue";
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
      className="group relative w-full cursor-pointer text-[12px] font-medium leading-tight transition sm:text-[11px]"
      style={{
        marginLeft: DAY_EVENT_LEFT_MARGIN[variant],
        marginRight: DAY_EVENT_RIGHT_MARGIN[variant],
      }}
      title={undefined}
      ref={wrapperRef}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {showLabel ? (
        <div className="flex min-w-0 flex-col gap-0.5">
          <div
            className="flex min-w-0 items-center gap-1.5 px-2 py-[6px] text-white shadow-sm sm:gap-2 sm:px-2.5 sm:py-[5px]"
            style={{
              backgroundColor: baseColor,
              borderRadius: DAY_EVENT_RADIUS[variant],
            }}
          >
            {isIssue && (
              <span className="inline-flex shrink-0 whitespace-nowrap rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white sm:text-[9px]">
                이슈
              </span>
            )}
            <div className="hidden h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/90 text-[11px] font-semibold text-slate-700 sm:flex sm:h-6 sm:w-6 sm:text-[10px]">
              {avatarUrl ? (
                <img src={avatarUrl} alt={event.createdBy?.name ?? "User"} className="h-full w-full object-cover" />
              ) : (
                <span>{avatarLabel}</span>
              )}
            </div>
            <span className="truncate text-[12px] font-semibold sm:text-[11px] sm:font-medium">{event.title}</span>
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
          className="h-[28px] w-full shadow-sm sm:h-[26px]"
          style={{
            backgroundColor: baseColor,
            borderRadius: DAY_EVENT_RADIUS[variant],
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
              {isIssue && (
                <span className="inline-flex shrink-0 whitespace-nowrap rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                  이슈
                </span>
              )}
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-subtle text-[10px] font-semibold text-foreground/70">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={event.createdBy?.name ?? "User"} className="h-full w-full object-cover" />
                ) : (
                  <span>{avatarLabel}</span>
                )}
              </div>
              <span className="font-semibold">{event.title}</span>
            </div>
            <div className="mt-2 space-y-1.5 text-[11px] text-muted">
              <div className="flex items-start gap-1.5">
                <CalendarDays size={12} />
                <span className="break-words leading-relaxed">{dateLabel}</span>
              </div>
              <div className="flex items-start gap-1.5">
                <Clock size={12} />
                <span className="break-words leading-relaxed">{timeLabel}</span>
              </div>
              {event.location && (
                <div className="flex items-start gap-1.5">
                  <MapPin size={12} />
                  <span className="break-words leading-relaxed">{event.location}</span>
                </div>
              )}
              {event.description && (
                <div className="flex items-start gap-1.5">
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
