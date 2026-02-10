// app/(workspace)/workspace/[teamId]/[projectId]/calendar/_model/utils.ts
import { format, parseISO } from "date-fns";

export const toDateKey = (date: Date) => format(date, "yyyy-MM-dd");

export const toZonedDate = (iso: string, timeZone = "Asia/Seoul") => {
  const date = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "01";
  const year = Number(get("year"));
  const month = Number(get("month"));
  const day = Number(get("day"));
  return new Date(year, month - 1, day);
};

export const toZonedDateKey = (iso: string, timeZone = "Asia/Seoul") =>
  toDateKey(toZonedDate(iso, timeZone));

export const readStorage = <T,>(key: string, fallback: T[]): T[] => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as T[];
    }
    return fallback;
  } catch {
    return fallback;
  }
};

export const persistStorage = (key: string, value: unknown) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage quota failures in local development
  }
};

export const formatEventTime = (startIso: string, endIso?: string, allDay?: boolean) => {
  if (allDay) return "종일";
  const start = parseISO(startIso);
  if (!endIso) return format(start, "HH:mm");
  const end = parseISO(endIso);
  return `${format(start, "HH:mm")} ~ ${format(end, "HH:mm")}`;
};
