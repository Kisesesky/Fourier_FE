import { format, parseISO } from "date-fns";

export const toDateKey = (date: Date) => format(date, "yyyy-MM-dd");

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
    // ignore storage quota failures in mock 환경
  }
};

export const formatEventTime = (startIso: string, endIso?: string, allDay?: boolean) => {
  if (allDay) return "종일";
  const start = parseISO(startIso);
  if (!endIso) return format(start, "HH:mm");
  const end = parseISO(endIso);
  return `${format(start, "HH:mm")} ~ ${format(end, "HH:mm")}`;
};
