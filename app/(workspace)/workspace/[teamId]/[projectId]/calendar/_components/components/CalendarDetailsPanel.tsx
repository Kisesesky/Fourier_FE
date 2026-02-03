"use client";

import { format, isSameDay, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarDays, Clock, FilePenLine, MapPin, MoreHorizontal, Plus, Sparkles } from "lucide-react";
import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";

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
  variant?: "panel" | "modal";
};

const labelClass = "text-[11px] font-semibold uppercase tracking-[0.08em] text-muted";

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
  variant = "panel",
}: CalendarDetailsPanelProps) {
  const isEditing = Boolean(editingEventId);
  const selectedLabel = format(selectedDate, "M월 d일 (EEE)", { locale: ko });
  const [menuState, setMenuState] = useState<{ id: string; x?: number; y?: number } | null>(null);
  const wrapperClassName =
    variant === "modal"
      ? "flex h-full w-full flex-col overflow-hidden"
      : "ml-auto flex h-full w-full flex-col overflow-hidden rounded-t-3xl border-t border-border bg-panel/85 backdrop-blur md:rounded-none md:border-l md:border-t-0 md:w-[360px]";

  const handleChange =
    (key: keyof EventDraft) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value =
        event.target.type === "checkbox"
          ? (event.target as HTMLInputElement).checked
          : event.target.value;
      onChangeDraft({ [key]: value } as Partial<EventDraft>);
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

  useEffect(() => {
    if (!menuState) return;
    const close = (event: MouseEvent) => {
      if (event.button === 2) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest?.("[data-event-menu]")) return;
      setMenuState(null);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [menuState]);

  return (
    <div className={wrapperClassName}>
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
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-semibold text-white">
              {isEditing ? "일정 수정" : "일정 추가"}
            </span>
          </div>
          {!isFormOpen && events.length > 0 && (
            <p className="text-[11px] text-muted">가장 가까운 일정은 {renderDuration(events[0])} 입니다.</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isFormOpen && (
            <button
              type="button"
              onClick={() => {
                onCancelCreate();
                onClose?.();
              }}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs text-muted hover:bg-subtle/60"
            >
              닫기
            </button>
          )}
          {onClose && !isFormOpen && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs text-muted hover:bg-subtle/60"
              aria-label="닫기"
            >
              닫기
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-5 scrollbar-thin">
        {isFormOpen ? (
          <section className="space-y-4">
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

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  onCancelCreate();
                  onClose?.();
                }}
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
          </section>
        ) : (
          <section className="space-y-4">
            {events.length === 0 ? (
              <button
                type="button"
                onClick={onRequestCreate}
                className="group w-full rounded-xl border border-dashed border-border/60 bg-subtle/40 px-5 py-8 text-center text-sm text-muted transition hover:border-brand/40 hover:bg-subtle/60"
              >
                <div className="mx-auto mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-foreground/5 text-foreground/40 transition group-hover:text-foreground/60">
                  <Plus size={18} className="opacity-60" />
                </div>
                오늘은 여유로운 하루네요. 새 일정을 추가해보세요.
              </button>
            ) : (
              events.map((event) => {
                const source = calendarMap.get(event.categoryId);
                const isEditingEvent = editingEventId === event.id;

                return (
                  <div
                    key={event.id}
                    className={`group relative flex gap-4 rounded-2xl border p-4 text-sm shadow-sm transition ${
                      isEditingEvent
                        ? "border-brand/60 bg-brand/10"
                        : "border-border/80 bg-background/95 hover:border-brand/40"
                    }`}
                  >
                    <div className="flex w-full flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="grid flex-1 grid-cols-[auto,1fr] gap-2">
                          <div className="row-span-3 flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-subtle text-[10px] font-semibold text-foreground/70">
                            {event.createdBy?.avatarUrl ? (
                              <img
                                src={event.createdBy.avatarUrl}
                                alt={event.createdBy?.name ?? "User"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span>{event.createdBy?.name?.slice(0, 1) ?? "?"}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: source?.color ?? "#2563eb" }}
                            />
                            <span className="truncate">{event.title}</span>
                            <span
                              className="inline-flex items-center rounded-full px-2 py-[2px] text-[11px] font-semibold"
                              style={{
                                backgroundColor: source?.color ? `${source.color}1A` : "rgba(37,99,235,0.12)",
                                color: source?.color ?? "#2563eb",
                              }}
                            >
                              {source?.name ?? "캘린더"}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                            <span className="inline-flex items-center gap-1">
                              <Clock size={12} />
                              {renderDuration(event)}
                            </span>
                            {event.location && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin size={12} />
                                {event.location}
                              </span>
                            )}
                          </div>
                          <div className="flex items-start gap-2 text-xs text-foreground/70">
                            <FilePenLine size={12} className="mt-0.5 text-muted" />
                            <p className="leading-relaxed">{event.description ?? "메모 없음"}</p>
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
                            onClick={(eventInput) => {
                              eventInput.stopPropagation();
                              setMenuState((prev) =>
                                prev?.id === event.id && prev.x === undefined ? null : { id: event.id },
                              );
                            }}
                            onMouseDown={(eventInput) => eventInput.stopPropagation()}
                            className="invisible inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition group-hover:visible hover:bg-subtle/60 hover:text-foreground"
                            aria-label="일정 메뉴"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                    {menuState?.id === event.id && menuState.x === undefined && (
                      <div
                        className="absolute right-3 top-11 z-20 min-w-[140px] overflow-hidden rounded-md border border-border bg-panel text-sm shadow-lg"
                        data-event-menu
                        onMouseDown={(eventInput) => eventInput.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setMenuState(null);
                            onRequestEdit(event);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-foreground hover:bg-gray-300/60"
                        >
                          수정하기
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMenuState(null);
                            onDeleteEvent(event.id);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-rose-500 hover:bg-rose-500/40"
                        >
                          삭제하기
                        </button>
                      </div>
                    )}
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
