"use client";

import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";
import React from "react";

type TimelineTaskBarProps = {
  title: string;
  start: Date;
  end: Date;
  color: string;
  timelineStart: Date;
  totalDays: number;
  onSelect: () => void;
  hint: string;
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
  offsetIndex = 0,
  barHeight = 24,
  verticalPadding = 6,
  stackSpacing = 6,
  isActive = false,
}: TimelineTaskBarProps) {
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

  return (
    <div
      className="relative"
      style={{
        gridColumn,
        gridRow: "1",
        marginTop: `${topOffset}px`,
        height: `${barHeight}px`,
      }}
    >
      <button
        type="button"
        onClick={onSelect}
        className={`group flex h-full w-full items-center overflow-hidden rounded-md shadow-sm transition hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          isActive ? "ring-2 ring-brand ring-offset-2 ring-offset-background" : ""
        }`}
        style={{ backgroundColor: color }}
        aria-label={`${title} ${hint}`}
        title={`${title}\n${hint}`}
      >
        <div className="px-3 text-left">
          <span className="text-sm font-medium text-white mix-blend-normal line-clamp-1">{title}</span>
        </div>
      </button>
    </div>
  );
}
