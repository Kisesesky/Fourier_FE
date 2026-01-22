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

import { COLOR_PALETTE, DEFAULT_CALENDARS, DEFAULT_EVENTS } from "@/workspace/calendar/_model/mocks";
import { persistStorage, readStorage, toDateKey } from "@/workspace/calendar/_model/utils";
import type { CalendarEvent, CalendarSource, EventDraft, ViewMode } from "@/workspace/calendar/_model/types";

const CAL_STORAGE_KEY = "fd.calendar.calendars";
const EVENT_STORAGE_KEY = "fd.calendar.events";

const createDraft = (date: string, calendarId?: string): EventDraft => ({
  title: "",
  calendarId: calendarId ?? "",
  startDate: date,
  endDate: date,
  allDay: true,
  startTime: "09:00",
  endTime: "10:00",
  location: "",
  description: "",
});

export function useCalendarState(initialDate: Date, initialView: ViewMode) {
  const [current, setCurrent] = useState<Date>(initialDate);
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [view, setView] = useState<ViewMode>(initialView);
  const [calendars, setCalendars] = useState<CalendarSource[]>(() =>
    readStorage(CAL_STORAGE_KEY, DEFAULT_CALENDARS),
  );
  const [events, setEvents] = useState<CalendarEvent[]>(() =>
    readStorage(EVENT_STORAGE_KEY, DEFAULT_EVENTS),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [draft, setDraft] = useState<EventDraft>(() =>
    createDraft(toDateKey(initialDate), DEFAULT_CALENDARS[0]?.id),
  );
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [showCalendarForm, setShowCalendarForm] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState("");
  const [newCalendarColor, setNewCalendarColor] = useState<string>(COLOR_PALETTE[0] ?? "#0c66e4");

  useEffect(() => {
    persistStorage(CAL_STORAGE_KEY, calendars);
  }, [calendars]);

  useEffect(() => {
    persistStorage(EVENT_STORAGE_KEY, events);
  }, [events]);

  useEffect(() => {
    if (!calendars.some((calendar) => calendar.id === draft.calendarId)) {
      setDraft((prev) => createDraft(prev.startDate, calendars[0]?.id));
    }
  }, [calendars, draft.calendarId]);

  const calendarMap = useMemo(() => {
    const map = new Map<string, CalendarSource>();
    calendars.forEach((calendar) => map.set(calendar.id, calendar));
    return map;
  }, [calendars]);

  const filteredEvents = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return events
      .filter((event) => calendarMap.get(event.calendarId)?.visible)
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
      const key = toDateKey(parseISO(event.start));
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    });
    return map;
  }, [filteredEvents]);

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(current), { locale: ko });
    const end = endOfWeek(endOfMonth(current), { locale: ko });
    return eachDayOfInterval({ start, end });
  }, [current]);

  const upcomingEvents = useMemo(() => {
    const today = startOfDay(new Date());
    return filteredEvents.filter((event) => isAfter(parseISO(event.start), today)).slice(0, 6);
  }, [filteredEvents]);

  const goPrev = () => setCurrent((prev) => subMonths(prev, 1));
  const goNext = () => setCurrent((prev) => addMonths(prev, 1));
  const goToday = () => {
    const today = new Date();
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

  const handleAddCalendar = () => {
    const name = newCalendarName.trim();
    if (!name) {
      setShowCalendarForm(false);
      setNewCalendarName("");
      return;
    }

    const id = `calendar-${Date.now()}`;
    const color =
      newCalendarColor || COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)] || "#0c66e4";

    setCalendars((prev) => [...prev, { id, name, color, visible: true }]);
    setNewCalendarName("");
    setShowCalendarForm(false);
    const nextIndex = (calendars.length + 1) % COLOR_PALETTE.length;
    setNewCalendarColor(COLOR_PALETTE[nextIndex] ?? COLOR_PALETTE[0] ?? "#0c66e4");
  };

  const handleUpdateCalendar = (id: string, patch: Partial<CalendarSource>) => {
    setCalendars((prev) =>
      prev.map((calendar) => (calendar.id === id ? { ...calendar, ...patch } : calendar)),
    );
  };

  const handleDeleteCalendar = (id: string) => {
    setCalendars((prev) => prev.filter((calendar) => calendar.id !== id));
    setEvents((prev) => prev.filter((event) => event.calendarId !== id));
  };

  const openForm = (date: Date) => {
    const dateKey = toDateKey(date);
    const fallback = calendars.find((calendar) => calendar.visible)?.id ?? calendars[0]?.id ?? "";
    setDraft(createDraft(dateKey, fallback));
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

  const handleSubmitEvent = () => {
    if (!draft.title.trim()) {
      setFormError("제목을 입력해주세요.");
      return;
    }
    if (!draft.calendarId) {
      setFormError("캘린더를 선택해주세요.");
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
      title: draft.title.trim(),
      start: startIso,
      end: endIso,
      allDay: draft.allDay,
      location: draft.location.trim() || undefined,
      description: draft.description.trim() || undefined,
    };

    if (editingEventId) {
      setEvents((prev) =>
        prev.map((event) => (event.id === editingEventId ? { ...event, ...updatedFields } : event)),
      );
    } else {
      const newEvent: CalendarEvent = {
        id: crypto.randomUUID?.() ?? `event-${Date.now()}`,
        ...updatedFields,
      };
      setEvents((prev) => [...prev, newEvent]);
    }
    setSelectedDate(parseISO(startIso));
    setIsFormOpen(false);
    setFormError(null);
    setEditingEventId(null);
  };
  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== id));
    setEditingEventId((currentId) => (currentId === id ? null : currentId));
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
    newCalendarColor,
    setNewCalendarColor,
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
    openForm,
    openEditForm,
    handleSubmitEvent,
    handleDeleteEvent,
    editingEventId,
    closeForm,
  };
}
