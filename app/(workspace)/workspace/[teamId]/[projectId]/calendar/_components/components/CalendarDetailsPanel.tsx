"use client";

import { format, isSameDay, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarDays, Clock, MapPin, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import type { ChangeEvent } from "react";

import type { CalendarEvent, CalendarSource, EventDraft } from "@/workspace/calendar/_model/types";

type CalendarDetailsPanelProps = {
  selectedDate: Date;
  events: CalendarEvent[];
  calendars: CalendarSource[];
  calendarMap: Map<string, CalendarSource>;
  draft: EventDraft;
  isFormOpen: boolean;
  formError: string | null;
  editingEventId: string | null;
  onChangeDraft: (patch: Partial<EventDraft>) => void;
  onRequestCreate: () => void;
  onRequestEdit: (event: CalendarEvent) => void;
  onCancelCreate: () => void;
  onSubmit: () => void;
  onDeleteEvent: (id: string) => void;
  onClose?: () => void;
};

const labelClass = "text-[11px] font-semibold uppercase tracking-[0.08em] text-muted";

type TimePreset = { label: string; start: string; end: string; allDay?: boolean };

const timePresets: TimePreset[] = [
  { label: "AM 집중", start: "09:00", end: "10:30" },
  { label: "점심 미팅", start: "12:30", end: "13:30" },
  { label: "PM 리뷰", start: "15:00", end: "16:00" },
  { label: "하루 종일", start: "", end: "", allDay: true },
];

export function CalendarDetailsPanel({
  selectedDate,
  events,
  calendars,
  calendarMap,
  draft,
  isFormOpen,
  formError,
  editingEventId,
  onChangeDraft,
  onRequestCreate,
  onRequestEdit,
  onCancelCreate,
  onSubmit,
  onDeleteEvent,
  onClose,
}: CalendarDetailsPanelProps) {
  const isEditing = Boolean(editingEventId);
  const selectedLabel = format(selectedDate, "M월 d일 (EEE)", { locale: ko });

  const handleChange =
    (key: keyof EventDraft) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value =
        event.target.type === "checkbox"
          ? (event.target as HTMLInputElement).checked
          : event.target.value;
      onChangeDraft({ [key]: value } as Partial<EventDraft>);
    };

  const applyTimePreset = (preset: (typeof timePresets)[number]) => {
    if (preset.allDay) {
      onChangeDraft({ allDay: true, startTime: "", endTime: "" });
      return;
    }
    onChangeDraft({
      allDay: false,
      startTime: preset.start,
      endTime: preset.end,
    });
  };

  const renderDuration = (event: CalendarEvent) => {
    const start = parseISO(event.start);
    const end = event.end ? parseISO(event.end) : start;

    if (event.allDay) {
      if (isSameDay(start, end)) {
        return "종일";
      }
      return `종일 · ${format(start, "M월 d일", { locale: ko })} ~ ${format(end, "M월 d일", {
        locale: ko,
      })}`;
    }

    if (isSameDay(start, end)) {
      return `${format(start, "HH:mm")}${event.end ? ` ~ ${format(end, "HH:mm")}` : ""}`;
    }

    return `${format(start, "M월 d일 HH:mm", {
      locale: ko,
    })} ~ ${format(end, "M월 d일 HH:mm", { locale: ko })}`;
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-t-3xl border-t border-border bg-panel/85 backdrop-blur md:rounded-none md:border-t-0 md:border-l">
      <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted">
            <CalendarDays size={13} />
            선택한 날짜
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-foreground">{selectedLabel}</span>
            <span className="rounded-full bg-subtle px-2 py-0.5 text-[11px] font-medium text-muted">
              {events.length === 0 ? "일정 없음" : `${events.length}개 일정`}
            </span>
          </div>
          {!isFormOpen && events.length > 0 && (
            <p className="text-[11px] text-muted">가장 가까운 일정은 {renderDuration(events[0])} 입니다.</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isFormOpen ? (
            <button
              type="button"
              onClick={onCancelCreate}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs text-muted hover:bg-subtle/60"
            >
              닫기
            </button>
          ) : (
            <button
              type="button"
              onClick={onRequestCreate}
              className="inline-flex items-center gap-2 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand/90"
            >
              <Plus size={14} />
              일정추가
            </button>
          )}
          {onClose && !isFormOpen && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs text-muted hover:bg-subtle/60"
            >
              닫기
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-5 scrollbar-thin">
        {isFormOpen ? (
          <section className="space-y-4">
            <div className="flex items-start justify-between gap-2 rounded-xl border border-border/70 bg-background/95 px-4 py-4 shadow-sm">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-[3px] text-[11px] font-semibold text-brand">
                  <Sparkles size={12} />
                  {isEditing ? "일정 수정" : "새 일정"}
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {isEditing && draft.title ? draft.title : selectedLabel}
                </div>
                <p className="text-[11px] text-muted">필요한 정보만 입력하면 바로 저장할 수 있어요.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onCancelCreate}
                  className="rounded-md border border-border px-3 py-2 text-sm text-muted hover:bg-subtle/60"
                >
                  {isEditing ? "취소" : "닫기"}
                </button>
                <button
                  type="button"
                  onClick={onSubmit}
                  className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand/90"
                >
                  {isEditing ? "저장" : "등록"}
                </button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-1.5">
                <label className={labelClass}>제목</label>
                <input
                  value={draft.title}
                  onChange={handleChange("title")}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                  placeholder="회의, 리뷰, 휴가 등"
                />
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>카테고리</label>
                <select
                  value={draft.categoryId}
                  onChange={handleChange("categoryId")}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                >
                  {calendars.map((calendar) => (
                    <option key={calendar.id} value={calendar.id}>
                      {calendar.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>시작 날짜</label>
                <input
                  type="date"
                  value={draft.startDate}
                  onChange={handleChange("startDate")}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>종료 날짜</label>
                <input
                  type="date"
                  value={draft.endDate}
                  onChange={handleChange("endDate")}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>

              <div className="space-y-2 lg:col-span-2">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-xs text-muted">
                    <input
                      type="checkbox"
                      checked={draft.allDay}
                      onChange={(event) =>
                        onChangeDraft({ allDay: event.target.checked, startTime: "", endTime: "" })
                      }
                      className="size-4 accent-brand"
                    />
                    종일 일정
                  </label>
                  {!draft.allDay && (
                    <div className="flex flex-wrap gap-2">
                      {timePresets.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => applyTimePreset(preset)}
                          className="rounded-full border border-border px-3 py-1 text-[11px] text-muted transition hover:border-brand/40 hover:text-brand"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {!draft.allDay && (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className={labelClass}>시작 시간</label>
                      <input
                        type="time"
                        value={draft.startTime}
                        onChange={handleChange("startTime")}
                        className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>종료 시간</label>
                      <input
                        type="time"
                        value={draft.endTime}
                        onChange={handleChange("endTime")}
                        className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 lg:col-span-2">
                <label className={labelClass}>장소</label>
                <input
                  value={draft.location}
                  onChange={handleChange("location")}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                  placeholder="회의실, 화상 회의 링크 등"
                />
              </div>

              <div className="space-y-1.5 lg:col-span-2">
                <label className={labelClass}>메모</label>
                <textarea
                  value={draft.description}
                  onChange={handleChange("description")}
                  rows={4}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                  placeholder="의제, 참가자 요청 사항 등을 입력하세요."
                />
              </div>
            </div>

            {formError && (
              <div className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-600">
                {formError}
              </div>
            )}
          </section>
        ) : (
          <section className="space-y-4">
            {events.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 bg-subtle/40 px-5 py-8 text-center text-sm text-muted">
                오늘은 여유로운 하루네요. 새 일정을 추가해보세요.
              </div>
            ) : (
              events.map((event) => {
                const source = calendarMap.get(event.categoryId);
                const isEditingEvent = editingEventId === event.id;

                return (
                  <div
                    key={event.id}
                    className={`relative flex gap-4 rounded-2xl border p-4 text-sm shadow-sm transition ${
                      isEditingEvent
                        ? "border-brand/60 bg-brand/10"
                        : "border-border/80 bg-background/95 hover:border-brand/40"
                    }`}
                  >
                    <div className="flex flex-shrink-0 flex-col items-center gap-2 pt-1 text-muted">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: source?.color ?? "#2563eb" }}
                      />
                      <div className="h-full w-px rounded-full bg-border/60" />
                    </div>

                    <div className="flex w-full flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="font-semibold text-foreground">{event.title}</div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                            <span className="inline-flex items-center gap-1">
                              <Clock size={12} />
                              {renderDuration(event)}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays size={12} />
                              {source?.name ?? "캘린더"}
                            </span>
                          </div>
                          {isEditingEvent && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2 py-[2px] text-[10px] font-semibold text-brand">
                              <Sparkles size={12} />
                              수정 중
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onRequestEdit(event)}
                            disabled={isEditingEvent}
                            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted transition hover:bg-subtle/60 disabled:opacity-60"
                          >
                            <Pencil size={12} />
                            {isEditingEvent ? "수정 중" : "수정"}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteEvent(event.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted transition hover:bg-subtle/60"
                          >
                            <Trash2 size={12} />
                            삭제
                          </button>
                        </div>
                      </div>

                      {(event.location || event.description) && (
                        <div className="space-y-1 rounded-lg bg-subtle/40 px-3 py-2 text-xs text-muted">
                          {event.location && (
                            <div className="inline-flex items-center gap-1">
                              <MapPin size={12} />
                              {event.location}
                            </div>
                          )}
                          {event.description && (
                            <p className="leading-relaxed text-foreground/70">{event.description}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </section>
        )}
      </main>
    </div>
  );
}
