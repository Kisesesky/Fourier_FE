// app/(workspace)/workspace/[teamId]/[projectId]/calendar/_service/api.ts
import api from "@/lib/api";
import { z } from "zod";
import type {
  CalendarEvent,
  CalendarFolder,
  CalendarMemberRecord,
  CalendarSource,
  CalendarType,
  ProjectCalendar,
} from "@/workspace/calendar/_model/types";

const DEFAULT_PROJECT_ID = process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID;

type CalendarEventResponse = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  location?: string | null;
  memo?: string | null;
  calendarId?: string;
  categoryId?: string;
  category?: { id: string; name: string; categoryColor?: string; color?: string } | null;
  createdBy?: { id: string; name: string; avatarUrl?: string | null };
  sourceType?: "manual" | "issue";
  linkedIssueId?: string;
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
  type: CalendarType;
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

const pickArrayPayload = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const bag = payload as Record<string, unknown>;
  const candidates = [bag.data, bag.events, bag.items, bag.results, bag.list];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  if (bag.data && typeof bag.data === "object") {
    const nested = bag.data as Record<string, unknown>;
    const nestedCandidates = [nested.data, nested.events, nested.items, nested.results, nested.list];
    for (const candidate of nestedCandidates) {
      if (Array.isArray(candidate)) return candidate;
    }
  }

  return [];
};

const pickObjectPayload = (payload: unknown): Record<string, unknown> => {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const bag = payload as Record<string, unknown>;
    if (bag.data && typeof bag.data === "object" && !Array.isArray(bag.data)) {
      return bag.data as Record<string, unknown>;
    }
    return bag;
  }
  return {};
};

const CalendarEventResponseSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  title: z.string().optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  location: z.string().nullable().optional(),
  memo: z.string().nullable().optional(),
  calendarId: z.string().optional(),
  categoryId: z.string().optional(),
  category: z
    .object({
      id: z.string(),
      name: z.string(),
      categoryColor: z.string().optional(),
      color: z.string().optional(),
    })
    .passthrough()
    .nullable()
    .optional(),
  createdBy: z.object({ id: z.string(), name: z.string(), avatarUrl: z.string().nullable().optional() }).optional(),
  sourceType: z.enum(["manual", "issue"]).optional(),
  linkedIssueId: z.string().optional(),
}).passthrough();

const CalendarCategoryResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  categoryColor: z.string().optional(),
  color: z.string().optional(),
  calendarId: z.string().optional(),
  isDefault: z.boolean().optional(),
});

const CalendarResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.custom<CalendarType>(),
  color: z.string(),
  ownerId: z.string().nullable().optional(),
  folderId: z.string().nullable().optional(),
});

const CalendarFolderResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdById: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

const toEvent = (event: CalendarEventResponse): CalendarEvent => {
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);
  const isAllDay = start.getHours() === 0 && start.getMinutes() === 0 && end.getHours() === 23 && end.getMinutes() >= 59;
  return {
    id: event.id,
    calendarId: event.calendarId ?? "",
    categoryId: event.category?.id ?? event.categoryId ?? event.calendarId ?? "default",
    categoryName: event.category?.name ?? "기본",
    categoryColor: event.category?.categoryColor ?? event.category?.color ?? "#3b82f6",
    createdBy: event.createdBy
      ? { id: event.createdBy.id, name: event.createdBy.name, avatarUrl: event.createdBy.avatarUrl ?? null }
      : undefined,
    sourceType: event.sourceType,
    linkedIssueId: event.linkedIssueId,
    title: event.title,
    start: event.startAt,
    end: event.endAt,
    allDay: isAllDay,
    location: event.location ?? undefined,
    description: event.memo ?? undefined,
  };
};

