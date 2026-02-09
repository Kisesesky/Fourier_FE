import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ko } from "date-fns/locale";

import { COLOR_PALETTE } from "@/workspace/calendar/_model/mocks";
import { toDateKey, toZonedDate, toZonedDateKey } from "@/workspace/calendar/_model/utils";
import type { CalendarEvent, CalendarSource, EventDraft, ViewMode, ProjectCalendar } from "@/workspace/calendar/_model/types";
import { useParams } from "next/navigation";
import {
  createProjectCalendar,
  createCalendarCategory,
  createCalendarEvent,
  deleteProjectCalendar,
  deleteCalendarCategory,
  deleteCalendarEvent,
  getCalendarFolders,
  getCalendarCategories,
  getProjectCalendarCategories,
  getCalendarEvents,
  getProjectCalendars,
  updateProjectCalendar,
  updateCalendarCategory,
  updateCalendarEvent,
} from "@/workspace/calendar/_service/api";

const createDraft = (date: string, calendarId?: string, categoryId?: string): EventDraft => ({
  title: "",
  calendarId: calendarId ?? "",
  categoryId: categoryId ?? "",
  startDate: date,
  endDate: date,
  allDay: true,
  startTime: "09:00",
  endTime: "10:00",
  location: "",
  description: "",
});

