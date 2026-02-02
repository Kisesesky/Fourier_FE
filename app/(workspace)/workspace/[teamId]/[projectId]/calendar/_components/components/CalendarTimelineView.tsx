"use client";

import { useCallback, useMemo, useState } from "react";
import { eachDayOfInterval, endOfMonth, format, parseISO, startOfMonth } from "date-fns";
import { ko } from "date-fns/locale";
import { Plus } from "lucide-react";

import Button from "@/components/ui/button";
import type { CalendarEvent, CalendarSource } from "@/workspace/calendar/_model/types";
import { TimelineTaskBar } from "./TimelineTaskBar";

type CalendarTimelineViewProps = {
  current: Date;
  events: CalendarEvent[];
  calendarMap: Map<string, CalendarSource>;
  onRequestCreate: (date: Date) => void;
  onSelectDate: (date: Date) => void;
  onRequestDetails: (date: Date) => void;
  editingEventId?: string | null;
};

type TimelineTask = {
  id: string;
  calendarId: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  calendarName: string;
  allDay: boolean;
};

type TimelineGroup = {
  calendarId: string;
  calendarName: string;
  calendarColor: string;
  tasks: TimelineTask[];
};

const MONTH_COLORS = ["bg-blue-50", "bg-orange-50", "bg-emerald-50", "bg-purple-50", "bg-rose-50"];
const DAY_CELL_MIN_WIDTH = 48;
const DAY_CELL_MIN_WIDTH_COMPACT = 36;
const DEFAULT_VISIBLE_DAYS = 14;

const formatRange = (start: Date, end: Date, allDay: boolean) => {
  const startLabel = format(start, "yyyy.MM.dd");
  const endLabel = format(end, "yyyy.MM.dd");
  if (startLabel === endLabel) {
    return allDay ? startLabel : format(start, "yyyy.MM.dd HH:mm");
  }
  const template = allDay ? "yyyy.MM.dd" : "yyyy.MM.dd HH:mm";
  return `${format(start, template)} ~ ${format(end, template)}`;
};


