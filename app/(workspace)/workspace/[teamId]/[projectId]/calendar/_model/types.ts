export type ViewMode = "agenda" | "month" | "timeline";

export type CalendarSource = {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  calendarId?: string;
  isDefault?: boolean;
};

export type ProjectCalendar = {
  id: string;
  name: string;
  type: "TEAM" | "PERSONAL" | "PRIVATE";
  color: string;
  ownerId?: string | null;
  folderId?: string | null;
};

export type CalendarFolder = {
  id: string;
  name: string;
  createdById?: string | null;
  isActive?: boolean;
};

export type CalendarEvent = {
  id: string;
  calendarId: string;
  categoryId: string;
  categoryName?: string;
  categoryColor?: string;
  createdBy?: { id: string; name: string; avatarUrl?: string | null };
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
  categoryId: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
};
