import type { TimelineRange } from "./types";

export const TIME_ZONE = "Asia/Seoul";
export const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const SHORT_DATE = new Intl.DateTimeFormat("ko-KR", { month: "short", day: "2-digit", timeZone: TIME_ZONE });
export const DATE_TIME = new Intl.DateTimeFormat("ko-KR", {
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: TIME_ZONE,
});
export const TIME_ONLY = new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TIME_ZONE });

export function toKstDate(date: Date) {
  return new Date(date.toLocaleString("en-US", { timeZone: TIME_ZONE }));
}

export function startOfDayMs(date: Date = new Date()) {
  const kst = toKstDate(date);
  return new Date(kst.getFullYear(), kst.getMonth(), kst.getDate()).getTime();
}

export const TODAY_MS = startOfDayMs();

export function normalizeDate(value: string) {
  return startOfDayMs(new Date(value));
}

export function formatShortDate(value: string) {
  return SHORT_DATE.format(new Date(value));
}

export function formatTimeRange(startIso: string, endIso: string) {
  const start = TIME_ONLY.format(new Date(startIso));
  const end = TIME_ONLY.format(new Date(endIso));
  return `${start} - ${end}`;
}

export function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function buildTimelineDays(range: TimelineRange) {
  const days: { ts: number; label: string }[] = [];
  for (let ts = range.start; ts <= range.end; ts += DAY_IN_MS) {
    days.push({ ts, label: SHORT_DATE.format(new Date(ts)) });
  }
  return days;
}

export function isToday(ts: number) {
  return ts === TODAY_MS;
}