export function CalendarTimelineView({
  current,
  events,
  calendarMap,
  onRequestCreate,
  onSelectDate,
  onRequestDetails,
  editingEventId,
}: CalendarTimelineViewProps) {
  const [visibleDays, setVisibleDays] = useState(DEFAULT_VISIBLE_DAYS);
  const [cellWidth, setCellWidth] = useState(DAY_CELL_MIN_WIDTH);
  const [leftColumnWidth, setLeftColumnWidth] = useState(160);

  const tasks = useMemo<TimelineTask[]>(() => {
    const monthStartBoundary = startOfMonth(current);
    const monthEndBoundary = endOfMonth(current);

    return events
      .filter((event) => {
        const start = parseISO(event.start);
        const end = event.end ? parseISO(event.end) : start;
        return end >= monthStartBoundary && start <= monthEndBoundary;
      })
      .map((event) => {
        const start = parseISO(event.start);
        const end = event.end ? parseISO(event.end) : start;
        const safeEnd = end < start ? start : end;
        const calendar = calendarMap.get(event.categoryId);
        const color = calendar?.color ?? "#2563eb";
        const title = event.title?.trim() || "Untitled event";
        return {
          calendarId: event.categoryId,
          id: event.id,
          title,
          start,
          end: safeEnd,
          color,
          calendarName: calendar?.name ?? "Calendar",
          allDay: event.allDay,
        };
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [current, events, calendarMap]);

  const timelineMeta = useMemo(() => {
    const monthStart = startOfMonth(current);
    const monthEnd = endOfMonth(current);
    const start = monthStart;
    const end = monthEnd;
    const days = eachDayOfInterval({ start, end });
    return { start, end, days };
  }, [current]);

  const monthSegments = useMemo(() => {
    const segments: Array<{ key: string; label: string; length: number }> = [];
    let currentSegment: { key: string; label: string; length: number } | null = null;

    timelineMeta.days.forEach((day) => {
      const key = format(day, "yyyy-MM");
      const label = format(day, "M월", { locale: ko });
      if (!currentSegment || currentSegment.key !== key) {
        if (currentSegment) {
          segments.push(currentSegment);
        }
        currentSegment = { key, label, length: 1 };
      } else {
        currentSegment.length += 1;
      }
    });

    if (currentSegment) {
      segments.push(currentSegment);
    }

    return segments;
  }, [timelineMeta.days]);

  const groupedByCalendar = useMemo<TimelineGroup[]>(() => {
    const order: TimelineGroup[] = [];
    const map = new Map<string, TimelineGroup>();

    tasks.forEach((task) => {
      let group = map.get(task.calendarId);
      if (!group) {
        const calendar = calendarMap.get(task.calendarId);
        group = {
          calendarId: task.calendarId,
          calendarName: calendar?.name ?? task.calendarName,
          calendarColor: calendar?.color ?? task.color,
          tasks: [],
        };
        map.set(task.calendarId, group);
        order.push(group);
      }
      group.tasks.push(task);
    });

    return order;
  }, [tasks, calendarMap]);

  const totalDays = Math.max(1, timelineMeta.days.length);

  const GRID_FIXED_COLS = `repeat(${totalDays}, ${cellWidth}px)`;
  const GRID_FIXED_WIDTH = totalDays * cellWidth;

  const handleResize = useCallback(
    (rect: DOMRectReadOnly) => {
      const availableWidth = Math.max(0, rect.width - leftColumnWidth);
      if (availableWidth === 0) return;
      const dynamicCellWidth = Math.floor(availableWidth / visibleDays);
      const nextCellWidth = Math.max(
        rect.width < 640 ? DAY_CELL_MIN_WIDTH_COMPACT : DAY_CELL_MIN_WIDTH,
        dynamicCellWidth,
      );
      setCellWidth(nextCellWidth);
    },
    [leftColumnWidth, visibleDays],
  );

  const monthHeaderCells = useMemo(() => {
    let columnOffset = 1;
    return monthSegments.map((segment, index) => {
      const cell = (
        <div
          key={segment.key}
          className={`flex items-center justify-center border-r border-border text-xs font-semibold text-foreground ${MONTH_COLORS[index % MONTH_COLORS.length]}`}
          style={{ gridColumn: `${columnOffset} / span ${segment.length}` }}
        >
          {segment.label}
        </div>
      );
      columnOffset += segment.length;
      return cell;
    });
  }, [monthSegments]);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-border bg-panel shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">타임라인</h2>
            <p className="mt-1 text-sm text-muted-foreground">선택한 캘린더 일정을 시간 순으로 정리했습니다.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => onRequestCreate(current)}>
              <Plus className="mr-2 h-4 w-4" />
              일정 추가
            </Button>
          </div>
        </div>

        <div className="max-w-full overflow-x-auto overflow-y-hidden scrollbar-thin">
          <div
            className="inline-block w-max"
            style={{ width: `${GRID_FIXED_WIDTH + 140}px` }} // w-40 ≈ 160px
          >
            <div className="flex border-b border-border bg-background/70">
              <div className="w-40 shrink-0 border-r border-border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                월
              </div>
              <div
                className="grid flex-1"
                style={{
                  gridTemplateColumns: GRID_FIXED_COLS,
                  minWidth: `${GRID_FIXED_WIDTH}px`,
                }}
              >
                {monthHeaderCells}
              </div>
            </div>

            <div className="flex border-b border-border bg-background/60">
              <div className="w-40 shrink-0 border-r border-border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                분류
              </div>
              <div
                className="grid flex-1"
                style={{
                  gridTemplateColumns: GRID_FIXED_COLS,
                  minWidth: `${GRID_FIXED_WIDTH}px`,
                }}
              >
                {timelineMeta.days.map((day, index) => (
                  <div
                    key={day.toISOString()}
                    className="border-r border-border px-2 py-2 text-center text-xs font-semibold text-foreground"
                    style={{ gridColumn: `${index + 1}` }}
                  >
                    {format(day, "d일", { locale: ko })}
                  </div>
                ))}
              </div>
            </div>

            {groupedByCalendar.length === 0 ? (
              <div className="flex h-48 items-center justify-center border-b border-border bg-background/70">
                <div className="rounded-xl border border-dashed border-border/60 bg-subtle/40 px-6 py-8 text-center text-sm text-muted">
                  표시할 일정이 없습니다. 새로운 일정을 추가해 보세요.
                </div>
              </div>
            ) : (
              groupedByCalendar.map((group) => {
                const barHeight = 24;
                const verticalPadding = 6;
                const stackSpacing = 6;
                const contentHeight =
                  group.tasks.length === 0
                    ? barHeight + verticalPadding * 2
                    : verticalPadding * 2 +
                      group.tasks.length * barHeight +
                      Math.max(group.tasks.length - 1, 0) * stackSpacing;

                return (
                  <div
                    key={group.calendarId}
                    className="flex border-b border-border bg-background/70 transition hover:bg-subtle/40"
                  >
                    <div
                      className="w-40 shrink-0 border-r border-border px-3 py-2"
                      style={{ minHeight: `${contentHeight}px` }}
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground line-clamp-2">
                        <span
                          className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: group.calendarColor }}
                        />
                        <span>{group.calendarName}</span>
                      </div>
                    </div>
                    <div
                      className="relative grid flex-1"
                      style={{
                        height: `${contentHeight}px`,
                        gridTemplateColumns: GRID_FIXED_COLS,
                        gridTemplateRows: "1fr",
                        minWidth: `${GRID_FIXED_WIDTH}px`,
                      }}
                    >
                      <div
                        className="pointer-events-none absolute inset-0 grid"
                        style={{
                          gridTemplateColumns: GRID_FIXED_COLS,
                          minWidth: `${GRID_FIXED_WIDTH}px`,
                        }}
                      >
                        {timelineMeta.days.map((day, index) => (
                          <div
                            key={day.toISOString()}
                            className={`${
                              index === timelineMeta.days.length - 1 ? "border-r-0" : ""
                            }`}
                          />
                        ))}
                      </div>
                      {group.tasks.map((task, index) => (
                        <TimelineTaskBar
                          key={task.id}
                          title={task.title}
                          start={task.start}
                          end={task.end}
                          color={task.color}
                          timelineStart={timelineMeta.start}
                          totalDays={totalDays}
                          hint={`${formatRange(task.start, task.end, task.allDay)} · ${task.calendarName}`}
                          offsetIndex={index}
                          barHeight={barHeight}
                          verticalPadding={verticalPadding}
                          stackSpacing={stackSpacing}
                          isActive={editingEventId === task.id}
                          onSelect={() => {
                            onSelectDate(task.start);
                            onRequestDetails(task.start);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