export function useCalendarState(initialDate: Date, initialView: ViewMode, focusCalendarId?: string) {
  const { projectId } = useParams<{ projectId: string }>();
  const calendarTimeZone = "Asia/Seoul";
  const zonedInitial = toZonedDate(initialDate.toISOString(), calendarTimeZone);
  const [current, setCurrent] = useState<Date>(zonedInitial);
  const [selectedDate, setSelectedDate] = useState<Date>(zonedInitial);
  const [view, setView] = useState<ViewMode>(initialView);
  const [calendars, setCalendars] = useState<CalendarSource[]>([]);
  const [projectCalendars, setProjectCalendars] = useState<ProjectCalendar[]>([]);
  const [calendarFolders, setCalendarFolders] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>(focusCalendarId ?? "");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [draft, setDraft] = useState<EventDraft>(() =>
    createDraft(toDateKey(zonedInitial)),
  );
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [showCalendarForm, setShowCalendarForm] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState("");
  const [newCalendarType, setNewCalendarType] = useState<"TEAM" | "PERSONAL" | "PRIVATE">("TEAM");
  const [newCalendarColor, setNewCalendarColor] = useState<string>(COLOR_PALETTE[0] ?? "#0c66e4");
  const [newCalendarMemberIds, setNewCalendarMemberIds] = useState<string[]>([]);
  const [newCalendarFolderId, setNewCalendarFolderId] = useState<string>("");
  const [calendarFormError, setCalendarFormError] = useState<string | null>(null);

  const notifyCategoriesChanged = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event("calendar:categories:changed"));
  };

  useEffect(() => {
    if (focusCalendarId) {
      setSelectedCalendarId((prev) => (prev === focusCalendarId ? prev : focusCalendarId));
      return;
    }
    setSelectedCalendarId((prev) => (prev === "" ? prev : ""));
  }, [focusCalendarId]);

  useEffect(() => {
    if (!projectId) return;
    let mounted = true;
    const load = async () => {
      try {
        const [calendarsRes, folderRes] = await Promise.all([
          getProjectCalendars(projectId),
          getCalendarFolders(projectId),
        ]);
        if (!mounted) return;
        setProjectCalendars(calendarsRes ?? []);
        setCalendarFolders(folderRes ?? []);
        const fallbackCalendarId = focusCalendarId ?? calendarsRes?.[0]?.id ?? "";
        if (!fallbackCalendarId) {
          setCalendars([]);
          setEvents([]);
          return;
        }
        if (focusCalendarId && fallbackCalendarId !== selectedCalendarId) {
          setSelectedCalendarId(fallbackCalendarId);
        }
        if (!mounted) return;
      } catch {
        return;
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [focusCalendarId, projectId, selectedCalendarId]);

  useEffect(() => {
    if (!projectId) return;
    let mounted = true;
    const loadEvents = async () => {
      try {
        const res = await getCalendarEvents({
          projectId,
          calendarId: focusCalendarId ? selectedCalendarId || focusCalendarId : null,
        });
        if (!mounted) return;
        setEvents(res.events ?? []);
      } catch {
        if (!mounted) return;
        setEvents([]);
      }
    };
    void loadEvents();
    return () => {
      mounted = false;
    };
  }, [projectId, focusCalendarId, selectedCalendarId]);

  useEffect(() => {
    if (!projectId) return;
    let mounted = true;
    const loadCategories = async () => {
      try {
        let categoriesRes: CalendarSource[] = [];
        if (focusCalendarId) {
          categoriesRes = await getCalendarCategories(projectId, selectedCalendarId || focusCalendarId);
        } else {
          try {
            categoriesRes = await getProjectCalendarCategories(projectId);
          } catch {
            categoriesRes = [];
          }
          if (categoriesRes.length === 0) {
            const nonPersonalIds = (projectCalendars ?? [])
              .filter((calendar) => calendar.type !== "PERSONAL")
              .map((calendar) => calendar.id);
            const fallbackResults = await Promise.allSettled(
              nonPersonalIds.map((id) => getCalendarCategories(projectId, id)),
            );
            categoriesRes = fallbackResults
              .filter((res) => res.status === "fulfilled")
              .flatMap((res) => res.value);
          }
        }
        if (!mounted) return;
        const prevVisibility = new Map(calendars.map((cat) => [cat.id, cat.visible]));
        const mergedCategories = (categoriesRes ?? [])
          .map((cat) => ({
            ...cat,
            visible: prevVisibility.get(cat.id) ?? cat.visible,
          }))
          .sort((a, b) => a.name.localeCompare(b.name, "ko"));
        setCalendars(mergedCategories);
        if (mergedCategories.length > 0 && !draft.categoryId) {
          setDraft((prev) => createDraft(prev.startDate, selectedCalendarId || focusCalendarId || "", mergedCategories[0].id));
        }
      } catch {
        if (!mounted) return;
        setCalendars([]);
      }
    };
    void loadCategories();
    return () => {
      mounted = false;
    };
  }, [projectId, focusCalendarId, projectCalendars, selectedCalendarId]);

  useEffect(() => {
    if (!calendars.some((calendar) => calendar.id === draft.categoryId)) {
      setDraft((prev) => createDraft(prev.startDate, selectedCalendarId, calendars[0]?.id));
    }
  }, [calendars, draft.categoryId, selectedCalendarId]);

  useEffect(() => {
    if (!selectedCalendarId) return;
    if (draft.calendarId === selectedCalendarId) return;
    setDraft((prev) => ({ ...prev, calendarId: selectedCalendarId }));
  }, [draft.calendarId, selectedCalendarId]);

  const calendarMap = useMemo(() => {
    const map = new Map<string, CalendarSource>();
    calendars.forEach((calendar) => map.set(calendar.id, calendar));
    return map;
  }, [calendars]);

  const filteredEvents = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return events
      .filter((event) => calendarMap.get(event.categoryId)?.visible)
      .filter((event) => {
        if (!keyword) return true;
        const haystack = `${event.title} ${event.location ?? ""} ${event.description ?? ""}`.toLowerCase();
        return haystack.includes(keyword);
      })
      .sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime());
  }, [events, calendarMap, searchTerm]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    filteredEvents.forEach((event) => {
      const key = toZonedDateKey(event.start);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    });
    return map;
  }, [filteredEvents]);

  const monthDays = useMemo(() => {
    const zonedCurrent = toZonedDate(current.toISOString(), calendarTimeZone);
    const start = startOfWeek(startOfMonth(zonedCurrent), { locale: ko });
    const end = endOfWeek(endOfMonth(zonedCurrent), { locale: ko });
    return eachDayOfInterval({ start, end });
  }, [calendarTimeZone, current]);

  const upcomingEvents = useMemo(() => {
    const today = startOfDay(new Date());
    return filteredEvents.filter((event) => isAfter(parseISO(event.start), today)).slice(0, 6);
  }, [filteredEvents]);

  const goPrev = () => setCurrent((prev) => subMonths(prev, 1));
  const goNext = () => setCurrent((prev) => addMonths(prev, 1));
  const goToday = () => {
    const today = toZonedDate(new Date().toISOString(), calendarTimeZone);
    setCurrent(today);
    setSelectedDate(today);
  };

  const handleToggleCalendar = (id: string) => {
    setCalendars((prev) =>
      prev.map((calendar) =>
        calendar.id === id ? { ...calendar, visible: !calendar.visible } : calendar,
      ),
    );
  };

  const handleAddCalendar = async () => {
    const name = newCalendarName.trim();
    if (!name) {
      setShowCalendarForm(false);
      setNewCalendarName("");
      return null;
    }

    if (!projectId) return null;
    const color =
      newCalendarColor || COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)] || "#0c66e4";
    try {
      const created = await createProjectCalendar(projectId, {
        name,
        type: newCalendarType,
        color,
        memberIds: newCalendarType === "PRIVATE" ? newCalendarMemberIds : undefined,
        folderId: newCalendarFolderId || undefined,
      });
      setProjectCalendars((prev) => [...prev, created]);
      notifyCategoriesChanged();
      setCalendarFormError(null);
      setNewCalendarName("");
      setNewCalendarMemberIds([]);
      setNewCalendarFolderId("");
      setShowCalendarForm(false);
      const nextIndex = (calendars.length + 1) % COLOR_PALETTE.length;
      setNewCalendarColor(COLOR_PALETTE[nextIndex] ?? COLOR_PALETTE[0] ?? "#0c66e4");
      return created;
    } catch {
      return null;
    }
  };

  const handleUpdateCalendar = async (id: string, patch: Partial<ProjectCalendar> & { memberIds?: string[] }) => {
    if (!projectId) return;
    try {
      const updated = await updateProjectCalendar(projectId, id, {
        name: patch.name,
        color: patch.color,
        type: patch.type,
        memberIds: patch.memberIds,
      });
      setProjectCalendars((prev) =>
        prev.map((calendar) => (calendar.id === id ? { ...calendar, ...updated } : calendar)),
      );
      notifyCategoriesChanged();
    } catch {
      return;
    }
  };

  const handleDeleteCalendar = async (id: string) => {
    if (!projectId) return;
    try {
      await deleteProjectCalendar(projectId, id);
      setProjectCalendars((prev) => prev.filter((calendar) => calendar.id !== id));
      setEvents((prev) => prev.filter((event) => event.calendarId !== id));
      setCalendarFormError(null);
      notifyCategoriesChanged();
    } catch {
      return;
    }
  };

  const handleAddCategory = async (payload: { name: string; color?: string }) => {
    if (!projectId || !selectedCalendarId) return;
    try {
      const created = await createCalendarCategory(projectId, selectedCalendarId, payload);
      setCalendars((prev) => [...prev, created]);
      if (!draft.categoryId) {
        setDraft((curr) => ({ ...curr, categoryId: created.id }));
      }
      notifyCategoriesChanged();
    } catch {
      return;
    }
  };

  const handleUpdateCategory = async (id: string, patch: { name?: string; color?: string }) => {
    if (!projectId || !selectedCalendarId) return;
    try {
      const updated = await updateCalendarCategory(projectId, selectedCalendarId, id, patch);
      setCalendars((prev) => prev.map((cat) => (cat.id === id ? { ...cat, ...updated } : cat)));
      notifyCategoriesChanged();
    } catch {
      return;
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!projectId || !selectedCalendarId) return;
    try {
      await deleteCalendarCategory(projectId, selectedCalendarId, id);
      setCalendars((prev) => {
        const next = prev.filter((cat) => cat.id !== id);
        if (draft.categoryId === id) {
          setDraft((curr) => ({ ...curr, categoryId: next[0]?.id ?? "" }));
        }
        return next;
      });
      notifyCategoriesChanged();
    } catch {
      return;
    }
  };

  const openForm = (date: Date) => {
    const dateKey = toDateKey(date);
    const fallback = calendars.find((calendar) => calendar.visible)?.id ?? calendars[0]?.id ?? "";
    setDraft(createDraft(dateKey, selectedCalendarId, fallback));
    setFormError(null);
    setEditingEventId(null);
    setIsFormOpen(true);
    setSelectedDate(date);
  };

  const openEditForm = (event: CalendarEvent) => {
    const start = parseISO(event.start);
    const end = event.end ? parseISO(event.end) : start;
    setDraft({
      title: event.title,
      calendarId: event.calendarId,
      categoryId: event.categoryId,
      startDate: toDateKey(start),
      endDate: toDateKey(end),
      allDay: event.allDay,
      startTime: event.allDay ? "09:00" : format(start, "HH:mm"),
      endTime: event.allDay ? "10:00" : format(end, "HH:mm"),
      location: event.location ?? "",
      description: event.description ?? "",
    });
    setFormError(null);
    setEditingEventId(event.id);
    setIsFormOpen(true);
    setSelectedDate(start);
  };

  const handleSubmitEvent = async () => {
    if (!draft.title.trim()) {
      setFormError("제목을 입력해주세요.");
      return;
    }
    if (!draft.calendarId) {
      setFormError("캘린더를 선택해주세요.");
      return;
    }
    if (!draft.categoryId) {
      setFormError("카테고리를 선택해주세요.");
      return;
    }

    const startDate = draft.startDate;
    const endDate = draft.endDate || draft.startDate;

    if (parseISO(endDate) < parseISO(startDate)) {
      setFormError("종료 날짜는 시작 날짜 이후여야 합니다.");
      return;
    }

    if (!draft.allDay) {
      if (!draft.startTime || !draft.endTime) {
        setFormError("시작/종료 시간을 입력해주세요.");
        return;
      }
    }

    const startIso = draft.allDay
      ? `${startDate}T00:00:00`
      : `${startDate}T${draft.startTime}:00`;
    const endIso = draft.allDay
      ? `${endDate}T23:59:00`
      : `${endDate}T${draft.endTime}:00`;

    if (parseISO(endIso) <= parseISO(startIso)) {
      setFormError(draft.allDay ? "종료 날짜를 다시 확인해주세요." : "종료 시간은 시작 이후여야 합니다.");
      return;
    }

    const updatedFields = {
      calendarId: draft.calendarId,
      categoryId: draft.categoryId,
      title: draft.title.trim(),
      start: startIso,
      end: endIso,
      allDay: draft.allDay,
      location: draft.location.trim() || undefined,
      description: draft.description.trim() || undefined,
    };

    if (!projectId) return;
    if (editingEventId) {
      try {
        const updated = await updateCalendarEvent(projectId, editingEventId, {
          title: updatedFields.title,
          calendarId: updatedFields.calendarId,
          categoryId: updatedFields.categoryId,
          startAt: updatedFields.start,
          endAt: updatedFields.end ?? updatedFields.start,
          location: updatedFields.location,
          memo: updatedFields.description,
        });
        setEvents((prev) =>
          prev.map((event) => (event.id === editingEventId ? updated : event)),
        );
      } catch {
        return;
      }
    } else {
      try {
      const created = await createCalendarEvent(projectId, {
        title: updatedFields.title,
        calendarId: updatedFields.calendarId,
        categoryId: updatedFields.categoryId,
        startAt: updatedFields.start,
        endAt: updatedFields.end ?? updatedFields.start,
        location: updatedFields.location,
        memo: updatedFields.description,
      });
        setEvents((prev) => [...prev, created]);
      } catch {
        return;
      }
    }
    setSelectedDate(parseISO(startIso));
    setIsFormOpen(false);
    setFormError(null);
    setEditingEventId(null);
  };
  const handleDeleteEvent = async (id: string) => {
    if (!projectId) return;
    try {
      await deleteCalendarEvent(projectId, id);
      setEvents((prev) => prev.filter((event) => event.id !== id));
      setEditingEventId((currentId) => (currentId === id ? null : currentId));
    } catch {
      return;
    }
  };
  const closeForm = () => {
    setIsFormOpen(false);
    setFormError(null);
    setEditingEventId(null);
  };

  return {
    current,
    selectedDate,
    setSelectedDate,
    view,
    setView,
    calendars,
    setCalendars,
    projectCalendars,
    calendarFolders,
    selectedCalendarId,
    setSelectedCalendarId,
    events,
    setEvents,
    searchTerm,
    setSearchTerm,
    isFormOpen,
    setIsFormOpen,
    formError,
    setFormError,
    draft,
    setDraft,
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
    upcomingEvents,
    goPrev,
    goNext,
    goToday,
    handleToggleCalendar,
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
    editingEventId,
    closeForm,
  };
}
