"use client";

import { addDays, differenceInCalendarDays, format, isSameDay, startOfDay } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarDays, Clock, MapPin, StickyNote } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type TimelineTaskBarProps = {
  title: string;
  start: Date;
  end: Date;
  color: string;
  timelineStart: Date;
  totalDays: number;
  onSelect: () => void;
  hint: string;
  createdBy?: { id: string; name: string; avatarUrl?: string | null };
  sourceType?: "manual" | "issue";
  calendarName?: string;
  location?: string;
  description?: string;
  allDay?: boolean;
  offsetIndex?: number;
  barHeight?: number;
  verticalPadding?: number;
  stackSpacing?: number;
  isActive?: boolean;
};

export function TimelineTaskBar({
  title,
  start,
  end,
  color,
  timelineStart,
  totalDays,
  onSelect,
  hint,
  createdBy,
  sourceType,
  calendarName,
  location,
  description,
  allDay = false,
  offsetIndex = 0,
  barHeight = 24,
  verticalPadding = 6,
  stackSpacing = 6,
  isActive = false,
}: TimelineTaskBarProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const totalDisplayedDays = Math.max(1, totalDays);
  const timelineStartDay = startOfDay(timelineStart);
  const timelineEndDay = addDays(timelineStartDay, totalDisplayedDays - 1);
  const timelineEndExclusive = addDays(timelineEndDay, 1);

  const rawStartDay = startOfDay(start);
  const rawEndDay = startOfDay(end);

  const clampedStartDay = rawStartDay < timelineStartDay ? timelineStartDay : rawStartDay;
  const clampedEndDayCandidate = rawEndDay > timelineEndDay ? timelineEndDay : rawEndDay;
  const clampedEndDay =
    clampedEndDayCandidate < clampedStartDay ? clampedStartDay : clampedEndDayCandidate;

  const startIndex = Math.max(
    0,
    Math.min(totalDisplayedDays - 1, differenceInCalendarDays(clampedStartDay, timelineStartDay)),
  );

  const endExclusiveCandidate = addDays(clampedEndDay, 1);
  const clampedEndExclusive =
    endExclusiveCandidate > timelineEndExclusive ? timelineEndExclusive : endExclusiveCandidate;

  const endIndex = Math.max(
    startIndex + 1,
    Math.min(totalDisplayedDays, differenceInCalendarDays(clampedEndExclusive, timelineStartDay)),
  );

  const topOffset = verticalPadding + offsetIndex * (barHeight + stackSpacing);
  const gridColumn = `${startIndex + 1} / ${endIndex + 1}`;
  const avatarLabel = createdBy?.name?.slice(0, 1) ?? "?";
  const isIssue = sourceType === "issue";
  const dateLabel = isSameDay(start, end)
    ? format(start, "M월 d일 (EEE)", { locale: ko })
    : `${format(start, "M월 d일", { locale: ko })} ~ ${format(end, "M월 d일", { locale: ko })}`;
  const timeLabel = allDay
    ? "종일"
    : `${format(start, "HH:mm")}${end ? ` ~ ${format(end, "HH:mm")}` : ""}`;

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
      className="relative group"
      style={{
        gridColumn,
        gridRow: "1",
        marginTop: `${topOffset}px`,
        height: `${barHeight}px`,
      }}
      ref={wrapperRef}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        type="button"
        onClick={onSelect}
        className={`group flex h-full w-full items-center overflow-hidden rounded-md shadow-sm transition hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          isActive ? "ring-2 ring-brand ring-offset-2 ring-offset-background" : ""
        }`}
        style={{ backgroundColor: color }}
        aria-label={`${title} ${hint}`}
      >
        <div className="flex items-center gap-2 px-3 text-left">
          {isIssue && (
            <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-semibold text-white">
              이슈
            </span>
          )}
          <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/90 text-[10px] font-semibold text-slate-700">
            {createdBy?.avatarUrl ? (
              <img src={createdBy.avatarUrl} alt={createdBy?.name ?? "User"} className="h-full w-full object-cover" />
            ) : (
              <span>{createdBy?.name?.slice(0, 1) ?? "?"}</span>
            )}
          </div>
          <span className="text-sm font-medium text-white mix-blend-normal line-clamp-1">{title}</span>
        </div>
      </button>
      {showTooltip &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={tooltipRef}
            className="pointer-events-none fixed z-[200] w-64 rounded-xl border border-border bg-panel p-3 text-xs text-foreground shadow-xl"
            style={{ top: tooltipStyle.top, left: tooltipStyle.left }}
          >
            <div className="flex items-center gap-2">
              {isIssue && (
                <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                  이슈
                </span>
              )}
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-subtle text-[10px] font-semibold text-foreground/70">
                {createdBy?.avatarUrl ? (
                  <img src={createdBy.avatarUrl} alt={createdBy?.name ?? "User"} className="h-full w-full object-cover" />
                ) : (
                  <span>{avatarLabel}</span>
                )}
              </div>
              <span className="font-semibold">{title}</span>
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
              {calendarName && (
                <div className="inline-flex items-center gap-1">
                  <CalendarDays size={12} />
                  {calendarName}
                </div>
              )}
              {location && (
                <div className="inline-flex items-center gap-1">
                  <MapPin size={12} />
                  {location}
                </div>
              )}
              {description && (
                <div className="hidden items-start gap-1 md:inline-flex">
                  <StickyNote size={12} className="mt-0.5" />
                  <span className="line-clamp-3">{description}</span>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
