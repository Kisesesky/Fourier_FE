"use client";

import { format, parseISO, startOfMonth } from "date-fns";
import { ko } from "date-fns/locale";
import { useMemo } from "react";

import type { CalendarEvent, CalendarSource } from "@/workspace/calendar/_model/types";
import { UpcomingEventCard } from "./UpcomingEventCard";

type AgendaViewProps = {
  current: Date;
  events: CalendarEvent[];
  calendarMap: Map<string, CalendarSource>;
  onRequestCreate: (date: Date) => void;
  onRequestEdit?: (event: CalendarEvent) => void;
  onDeleteEvent: (id: string) => void;
};

type AgendaSection = {
  dateKey: string;
  label: string;
  events: CalendarEvent[];
};

export function AgendaView({
  current,
  events,
  calendarMap,
  onRequestCreate,
  onRequestEdit,
  onDeleteEvent,
}: AgendaViewProps) {
  const monthLabel = format(current, "yyyy년 M월", { locale: ko });
  const monthStart = startOfMonth(current);

  const groupedByDay = useMemo<AgendaSection[]>(() => {
    const buckets = new Map<string, CalendarEvent[]>();

    events.forEach((event) => {
      const start = parseISO(event.start);
      const key = format(start, "yyyy-MM-dd");
      const list = buckets.get(key) ?? [];
      list.push(event);
      buckets.set(key, list);
    });

    return Array.from(buckets.entries())
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([dateKey, bucket]) => {
        const label = format(parseISO(dateKey), "M월 d일 (EEE)", { locale: ko });
        const sorted = [...bucket].sort(
          (a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime(),
        );
        return { dateKey, label, events: sorted };
      });
  }, [events]);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-panel shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <div className="text-xs uppercase tracking-[0.08em] text-muted">월간 스케줄</div>
          <div className="mt-1 text-lg font-semibold text-foreground">{monthLabel}</div>
        </div>
        <button
          type="button"
          onClick={() => onRequestCreate(monthStart)}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm transition hover:bg-subtle/60"
        >
          새 일정
        </button>
      </div>

      <div className="flex-1 overflow-auto px-4 py-4">
        {groupedByDay.length === 0 ? (
          <div className="rounded-md border border-dashed border-border/60 bg-subtle/40 px-4 py-6 text-sm text-muted">
            등록된 일정이 없습니다. 새 일정을 추가해보세요.
          </div>
        ) : (
          <div className="space-y-6">
            {groupedByDay.map((section) => (
              <section key={section.dateKey} className="space-y-2 rounded-xl border border-border/50 bg-background/80 p-3 shadow-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{section.label}</h3>
                  <span className="text-xs text-muted-foreground">{section.events.length}개 일정</span>
                </div>
                <div className="space-y-2">
                  {section.events.map((event) => (
                    <UpcomingEventCard
                      key={event.id}
                      event={event}
                      calendarName={calendarMap.get(event.categoryId)?.name}
                      color={calendarMap.get(event.categoryId)?.color}
                      onEdit={onRequestEdit}
                      onDelete={onDeleteEvent}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
