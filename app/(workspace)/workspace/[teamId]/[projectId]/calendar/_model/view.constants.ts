// Path: app/(workspace)/workspace/[teamId]/[projectId]/calendar/_model/view.constants.ts
import type { DayEventPillVariant } from "@/workspace/calendar/_model/view.types";

export const CALENDAR_PRESET_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#ef4444",
  "#f59e0b",
  "#a855f7",
  "#06b6d4",
  "#ec4899",
  "#64748b",
] as const;

export const CALENDAR_VIEW_OPTIONS = [
  { value: "agenda", label: "Agenda" },
  { value: "month", label: "Month" },
  { value: "timeline", label: "Timeline" },
] as const;

export const MAX_VISIBLE_EVENTS_PER_DAY = 3;

export const TIMELINE_MONTH_COLORS = [
  "bg-blue-50",
  "bg-orange-50",
  "bg-emerald-50",
  "bg-purple-50",
  "bg-rose-50",
] as const;

export const TIMELINE_DAY_CELL_MIN_WIDTH = 100;

export const DAY_EVENT_OFFSET = 6;

export const DAY_EVENT_RADIUS: Record<DayEventPillVariant, string> = {
  single: "9999px",
  start: "9999px 0 0 9999px",
  middle: "0",
  end: "0 9999px 9999px 0",
};

export const DAY_EVENT_LEFT_MARGIN: Record<DayEventPillVariant, number> = {
  single: 0,
  start: 0,
  middle: -DAY_EVENT_OFFSET,
  end: -DAY_EVENT_OFFSET,
};

export const DAY_EVENT_RIGHT_MARGIN: Record<DayEventPillVariant, number> = {
  single: 0,
  start: -DAY_EVENT_OFFSET,
  middle: -DAY_EVENT_OFFSET,
  end: 0,
};
