import { useMemo } from "react";
import {
  differenceInCalendarDays,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isToday,
  parseISO,
  startOfDay,
} from "date-fns";
import { ko } from "date-fns/locale";

import { DAY_LABELS } from "@/workspace/calendar/_model/mocks";
import type { CalendarEvent, CalendarSource } from "@/workspace/calendar/_model/types";
import { cn } from "@/lib/utils";
import { DayEventPill } from "./DayEventPill";

type CalendarMonthViewProps = {
  current: Date;
  selectedDate: Date;
  days: Date[];
  eventsByDate: Map<string, CalendarEvent[]>;
  calendarMap: Map<string, CalendarSource>;
  maxVisible?: number;
  onSelectDate: (date: Date) => void;
  onRequestDetails?: (date: Date) => void;
};

export function CalendarMonthView({
  current,
  selectedDate,
  days,
  eventsByDate,
  calendarMap,
  maxVisible = 2,
  onSelectDate,
  onRequestDetails,
}: CalendarMonthViewProps) {
  const allEvents = useMemo(() => {
    const unique = new Map<string, CalendarEvent>();
    eventsByDate.forEach((list) => {
      list.forEach((event) => {
        if (!unique.has(event.id)) {
          unique.set(event.id, event);
        }
      });
    });
    return Array.from(unique.values()).sort(
      (a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime(),
    );
  }, [eventsByDate]);

  const formatRange = (event: CalendarEvent) => {
    const start = parseISO(event.start);
    const end = event.end ? parseISO(event.end) : start;
    const label = isSameDay(start, end)
      ? format(start, "M월 d일 (EEE) HH:mm", { locale: ko })
      : `${format(start, "M월 d일 (EEE) HH:mm", { locale: ko })} ~ ${format(end, "M월 d일 (EEE) HH:mm", { locale: ko })}`;
    return event.allDay ? `${format(start, "M월 d일 (EEE)", { locale: ko })} · 종일` : label;
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-panel shadow-sm">
      <div className="grid grid-cols-7 border-b border-border bg-subtle/60 text-center text-xs font-semibold uppercase tracking-[0.08em]">
        {DAY_LABELS.map((label, idx) => (
          <div
            key={label}
            className={cn(
              "px-2 py-3",
              idx === 0 ? "text-rose-400" : idx === 6 ? "text-sky-400" : "text-muted",
            )}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="flex-1">
        {Array.from({ length: Math.ceil(days.length / 7) }).map((_, weekIndex) => {
          const week = days.slice(weekIndex * 7, weekIndex * 7 + 7);
          if (week.length === 0) return null;
          const weekStart = startOfDay(week[0]);
          const weekEnd = startOfDay(week[week.length - 1]);
          const weeklyEvents = allEvents
            .map((event) => {
              const eventStart = startOfDay(parseISO(event.start));
              const eventEnd = startOfDay(event.end ? parseISO(event.end) : parseISO(event.start));
              if (isAfter(eventStart, weekEnd) || isBefore(eventEnd, weekStart)) {
                return null;
              }
              const clampedStart = isBefore(eventStart, weekStart) ? weekStart : eventStart;
              const clampedEnd = isAfter(eventEnd, weekEnd) ? weekEnd : eventEnd;
              const startIndex = differenceInCalendarDays(clampedStart, weekStart);
              const endIndex = differenceInCalendarDays(clampedEnd, weekStart);
              return {
                event,
                startIndex,
                endIndex,
              };
            })
            .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
            .sort((a, b) => {
              if (a.startIndex === b.startIndex) {
                return a.endIndex - b.endIndex;
              }
              return a.startIndex - b.startIndex;
            });

          const lanes: number[] = [];
          const laidOutEvents = weeklyEvents.map((entry) => {
            const { startIndex, endIndex } = entry;
            let laneIndex = lanes.findIndex((occupied) => startIndex > occupied);
            if (laneIndex === -1) {
              laneIndex = lanes.length;
              lanes.push(endIndex);
            } else {
              lanes[laneIndex] = endIndex;
            }
            const spanDays = endIndex - startIndex + 1;
            const leftPercent = (startIndex / 7) * 100;
            const widthPercent = (spanDays / 7) * 100;
            let variant: "single" | "start" | "middle" | "end" = "single";
            if (spanDays > 1) {
              const isStart = startIndex === differenceInCalendarDays(
                startOfDay(parseISO(entry.event.start)),
                weekStart,
              );
              const isEnd =
                endIndex ===
                differenceInCalendarDays(
                  startOfDay(
                    entry.event.end ? parseISO(entry.event.end) : parseISO(entry.event.start),
                  ),
                  weekStart,
                );
              if (isStart && isEnd) variant = "single";
              else if (isStart) variant = "start";
              else if (isEnd) variant = "end";
              else variant = "middle";
            }

            return {
              ...entry,
              laneIndex,
              leftPercent,
              widthPercent,
              spanDays,
              variant,
              hint: `${entry.event.title}\n${formatRange(entry.event)}${
                entry.event.location ? `\n장소: ${entry.event.location}` : ""
              }`,
            };
          });

          const laneHeight = 20;
          const laneGap = 4;
          const maxLanes = Math.min(2, lanes.length);
          const filteredEvents = laidOutEvents.filter((entry) => entry.laneIndex < maxLanes);
          const railHeight = maxLanes * (laneHeight + laneGap);

          return (
            <div key={weekIndex} className="relative border-b border-border last:border-b-0">
              <div className="grid grid-cols-7">
                {week.map((date) => {
                  const key = format(date, "yyyy-MM-dd");
                  const dayStart = startOfDay(date);
                  const dayCount = laidOutEvents.filter(
                    (entry) =>
                      dayStart >= startOfDay(parseISO(entry.event.start)) &&
                      dayStart <= startOfDay(entry.event.end ? parseISO(entry.event.end) : parseISO(entry.event.start)),
                  ).length;
                  const isCurrentMonth = format(date, "yyyy-MM") === format(current, "yyyy-MM");
                  const isSelected =
                    format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
                  const weekday = date.getDay();
                  const dayColor =
                    weekday === 0
                      ? "text-rose-400"
                      : weekday === 6
                        ? "text-sky-400"
                        : "text-foreground/80";

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        onSelectDate(date);
                        onRequestDetails?.(date);
                      }}
                      className={cn(
                        "relative flex min-h-[92px] flex-col gap-1 border border-border/20 px-2 py-1 text-left transition hover:bg-subtle/40 focus-visible:ring-2 focus-visible:ring-brand/50",
                        !isCurrentMonth &&
                          "bg-zinc-200/30 text-zinc-500 dark:bg-zinc-800/30 dark:text-zinc-500",
                        isSelected && "border-brand/40 ring-2 ring-brand/40",
                      )}
                    >
                      <div
                        className={cn(
                          "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                          isToday(date)
                            ? "bg-brand text-white"
                            : isSelected
                              ? "border border-brand text-brand"
                              : dayColor,
                        )}
                      >
                        {date.getDate()}
                      </div>
                      {dayCount > 0 && (
                        <span className="absolute right-1 top-1 inline-flex items-center rounded-full bg-subtitle px-2 py-[2px] text-[10px] font-medium text-muted shadow">
                          {dayCount}개 일정
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div
                className="pointer-events-none absolute inset-x-0 top-9 px-2"
                style={{ height: railHeight }}
              >
                {filteredEvents.map((entry) => {
                  const showLabel = entry.variant === "single" || entry.variant === "start";
                  const style: React.CSSProperties = {
                    left: `calc(${entry.leftPercent}% + 4px)`,
                    width: `calc(${entry.widthPercent}% - 8px)`,
                    top: entry.laneIndex * (laneHeight + laneGap),
                    height: laneHeight,
                  };

                  return (
                    <div
                      key={`${entry.event.id}-${entry.startIndex}-${entry.laneIndex}`}
                      className="absolute flex items-center"
                      onClickCapture={(event) => {
                        event.stopPropagation();
                        const targetDate = parseISO(entry.event.start);
                        onSelectDate(targetDate);
                        onRequestDetails?.(targetDate);
                      }}
                      style={style}
                    >
                      <DayEventPill
                        event={entry.event}
                        color={calendarMap.get(entry.event.categoryId)?.color}
                        variant={entry.variant}
                        showLabel={showLabel}
                        tooltip={entry.hint}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
