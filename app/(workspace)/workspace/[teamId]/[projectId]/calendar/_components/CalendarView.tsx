// app/(workspace)/workspace/[teamId]/[projectId]/calendar/_components/CalendarView.tsx
'use client';

import { endOfMonth, parseISO, startOfMonth, startOfDay } from "date-fns";
import { useMemo, useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

import { COLOR_PALETTE } from "@/workspace/calendar/_model/constants";
import { toDateKey, toZonedDate } from "@/workspace/calendar/_model/utils";
import { MAX_VISIBLE_EVENTS_PER_DAY } from "@/workspace/calendar/_model/view.constants";
import type { CalendarCategoryGroup } from "@/workspace/calendar/_model/view.types";
import { useCalendarState } from "@/workspace/calendar/_model/hooks/useCalendarState";
import type {
  CalendarEvent,
  CalendarManageTarget,
  CalendarMemberOption,
  CalendarType,
  EventDraft,
  ViewMode,
} from "@/workspace/calendar/_model/types";
import { useWorkspacePath } from "@/hooks/useWorkspacePath";
import { CalendarHeader } from "./CalendarHeader";
import { CalendarMonthView } from "./CalendarMonthView";
import { CalendarTimelineView } from "./CalendarTimelineView";
import { CalendarAgendaView } from "./CalendarAgendaView";
import { CalendarDetailsPanel } from "./CalendarDetailsPanel";
import { CalendarCreateModal } from "./CalendarCreateModal";
import { CalendarManageModal } from "./CalendarManageModal";
import Modal from "@/components/common/Modal";
import { fetchProjectMembers } from "@/lib/projects";
import { getCalendarMembers } from "@/workspace/calendar/_service/api";

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
    projectCalendars,
    calendarFolders,
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
    newCalendarType,
    setNewCalendarType,
    newCalendarColor,
    setNewCalendarColor,
    newCalendarMemberIds,
    setNewCalendarMemberIds,
    newCalendarFolderId,
    setNewCalendarFolderId,
    calendarFormError,
    calendarMap,
    filteredEvents,
    eventsByDate,
    monthDays,
    goPrev,
    goNext,
    goToday,
    handleAddCalendar,
    handleUpdateCalendar,
    handleDeleteCalendar,
    handleAddCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    openForm,
    openEditForm,
    handleSubmitEvent,
    handleDeleteEvent,
    closeForm,
    setCalendars,
  } = useCalendarState(initialDate, initialView, focusCalendarId);
  const router = useRouter();
  const { teamId, projectId } = useParams<{ teamId: string; projectId: string }>();
  const { buildHref } = useWorkspacePath();

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [manageCalendarId, setManageCalendarId] = useState<string | null>(null);
  const [manageName, setManageName] = useState("");
  const [manageColor, setManageColor] = useState("#0c66e4");
  const [manageError, setManageError] = useState<string | null>(null);
  const [manageType, setManageType] = useState<CalendarType>("TEAM");
  const [manageMemberIds, setManageMemberIds] = useState<string[]>([]);
  const [memberOptions, setMemberOptions] = useState<CalendarMemberOption[]>([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState<string>(COLOR_PALETTE[0] ?? "#0c66e4");

  useEffect(() => {
    if (newCalendarType !== "PRIVATE" && newCalendarMemberIds.length > 0) {
      setNewCalendarMemberIds([]);
    }
  }, [newCalendarMemberIds.length, newCalendarType, setNewCalendarMemberIds]);

  const monthStart = useMemo(() => startOfMonth(current), [current]);
  const monthEnd = useMemo(() => endOfMonth(current), [current]);

  const focusedCalendar = useMemo(
    () => projectCalendars.find((calendar) => calendar.id === focusCalendarId),
    [projectCalendars, focusCalendarId],
  );

  const agendaEvents = useMemo(
    () =>
      filteredEvents.filter((event) => {
        const start = parseISO(event.start);
        const end = event.end ? parseISO(event.end) : start;
        return end >= monthStart && start <= monthEnd;
      }),
    [filteredEvents, monthStart, monthEnd],
  );

  const selectedEvents = useMemo(() => {
    const target = startOfDay(toZonedDate(selectedDate.toISOString()));
    return filteredEvents.filter((event) => {
      const start = startOfDay(toZonedDate(event.start));
      const end = startOfDay(toZonedDate(event.end ?? event.start));
      return target >= start && target <= end;
    });
  }, [filteredEvents, selectedDate]);

  const groupedCategories = useMemo(() => {
    const map = new Map<string, CalendarCategoryGroup>();
    calendars.forEach((cat) => {
      const key = `${cat.name}||${cat.color}`;
      const entry = map.get(key);
      if (entry) {
        entry.visible = entry.visible || cat.visible;
      } else {
        map.set(key, { key, name: cat.name, color: cat.color, visible: cat.visible });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }, [calendars]);

  const handleToggleCategoryGroup = (key: string) => {
    const group = groupedCategories.find((item) => item.key === key);
    if (!group) return;
    const nextVisible = !group.visible;
    setCalendars((prev: typeof calendars) =>
      prev.map((cat) =>
        cat.name === group.name && cat.color === group.color
          ? { ...cat, visible: nextVisible }
          : cat,
      ),
    );
  };

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

  const handleRequestNewCalendar = (folderId?: string) => {
    if (!showCalendarForm) {
      const nextColor =
        COLOR_PALETTE[calendars.length % COLOR_PALETTE.length] ?? COLOR_PALETTE[0] ?? "#0c66e4";
      setNewCalendarColor(nextColor);
      setNewCalendarName("");
      setNewCalendarType("TEAM");
      setNewCalendarMemberIds([]);
      setNewCalendarFolderId(folderId ?? "");
    }
    setShowCalendarForm(true);
  };

  const handleOpenCategoryModal = () => {
    setNewCategoryName("");
    setNewCategoryColor(COLOR_PALETTE[0] ?? "#0c66e4");
    setCategoryModalOpen(true);
  };

  const handleSubmitCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    await handleAddCategory({ name, color: newCategoryColor });
    setCategoryModalOpen(false);
  };

  const handleSubmitCalendar = async () => {
    const created = await handleAddCalendar();
    if (created?.id) {
      router.push(buildHref(["calendar", created.id], `/calendar/${created.id}`));
    }
  };

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ folderId?: string }>).detail;
      handleRequestNewCalendar(detail?.folderId);
    };
    window.addEventListener("calendar:open-create", handler as EventListener);
    return () => window.removeEventListener("calendar:open-create", handler as EventListener);
  }, [handleRequestNewCalendar]);

  const handleCancelNewCalendar = () => {
    setShowCalendarForm(false);
    setNewCalendarName("");
    setNewCalendarType("TEAM");
    setNewCalendarColor(COLOR_PALETTE[0] ?? "#0c66e4");
    setNewCalendarMemberIds([]);
    setNewCalendarFolderId("");
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

  const handleOpenManageCalendar = (calendar: CalendarManageTarget) => {
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
      const calendar = projectCalendars.find((item) => item.id === detail.id);
      if (calendar) {
        handleOpenManageCalendar(calendar);
        setManageType(calendar.type);
        return;
      }
      handleOpenManageCalendar({
        id: detail.id,
        name: detail.name ?? "캘린더",
        color: detail.color ?? "#0c66e4",
      });
    };
    window.addEventListener("calendar:open-manage", handler);
    return () => window.removeEventListener("calendar:open-manage", handler);
  }, [projectCalendars, handleOpenManageCalendar]);

  const handleSubmitManageCalendar = () => {
    if (!manageCalendarId) return;
    const nextName = manageName.trim();
    if (!nextName) {
      setManageError("이름을 입력해주세요.");
      return;
    }
    handleUpdateCalendar(manageCalendarId, {
      name: nextName,
      color: manageColor,
      type: manageType,
      memberIds: manageType === "PRIVATE" ? manageMemberIds : undefined,
    });
    setManageOpen(false);
  };

  const handleDeleteManageCalendar = () => {
    if (!manageCalendarId) return;
    handleDeleteCalendar(manageCalendarId);
    setManageOpen(false);
  };

  useEffect(() => {
    if (!teamId || !projectId) return;
    if (!showCalendarForm && !manageOpen) return;
    let active = true;
    fetchProjectMembers(teamId, projectId)
      .then((data) => {
        if (!active) return;
        const mapped = (data ?? []).map((member: { userId: string; name: string; avatarUrl?: string | null }) => ({
          id: member.userId,
          name: member.name,
          avatarUrl: member.avatarUrl ?? null,
        }));
        setMemberOptions(mapped);
      })
      .catch(() => {
        if (!active) return;
        setMemberOptions([]);
      });
    return () => {
      active = false;
    };
  }, [teamId, projectId, showCalendarForm, manageOpen]);

  useEffect(() => {
    if (!manageOpen || !manageCalendarId || !projectId) return;
    let active = true;
    getCalendarMembers(projectId, manageCalendarId)
      .then((members) => {
        if (!active) return;
        setManageMemberIds((members ?? []).map((member) => member.userId));
      })
      .catch(() => {
        if (!active) return;
        setManageMemberIds([]);
      });
    return () => {
      active = false;
    };
  }, [manageCalendarId, manageOpen, projectId]);

  useEffect(() => {
    if (manageType !== "PRIVATE" && manageMemberIds.length > 0) {
      setManageMemberIds([]);
    }
  }, [manageMemberIds.length, manageType]);

  const toggleNewMember = (id: string) => {
    setNewCalendarMemberIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleManageMember = (id: string) => {
    setManageMemberIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <CalendarHeader
        current={current}
        view={view}
        searchTerm={searchTerm}
        categories={groupedCategories}
        focusedCalendar={focusedCalendar}
        onSearch={setSearchTerm}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
        onChangeView={setView}
        onOpenCreate={() => handleOpenForm(selectedDate)}
        onToggleCategoryGroup={handleToggleCategoryGroup}
        onAddCategory={focusCalendarId ? handleOpenCategoryModal : undefined}
      />

      <div className="relative flex min-h-0 flex-1 flex-col">
        <section className="flex min-h-0 flex-1 flex-col px-4 py-4">
          <div className="flex-1 overflow-auto scrollbar-thin">
            {view === "agenda" ? (
              <CalendarAgendaView
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

      </div>
      <Modal
        open={detailsOpen}
        onClose={handleCloseDetails}
        widthClass="max-w-[560px]"
        bodyClassName="p-0"
        hideHeader
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
          variant="modal"
        />
      </Modal>

      <CalendarCreateModal
        open={showCalendarForm}
        name={newCalendarName}
        type={newCalendarType}
        color={newCalendarColor}
        error={calendarFormError}
        folderOptions={calendarFolders}
        folderId={newCalendarFolderId}
        memberOptions={memberOptions}
        memberIds={newCalendarMemberIds}
        onChangeName={setNewCalendarName}
        onChangeType={setNewCalendarType}
        onChangeColor={setNewCalendarColor}
        onChangeFolder={setNewCalendarFolderId}
        onToggleMember={toggleNewMember}
        onSubmit={handleSubmitCalendar}
        onCancel={handleCancelNewCalendar}
      />

      <CalendarManageModal
        open={manageOpen}
        name={manageName}
        type={manageType}
        color={manageColor}
        categories={calendars}
        memberOptions={memberOptions}
        memberIds={manageMemberIds}
        error={manageError}
        onChangeName={setManageName}
        onChangeType={setManageType}
        onChangeColor={setManageColor}
        onToggleMember={toggleManageMember}
        onAddCategory={handleAddCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
        onSubmit={handleSubmitManageCalendar}
        onDelete={handleDeleteManageCalendar}
        onClose={() => setManageOpen(false)}
      />

      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-[360px] rounded-xl border border-border bg-panel p-5 text-foreground shadow-xl">
            <h3 className="text-base font-semibold">카테고리 추가</h3>
            <p className="mt-1 text-xs text-muted">카테고리 이름과 색상을 설정하세요.</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-muted">이름</label>
                <input
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-panel px-3 py-2 text-sm text-foreground"
                  placeholder="예: 회의"
                />
              </div>

              <div>
                <label className="text-xs text-muted">색상</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCategoryColor(color)}
                      className={`h-6 w-6 rounded-md border ${
                        newCategoryColor === color ? "ring-2 ring-brand ring-offset-2 ring-offset-panel" : ""
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`색상 ${color}`}
                    />
                  ))}
                  <label className="group inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-2 py-1 text-xs text-muted hover:bg-subtle/60">
                    직접 선택
                    <input
                      type="color"
                      value={newCategoryColor}
                      onChange={(event) => setNewCategoryColor(event.target.value)}
                      className="h-6 w-10 cursor-pointer rounded border border-border"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                className="h-9 min-w-[88px] rounded-lg border border-border px-4 text-sm font-semibold text-muted hover:bg-sidebar-accent hover:text-foreground"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmitCategory}
                className="h-9 min-w-[88px] rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand/90"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