const normalizeCalendarEventResponse = (input: unknown): CalendarEventResponse | null => {
  const parsed = CalendarEventResponseSchema.safeParse(input);
  const item = (parsed.success ? parsed.data : (input as any)) ?? {};
  const startAt = item.startAt ?? item.start ?? item.startDate;
  const endAt = item.endAt ?? item.end ?? item.endDate ?? startAt;
  const title = item.title ?? item.name ?? item.subject ?? "제목 없음";
  if (!startAt || !endAt) return null;
  const categoryRaw = item.category ?? null;
  const category =
    categoryRaw && typeof categoryRaw === "object"
      ? {
          id: String((categoryRaw as any).id ?? item.categoryId ?? item.calendarId ?? "default"),
          name: String((categoryRaw as any).name ?? "기본"),
          categoryColor: (categoryRaw as any).categoryColor ?? undefined,
          color: (categoryRaw as any).color ?? undefined,
        }
      : {
          id: String(item.categoryId ?? item.calendarId ?? "default"),
          name: "기본",
          categoryColor: undefined,
          color: undefined,
        };

  return {
    id: String(item.id ?? item.eventId ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    title: String(title),
    startAt: String(startAt),
    endAt: String(endAt),
    location: item.location ?? null,
    memo: item.memo ?? item.description ?? null,
    calendarId: item.calendarId ? String(item.calendarId) : undefined,
    categoryId: item.categoryId ? String(item.categoryId) : undefined,
    category,
    createdBy: item.createdBy
      ? {
          id: String(item.createdBy.id ?? ""),
          name: String(item.createdBy.name ?? "Unknown"),
          avatarUrl: item.createdBy.avatarUrl ?? null,
        }
      : undefined,
    sourceType: item.sourceType === "issue" ? "issue" : item.sourceType === "manual" ? "manual" : undefined,
    linkedIssueId: item.linkedIssueId ? String(item.linkedIssueId) : undefined,
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
  const res = await api.get<CalendarEventResponse[] | { data?: CalendarEventResponse[]; events?: CalendarEventResponse[] }>(
    `/projects/${pid}/calendar/events${query.toString() ? `?${query}` : ""}`,
  );
  const raw = pickArrayPayload(res.data);
  const data = raw
    .map((item) => normalizeCalendarEventResponse(item))
    .filter((item): item is CalendarEventResponse => item !== null);
  return {
    events: data.map(toEvent),
    start,
    end,
  };
}

export async function getCalendarCategories(projectId: string, calendarId: string) {
  const res = await api.get<CalendarCategoryResponse[] | { data?: CalendarCategoryResponse[]; items?: CalendarCategoryResponse[] }>(
    `/projects/${projectId}/calendar/calendars/${calendarId}/categories`,
  );
  const parsed = z.array(CalendarCategoryResponseSchema).safeParse(pickArrayPayload(res.data));
  return (parsed.success ? parsed.data : []).map(toCalendar);
}

export async function getProjectCalendarCategories(projectId: string) {
  const res = await api.get<CalendarCategoryResponse[] | { data?: CalendarCategoryResponse[]; items?: CalendarCategoryResponse[] }>(
    `/projects/${projectId}/calendar/categories`,
  );
  const parsed = z.array(CalendarCategoryResponseSchema).safeParse(pickArrayPayload(res.data));
  return (parsed.success ? parsed.data : []).map(toCalendar);
}

export async function createCalendarCategory(projectId: string, calendarId: string, payload: { name: string; color?: string }) {
  const res = await api.post<CalendarCategoryResponse>(`/projects/${projectId}/calendar/calendars/${calendarId}/categories`, payload);
  return toCalendar(pickObjectPayload(res.data) as CalendarCategoryResponse);
}

export async function updateCalendarCategory(projectId: string, calendarId: string, categoryId: string, payload: { name?: string; color?: string }) {
  const res = await api.patch<CalendarCategoryResponse>(`/projects/${projectId}/calendar/calendars/${calendarId}/categories/${categoryId}`, payload);
  return toCalendar(pickObjectPayload(res.data) as CalendarCategoryResponse);
}

export async function deleteCalendarCategory(projectId: string, calendarId: string, categoryId: string) {
  await api.delete(`/projects/${projectId}/calendar/calendars/${calendarId}/categories/${categoryId}`);
}

export async function createCalendarEvent(
  projectId: string,
  payload: { title: string; calendarId: string; categoryId: string; startAt: string; endAt: string; location?: string; memo?: string }
) {
  const res = await api.post<CalendarEventResponse>(`/projects/${projectId}/calendar/events`, payload);
  const normalized = normalizeCalendarEventResponse(pickObjectPayload(res.data));
  if (!normalized) {
    throw new Error("Invalid calendar event response");
  }
  return toEvent(normalized);
}

export async function updateCalendarEvent(
  projectId: string,
  eventId: string,
  payload: { title?: string; calendarId?: string; categoryId?: string; startAt?: string; endAt?: string; location?: string; memo?: string }
) {
  const res = await api.patch<CalendarEventResponse>(`/projects/${projectId}/calendar/events/${eventId}`, payload);
  const normalized = normalizeCalendarEventResponse(pickObjectPayload(res.data));
  if (!normalized) {
    throw new Error("Invalid calendar event response");
  }
  return toEvent(normalized);
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
  const parsed = z.object({ counts: z.array(z.number()), granularity: z.string() }).safeParse(res.data);
  return parsed.success ? parsed.data : { counts: [], granularity: params.granularity };
}

export async function getProjectCalendars(projectId: string) {
  const res = await api.get<CalendarResponse[] | { data?: CalendarResponse[]; items?: CalendarResponse[] }>(
    `/projects/${projectId}/calendar/calendars`,
  );
  const parsed = z.array(CalendarResponseSchema).safeParse(pickArrayPayload(res.data));
  return (parsed.success ? parsed.data : []).map(toProjectCalendar);
}

export async function getCalendarFolders(projectId: string) {
  const res = await api.get<CalendarFolderResponse[] | { data?: CalendarFolderResponse[]; items?: CalendarFolderResponse[] }>(
    `/projects/${projectId}/calendar/folders`,
  );
  const parsed = z.array(CalendarFolderResponseSchema).safeParse(pickArrayPayload(res.data));
  return (parsed.success ? parsed.data : []).map(toCalendarFolder);
}

export async function createCalendarFolder(projectId: string, payload: { name: string }) {
  const res = await api.post<CalendarFolderResponse>(`/projects/${projectId}/calendar/folders`, payload);
  return toCalendarFolder(pickObjectPayload(res.data) as CalendarFolderResponse);
}

export async function updateCalendarFolder(projectId: string, folderId: string, payload: { name?: string }) {
  const res = await api.patch<CalendarFolderResponse>(`/projects/${projectId}/calendar/folders/${folderId}`, payload);
  return toCalendarFolder(pickObjectPayload(res.data) as CalendarFolderResponse);
}

export async function deleteCalendarFolder(projectId: string, folderId: string) {
  await api.delete(`/projects/${projectId}/calendar/folders/${folderId}`);
}

export async function createProjectCalendar(
  projectId: string,
  payload: { name: string; type: CalendarType; color?: string; folderId?: string; memberIds?: string[] }
) {
  const res = await api.post<CalendarResponse>(`/projects/${projectId}/calendar/calendars`, payload);
  return toProjectCalendar(pickObjectPayload(res.data) as CalendarResponse);
}

export async function updateProjectCalendar(
  projectId: string,
  calendarId: string,
  payload: { name?: string; type?: CalendarType; color?: string; folderId?: string | null; memberIds?: string[] }
) {
  const res = await api.patch<CalendarResponse>(`/projects/${projectId}/calendar/calendars/${calendarId}`, payload);
  return toProjectCalendar(pickObjectPayload(res.data) as CalendarResponse);
}

export async function deleteProjectCalendar(projectId: string, calendarId: string) {
  await api.delete(`/projects/${projectId}/calendar/calendars/${calendarId}`);
}

export async function getCalendarMembers(projectId: string, calendarId: string) {
  const res = await api.get<CalendarMemberRecord[]>(
    `/projects/${projectId}/calendar/calendars/${calendarId}/members`
  );
  return pickArrayPayload(res.data) as CalendarMemberRecord[];
}
