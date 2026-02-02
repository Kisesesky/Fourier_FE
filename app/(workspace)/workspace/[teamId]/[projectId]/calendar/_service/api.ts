import api from "@/lib/api";
import type { CalendarEvent, CalendarSource, ProjectCalendar, CalendarFolder } from "@/workspace/calendar/_model/types";

const DEFAULT_PROJECT_ID = process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID;

type CalendarEventResponse = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  location?: string | null;
  memo?: string | null;
  calendarId?: string;
  category: { id: string; name: string; categoryColor: string };
};

type CalendarCategoryResponse = {
  id: string;
  name: string;
  categoryColor?: string;
  color?: string;
  calendarId?: string;
  isDefault?: boolean;
};

type CalendarResponse = {
  id: string;
  name: string;
  type: "TEAM" | "PERSONAL" | "PRIVATE";
  color: string;
  ownerId?: string | null;
  folderId?: string | null;
};

type CalendarFolderResponse = {
  id: string;
  name: string;
  createdById?: string | null;
  isActive?: boolean;
};

const toEvent = (event: CalendarEventResponse): CalendarEvent => {
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);
  const isAllDay = start.getHours() === 0 && start.getMinutes() === 0 && end.getHours() === 23 && end.getMinutes() >= 59;
  return {
    id: event.id,
    calendarId: event.calendarId ?? event.category.calendarId ?? "",
    categoryId: event.category.id,
    categoryName: event.category.name,
    categoryColor: event.category.categoryColor ?? event.category.color,
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
  calendarId: category.calendarId,
  isDefault: category.isDefault,
});

const toProjectCalendar = (calendar: CalendarResponse): ProjectCalendar => ({
  id: calendar.id,
  name: calendar.name,
  type: calendar.type,
  color: calendar.color ?? "#3b82f6",
  ownerId: calendar.ownerId ?? null,
  folderId: calendar.folderId ?? null,
});

const toCalendarFolder = (folder: CalendarFolderResponse): CalendarFolder => ({
  id: folder.id,
  name: folder.name,
  createdById: folder.createdById ?? null,
  isActive: folder.isActive ?? true,
});

export async function getCalendarEvents(params: { start?: string | null; end?: string | null; projectId?: string; calendarId?: string | null }) {
  const { start, end, projectId, calendarId } = params;
  const pid = projectId || DEFAULT_PROJECT_ID;
  if (!pid) {
    return { events: [] as CalendarEvent[], start, end };
  }
  const query = new URLSearchParams();
  if (start) query.set("start", start);
  if (end) query.set("end", end);
  if (calendarId) query.set("calendarId", calendarId);
  const res = await api.get<CalendarEventResponse[]>(`/projects/${pid}/calendar/events${query.toString() ? `?${query}` : ""}`);
  const data = res.data ?? [];
  return {
    events: data.map(toEvent),
    start,
    end,
  };
}

export async function getCalendarCategories(projectId: string, calendarId: string) {
  const res = await api.get<CalendarCategoryResponse[]>(`/projects/${projectId}/calendar/calendars/${calendarId}/categories`);
  return (res.data ?? []).map(toCalendar);
}

export async function getProjectCalendarCategories(projectId: string) {
  const res = await api.get<CalendarCategoryResponse[]>(`/projects/${projectId}/calendar/categories`);
  return (res.data ?? []).map(toCalendar);
}

export async function createCalendarCategory(projectId: string, calendarId: string, payload: { name: string; color?: string }) {
  const res = await api.post<CalendarCategoryResponse>(`/projects/${projectId}/calendar/calendars/${calendarId}/categories`, payload);
  return toCalendar(res.data);
}

export async function updateCalendarCategory(projectId: string, calendarId: string, categoryId: string, payload: { name?: string; color?: string }) {
  const res = await api.patch<CalendarCategoryResponse>(`/projects/${projectId}/calendar/calendars/${calendarId}/categories/${categoryId}`, payload);
  return toCalendar(res.data);
}

export async function deleteCalendarCategory(projectId: string, calendarId: string, categoryId: string) {
  await api.delete(`/projects/${projectId}/calendar/calendars/${calendarId}/categories/${categoryId}`);
}

export async function createCalendarEvent(
  projectId: string,
  payload: { title: string; calendarId: string; categoryId: string; startAt: string; endAt: string; location?: string; memo?: string }
) {
  const res = await api.post<CalendarEventResponse>(`/projects/${projectId}/calendar/events`, payload);
  return toEvent(res.data);
}

export async function updateCalendarEvent(
  projectId: string,
  eventId: string,
  payload: { title?: string; calendarId?: string; categoryId?: string; startAt?: string; endAt?: string; location?: string; memo?: string }
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

export async function getProjectCalendars(projectId: string) {
  const res = await api.get<CalendarResponse[]>(`/projects/${projectId}/calendar/calendars`);
  return (res.data ?? []).map(toProjectCalendar);
}

export async function getCalendarFolders(projectId: string) {
  const res = await api.get<CalendarFolderResponse[]>(`/projects/${projectId}/calendar/folders`);
  return (res.data ?? []).map(toCalendarFolder);
}

export async function createCalendarFolder(projectId: string, payload: { name: string }) {
  const res = await api.post<CalendarFolderResponse>(`/projects/${projectId}/calendar/folders`, payload);
  return toCalendarFolder(res.data);
}

export async function updateCalendarFolder(projectId: string, folderId: string, payload: { name?: string }) {
  const res = await api.patch<CalendarFolderResponse>(`/projects/${projectId}/calendar/folders/${folderId}`, payload);
  return toCalendarFolder(res.data);
}

export async function deleteCalendarFolder(projectId: string, folderId: string) {
  await api.delete(`/projects/${projectId}/calendar/folders/${folderId}`);
}

export async function createProjectCalendar(
  projectId: string,
  payload: { name: string; type: "TEAM" | "PERSONAL" | "PRIVATE"; color?: string; folderId?: string; memberIds?: string[] }
) {
  const res = await api.post<CalendarResponse>(`/projects/${projectId}/calendar/calendars`, payload);
  return toProjectCalendar(res.data);
}

export async function updateProjectCalendar(
  projectId: string,
  calendarId: string,
  payload: { name?: string; type?: "TEAM" | "PERSONAL" | "PRIVATE"; color?: string; folderId?: string | null; memberIds?: string[] }
) {
  const res = await api.patch<CalendarResponse>(`/projects/${projectId}/calendar/calendars/${calendarId}`, payload);
  return toProjectCalendar(res.data);
}

export async function deleteProjectCalendar(projectId: string, calendarId: string) {
  await api.delete(`/projects/${projectId}/calendar/calendars/${calendarId}`);
}

export async function getCalendarMembers(projectId: string, calendarId: string) {
  const res = await api.get<Array<{ userId: string; name: string; avatarUrl?: string | null; role?: string }>>(
    `/projects/${projectId}/calendar/calendars/${calendarId}/members`
  );
  return res.data ?? [];
}
