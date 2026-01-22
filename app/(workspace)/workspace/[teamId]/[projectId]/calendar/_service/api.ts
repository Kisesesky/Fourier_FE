import type { CalendarEvent } from "@/workspace/calendar/_model/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api";
const DEFAULT_PROJECT_ID = process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID;

const withAuthHeaders = (init?: RequestInit): RequestInit => ({
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
    ...(init?.headers || {}),
  },
  ...init,
});

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, withAuthHeaders(init));
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
}

export async function getCalendarEvents(params: { start?: string | null; end?: string | null; projectId?: string }) {
  const { start, end, projectId } = params;
  const pid = projectId || DEFAULT_PROJECT_ID;
  if (!pid) {
    return { events: [] as CalendarEvent[], start, end };
  }
  const query = new URLSearchParams();
  if (start) query.set("start", start);
  if (end) query.set("end", end);
  const data = await http<CalendarEvent[]>(`/projects/${pid}/calendar/events${query.toString() ? `?${query}` : ""}`);
  return {
    events: data,
    start,
    end,
  };
}
