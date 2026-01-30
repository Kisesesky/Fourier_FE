"use client";

import { endOfMonth, parseISO, startOfMonth } from "date-fns";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { COLOR_PALETTE } from "@/workspace/calendar/_model/mocks";
import { toDateKey } from "@/workspace/calendar/_model/utils";
import { useCalendarState } from "@/workspace/calendar/_model/hooks/useCalendarState";
import type { CalendarEvent, EventDraft, ViewMode, CalendarSource } from "@/workspace/calendar/_model/types";
import { useWorkspacePath } from "@/hooks/useWorkspacePath";
import { CalendarHeader } from "./components/CalendarHeader";
import { CalendarMonthView } from "./components/CalendarMonthView";
import { CalendarTimelineView } from "./components/CalendarTimelineView";
import { AgendaView } from "./components/AgendaView";
import { CalendarDetailsPanel } from "./components/CalendarDetailsPanel";
import { CalendarCreateModal } from "./components/CalendarCreateModal";
import { CalendarManageModal } from "./components/CalendarManageModal";
import Drawer from "@/components/ui/Drawer";

const MAX_VISIBLE_EVENTS_PER_DAY = 2;

export default function CalendarView({
  initialDate = new Date(),
  initialView = "month",
  focusCalendarId,
}: {
  initialDate?: Date;
  initialView?: ViewMode;
  focusCalendarId?: string;
}) {
  const {
    current,
    selectedDate,
    setSelectedDate,
    view,
    setView,
    calendars,
    events,
    searchTerm,
    setSearchTerm,
    isFormOpen,
    formError,
    setFormError,
    draft,
    setDraft,
    editingEventId,
    showCalendarForm,
    setShowCalendarForm,
    newCalendarName,
    setNewCalendarName,
    newCalendarColor,
    setNewCalendarColor,
    calendarFormError,
    calendarMap,
    filteredEvents,
    eventsByDate,
    monthDays,
    goPrev,
    goNext,
    goToday,
    handleToggleCalendar,
    handleAddCalendar,
    handleUpdateCalendar,
    handleDeleteCalendar,
    openForm,
    openEditForm,
    handleSubmitEvent,
    handleDeleteEvent,
    closeForm,
  } = useCalendarState(initialDate, initialView);
  const router = useRouter();
  const { buildHref } = useWorkspacePath();

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [manageCalendarId, setManageCalendarId] = useState<string | null>(null);
  const [manageName, setManageName] = useState("");
  const [manageColor, setManageColor] = useState("#0c66e4");
  const [manageError, setManageError] = useState<string | null>(null);

  const monthStart = useMemo(() => startOfMonth(current), [current]);
  const monthEnd = useMemo(() => endOfMonth(current), [current]);

  const focusedCalendar = useMemo(
    () => calendars.find((calendar) => calendar.id === focusCalendarId),
    [calendars, focusCalendarId],
  );

  const scopedCalendars = useMemo(() => {
    if (!focusedCalendar) return calendars;
    return [{ ...focusedCalendar, visible: true }];
  }, [calendars, focusedCalendar]);

  const scopedCalendarMap = useMemo(() => {
    const map = new Map<string, CalendarSource>();
    scopedCalendars.forEach((calendar) => map.set(calendar.id, calendar));
    return map;
  }, [scopedCalendars]);

  const scopedFilteredEvents = useMemo(() => {
    if (!focusCalendarId) return filteredEvents;
    const keyword = searchTerm.trim().toLowerCase();
    return events
      .filter((event) => scopedCalendarMap.get(event.calendarId)?.visible)
      .filter((event) => {
        if (!keyword) return true;
        const haystack = `${event.title} ${event.location ?? ""} ${event.description ?? ""}`.toLowerCase();
        return haystack.includes(keyword);
      })
      .sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime());
  }, [events, filteredEvents, focusCalendarId, scopedCalendarMap, searchTerm]);

  const scopedEventsByDate = useMemo(() => {
    if (!focusCalendarId) return eventsByDate;
    const map = new Map<string, CalendarEvent[]>();
    scopedFilteredEvents.forEach((event) => {
      const key = toDateKey(parseISO(event.start));
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    });
    return map;
  }, [eventsByDate, focusCalendarId, scopedFilteredEvents]);

  useEffect(() => {
    if (!focusCalendarId) return;
    if (!calendars.some((calendar) => calendar.id === focusCalendarId)) return;
    setDraft((prev) => ({ ...prev, calendarId: focusCalendarId }));
  }, [calendars, focusCalendarId, setDraft]);

  const agendaEvents = useMemo(
    () =>
      scopedFilteredEvents.filter((event) => {
        const start = parseISO(event.start);
        const end = event.end ? parseISO(event.end) : start;
        return end >= monthStart && start <= monthEnd;
      }),
    [scopedFilteredEvents, monthStart, monthEnd],
  );

  const selectedKey = toDateKey(selectedDate);
  const selectedEvents = scopedEventsByDate.get(selectedKey) ?? [];

  const handleChangeDraft = (patch: Partial<EventDraft>) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      if (patch.startDate && next.endDate < patch.startDate) {
        next.endDate = patch.startDate;
      }
      if (patch.endDate && patch.endDate < next.startDate) {
        next.endDate = next.startDate;
      }
      if (patch.allDay === true) {
        next.startTime = "";
        next.endTime = "";
      }
      if (patch.allDay === false) {
        next.startTime = next.startTime || "09:00";
        next.endTime = next.endTime || "10:00";
      }
      return next;
    });
    setFormError(null);
  };

  const handleRequestNewCalendar = () => {
    if (!showCalendarForm) {
      const nextColor =
        COLOR_PALETTE[calendars.length % COLOR_PALETTE.length] ?? COLOR_PALETTE[0] ?? "#0c66e4";
      setNewCalendarColor(nextColor);
      setNewCalendarName("");
    }
    setShowCalendarForm(true);
  };

  const handleSubmitCalendar = async () => {
    const created = await handleAddCalendar();
    if (created?.id) {
      router.push(buildHref(["calendar", created.id], `/calendar/${created.id}`));
    }
  };

  const handleNavigateCalendar = (id: string) => {
    if (id === "all") {
      router.push(buildHref("calendar", "/calendar"));
      return;
    }
    router.push(buildHref(["calendar", id], `/calendar/${id}`));
  };

  useEffect(() => {
    const handler = () => handleRequestNewCalendar();
    window.addEventListener("calendar:open-create", handler);
    return () => window.removeEventListener("calendar:open-create", handler);
  }, [handleRequestNewCalendar]);

  const handleCancelNewCalendar = () => {
    setShowCalendarForm(false);
    setNewCalendarName("");
    setNewCalendarColor(COLOR_PALETTE[0] ?? "#0c66e4");
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    if (isFormOpen) {
      const key = toDateKey(date);
      setDraft((prev) => {
        const adjustedEnd = prev.endDate < key ? key : prev.endDate;
        return { ...prev, startDate: key, endDate: adjustedEnd };
      });
    }
  };

  const handleRequestDetails = (date?: Date) => {
    if (date) {
      setSelectedDate(date);
    }
    setDetailsOpen(true);
  };

  const handleOpenForm = (date: Date) => {
    setDetailsOpen(true);
    openForm(date);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setDetailsOpen(true);
    openEditForm(event);
  };

  const handleCloseForm = () => {
    closeForm();
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    closeForm();
  };

  const handleOpenManageCalendar = (calendar: CalendarSource) => {
    setManageCalendarId(calendar.id);
    setManageName(calendar.name);
    setManageColor(calendar.color);
    setManageError(null);
    setManageOpen(true);
  };

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string; name?: string; color?: string }>).detail;
      if (!detail?.id) return;
      const calendar = calendars.find((item) => item.id === detail.id);
      if (calendar) {
        handleOpenManageCalendar(calendar);
        return;
      }
      handleOpenManageCalendar({
        id: detail.id,
        name: detail.name ?? "캘린더",
        color: detail.color ?? "#0c66e4",
        visible: true,
      });
    };
    window.addEventListener("calendar:open-manage", handler);
    return () => window.removeEventListener("calendar:open-manage", handler);
  }, [calendars, handleOpenManageCalendar]);

  const handleSubmitManageCalendar = () => {
    if (!manageCalendarId) return;
    const nextName = manageName.trim();
    if (!nextName) {
      setManageError("이름을 입력해주세요.");
      return;
    }
    handleUpdateCalendar(manageCalendarId, { name: nextName, color: manageColor });
    setManageOpen(false);
  };

  const handleDeleteManageCalendar = () => {
    if (!manageCalendarId) return;
    handleDeleteCalendar(manageCalendarId);
    setManageOpen(false);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <CalendarHeader
        current={current}
        view={view}
        searchTerm={searchTerm}
        calendars={calendars}
        calendarMap={scopedCalendarMap}
        focusedCalendar={focusedCalendar}
        hideCalendarList={Boolean(focusCalendarId)}
        onNavigateCalendar={handleNavigateCalendar}
        onSearch={setSearchTerm}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
        onChangeView={setView}
        onOpenCreate={() => handleOpenForm(selectedDate)}
        onToggleCalendar={focusCalendarId ? () => {} : handleToggleCalendar}
        onRequestNewCalendar={handleRequestNewCalendar}
        onRequestManageCalendar={handleOpenManageCalendar}
      />

      <div className="relative flex min-h-0 flex-1 flex-col">
        <section className="flex min-h-0 flex-1 flex-col px-4 py-4">
          <div className="flex-1 overflow-auto scrollbar-thin">
            {view === "agenda" ? (
              <AgendaView
                current={current}
                events={agendaEvents}
                calendarMap={scopedCalendarMap}
                onRequestCreate={handleOpenForm}
                onRequestEdit={handleEditEvent}
                onDeleteEvent={handleDeleteEvent}
              />
            ) : view === "month" ? (
              <CalendarMonthView
                current={current}
                selectedDate={selectedDate}
                days={monthDays}
                eventsByDate={scopedEventsByDate}
                calendarMap={scopedCalendarMap}
                maxVisible={MAX_VISIBLE_EVENTS_PER_DAY}
                onSelectDate={handleSelectDate}
                onRequestDetails={handleRequestDetails}
              />
            ) : (
              <CalendarTimelineView
                current={current}
                events={scopedFilteredEvents}
                calendarMap={scopedCalendarMap}
                onRequestCreate={handleOpenForm}
                onSelectDate={handleSelectDate}
                onRequestDetails={handleRequestDetails}
                editingEventId={editingEventId}
              />
            )}
          </div>
        </section>

        {detailsOpen && (
          <div className="pointer-events-none hidden md:block">
            <div className="pointer-events-auto fixed bottom-6 right-6 top-[calc(64px+16px)] z-40 w-[360px]">
              <div className="h-full overflow-hidden rounded-2xl border border-border bg-panel shadow-2xl">
                <CalendarDetailsPanel
                  selectedDate={selectedDate}
                  events={selectedEvents}
                  calendars={scopedCalendars}
                  calendarMap={scopedCalendarMap}
                  draft={draft}
                  isFormOpen={isFormOpen}
                  formError={formError}
                  editingEventId={editingEventId}
                  onChangeDraft={handleChangeDraft}
                  onRequestCreate={() => handleOpenForm(selectedDate)}
                  onRequestEdit={handleEditEvent}
                  onCancelCreate={handleCloseForm}
                  onSubmit={handleSubmitEvent}
                  onDeleteEvent={handleDeleteEvent}
                  onClose={handleCloseDetails}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <Drawer
        open={detailsOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDetails();
          }
        }}
        title="선택한 날짜"
        side="right"
        width={360}
      >
        <CalendarDetailsPanel
          selectedDate={selectedDate}
          events={selectedEvents}
          calendars={scopedCalendars}
          calendarMap={scopedCalendarMap}
          draft={draft}
          isFormOpen={isFormOpen}
          formError={formError}
          editingEventId={editingEventId}
          onChangeDraft={handleChangeDraft}
          onRequestCreate={() => handleOpenForm(selectedDate)}
          onRequestEdit={handleEditEvent}
          onCancelCreate={handleCloseForm}
          onSubmit={handleSubmitEvent}
          onDeleteEvent={handleDeleteEvent}
          onClose={handleCloseDetails}
        />
    </Drawer>

      <CalendarCreateModal
        open={showCalendarForm}
        name={newCalendarName}
        color={newCalendarColor}
        error={calendarFormError}
        onChangeName={setNewCalendarName}
        onChangeColor={setNewCalendarColor}
        onSubmit={handleSubmitCalendar}
        onCancel={handleCancelNewCalendar}
      />

      <CalendarManageModal
        open={manageOpen}
        name={manageName}
        color={manageColor}
        error={manageError}
        onChangeName={setManageName}
        onChangeColor={setManageColor}
        onSubmit={handleSubmitManageCalendar}
        onDelete={handleDeleteManageCalendar}
        onClose={() => setManageOpen(false)}
      />
    </div>
  );
}
