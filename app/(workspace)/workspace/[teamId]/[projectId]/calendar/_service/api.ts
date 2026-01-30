import api from "@/lib/api";
import type { CalendarEvent, CalendarSource } from "@/workspace/calendar/_model/types";

const DEFAULT_PROJECT_ID = process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID;

type CalendarEventResponse = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  location?: string | null;
  memo?: string | null;
  category: { id: string; name: string; categoryColor: string };
};

type CalendarCategoryResponse = {
  id: string;
  name: string;
  categoryColor?: string;
  color?: string;
};

const toEvent = (event: CalendarEventResponse): CalendarEvent => {
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);
  const isAllDay = start.getHours() === 0 && start.getMinutes() === 0 && end.getHours() === 23 && end.getMinutes() >= 59;
  return {
    id: event.id,
    calendarId: event.category.id,
    title: event.title,
    start: event.startAt,
    end: event.endAt,
    allDay: isAllDay,
    location: event.location ?? undefined,
    description: event.memo ?? undefined,
  };
};

const toCalendar = (category: CalendarCategoryResponse): CalendarSource => ({
  id: category.id,
  name: category.name,
  color: category.categoryColor ?? category.color ?? "#3b82f6",
  visible: true,
});

export async function getCalendarEvents(params: { start?: string | null; end?: string | null; projectId?: string }) {
  const { start, end, projectId } = params;
  const pid = projectId || DEFAULT_PROJECT_ID;
  if (!pid) {
    return { events: [] as CalendarEvent[], start, end };
  }
  const query = new URLSearchParams();
  if (start) query.set("start", start);
  if (end) query.set("end", end);
  const res = await api.get<CalendarEventResponse[]>(`/projects/${pid}/calendar/events${query.toString() ? `?${query}` : ""}`);
  const data = res.data ?? [];
  return {
    events: data.map(toEvent),
    start,
    end,
  };
}

export async function getCalendarCategories(projectId: string) {
  const res = await api.get<CalendarCategoryResponse[]>(`/projects/${projectId}/calendar/categories`);
  return (res.data ?? []).map(toCalendar);
}

export async function createCalendarCategory(projectId: string, payload: { name: string; color?: string }) {
  const res = await api.post<CalendarCategoryResponse>(`/projects/${projectId}/calendar/categories`, payload);
  return toCalendar(res.data);
}

export async function updateCalendarCategory(projectId: string, categoryId: string, payload: { name?: string; color?: string }) {
  const res = await api.patch<CalendarCategoryResponse>(`/projects/${projectId}/calendar/categories/${categoryId}`, payload);
  return toCalendar(res.data);
}

export async function deleteCalendarCategory(projectId: string, categoryId: string) {
  await api.delete(`/projects/${projectId}/calendar/categories/${categoryId}`);
}

export async function createCalendarEvent(
  projectId: string,
  payload: { title: string; categoryId: string; startAt: string; endAt: string; location?: string; memo?: string }
) {
  const res = await api.post<CalendarEventResponse>(`/projects/${projectId}/calendar/events`, payload);
  return toEvent(res.data);
}

export async function updateCalendarEvent(
  projectId: string,
  eventId: string,
  payload: { title?: string; categoryId?: string; startAt?: string; endAt?: string; location?: string; memo?: string }
) {
  const res = await api.patch<CalendarEventResponse>(`/projects/${projectId}/calendar/events/${eventId}`, payload);
  return toEvent(res.data);
}

export async function deleteCalendarEvent(projectId: string, eventId: string) {
  await api.delete(`/projects/${projectId}/calendar/events/${eventId}`);
}

export async function getCalendarAnalytics(
  projectId: string,
  params: { granularity: "hourly" | "daily" | "monthly"; date?: string; month?: string; year?: string }
) {
  const query = new URLSearchParams();
  query.set("granularity", params.granularity);
  if (params.date) query.set("date", params.date);
  if (params.month) query.set("month", params.month);
  if (params.year) query.set("year", params.year);
  const res = await api.get<{ counts: number[]; granularity: string }>(`/projects/${projectId}/calendar/analytics?${query.toString()}`);
  return res.data;
}
