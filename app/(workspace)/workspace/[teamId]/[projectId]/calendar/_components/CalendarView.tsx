"use client";

import { endOfMonth, parseISO, startOfMonth } from "date-fns";
import { useMemo, useState } from "react";

import { COLOR_PALETTE } from "@/workspace/calendar/_model/mocks";
import { toDateKey } from "@/workspace/calendar/_model/utils";
import { useCalendarState } from "@/workspace/calendar/_model/hooks/useCalendarState";
import type { CalendarEvent, EventDraft, ViewMode, CalendarSource } from "@/workspace/calendar/_model/types";
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
}: {
  initialDate?: Date;
  initialView?: ViewMode;
}) {
  const {
    current,
    selectedDate,
    setSelectedDate,
    view,
    setView,
    calendars,
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

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [manageCalendarId, setManageCalendarId] = useState<string | null>(null);
  const [manageName, setManageName] = useState("");
  const [manageColor, setManageColor] = useState("#0c66e4");
  const [manageError, setManageError] = useState<string | null>(null);

  const monthStart = useMemo(() => startOfMonth(current), [current]);
  const monthEnd = useMemo(() => endOfMonth(current), [current]);

  const agendaEvents = useMemo(
    () =>
      filteredEvents.filter((event) => {
        const start = parseISO(event.start);
        const end = event.end ? parseISO(event.end) : start;
        return end >= monthStart && start <= monthEnd;
      }),
    [filteredEvents, monthStart, monthEnd],
  );

  const selectedKey = toDateKey(selectedDate);
  const selectedEvents = eventsByDate.get(selectedKey) ?? [];

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
        calendarMap={calendarMap}
        onSearch={setSearchTerm}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
        onChangeView={setView}
        onOpenCreate={() => handleOpenForm(selectedDate)}
        onToggleCalendar={handleToggleCalendar}
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
                calendarMap={calendarMap}
                onRequestCreate={handleOpenForm}
                onRequestEdit={handleEditEvent}
                onDeleteEvent={handleDeleteEvent}
              />
            ) : view === "month" ? (
              <CalendarMonthView
                current={current}
                selectedDate={selectedDate}
                days={monthDays}
                eventsByDate={eventsByDate}
                calendarMap={calendarMap}
                maxVisible={MAX_VISIBLE_EVENTS_PER_DAY}
                onSelectDate={handleSelectDate}
                onRequestDetails={handleRequestDetails}
              />
            ) : (
              <CalendarTimelineView
                current={current}
                events={filteredEvents}
                calendarMap={calendarMap}
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
        calendars={calendars}
        calendarMap={calendarMap}
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
          calendars={calendars}
          calendarMap={calendarMap}
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
        onChangeName={setNewCalendarName}
        onChangeColor={setNewCalendarColor}
        onSubmit={handleAddCalendar}
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
