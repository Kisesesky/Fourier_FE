import type { CalendarEvent, CalendarSource } from "@/workspace/calendar/_model/types";

export const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

export const COLOR_PALETTE = ["#0c66e4", "#10b981", "#f97316", "#a855f7", "#f43f5e", "#6366f1"] as const;

export const DEFAULT_CALENDARS: CalendarSource[] = [
  { id: "personal", name: "개인 일정", color: "#0c66e4", visible: true },
  { id: "team", name: "팀 프로젝트", color: "#10b981", visible: true },
  { id: "focus", name: "집중 블록", color: "#f97316", visible: true },
];

export const DEFAULT_EVENTS: CalendarEvent[] = [
  {
    id: "event-1",
    calendarId: "personal",
    title: "가족 모임",
    start: "2025-10-02T00:00:00",
    end: "2025-10-02T23:59:00",
    allDay: true,
    location: "서울",
    description: "추석 맞이 일정 공유",
  },
  {
    id: "event-2",
    calendarId: "team",
    title: "Sprint Review",
    start: "2025-10-05T14:00:00",
    end: "2025-10-05T15:00:00",
    allDay: false,
    location: "회의실 C",
    description: "프론트엔드 캘린더 리뉴얼 시연",
  },
  {
    id: "event-3",
    calendarId: "focus",
    title: "Deep Work · UI Polish",
    start: "2025-10-12T09:00:00",
    end: "2025-10-12T12:00:00",
    allDay: false,
    description: "모바일 대응 QA",
  },
];
