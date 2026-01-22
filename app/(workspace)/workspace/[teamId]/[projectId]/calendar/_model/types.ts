export type ViewMode = "agenda" | "month" | "timeline";

export type CalendarSource = {
  id: string;
  name: string;
  color: string;
  visible: boolean;
};

export type CalendarEvent = {
  id: string;
  calendarId: string;
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  location?: string;
  description?: string;
};

export type EventDraft = {
  title: string;
  calendarId: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
};
