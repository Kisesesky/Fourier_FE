// Path: app/(workspace)/workspace/[teamId]/[projectId]/calendar/_model/view.types.ts
import type {
  CalendarEvent,
  CalendarFolderOption,
  CalendarMemberOption,
  CalendarSource,
  CalendarType,
  EventDraft,
  ProjectCalendar,
  ViewMode,
} from "@/workspace/calendar/_model/types";

export type CalendarCategoryGroup = {
  key: string;
  name: string;
  color: string;
  visible: boolean;
};

export type CalendarHeaderProps = {
  current: Date;
  view: ViewMode;
  searchTerm: string;
  categories: CalendarCategoryGroup[];
  focusedCalendar?: ProjectCalendar | null;
  onSearch: (value: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onChangeView: (mode: ViewMode) => void;
  onOpenCreate: () => void;
  onToggleCategoryGroup: (key: string) => void;
  onAddCategory?: () => void;
};

export type CalendarAgendaViewProps = {
  current: Date;
  events: CalendarEvent[];
  calendarMap: Map<string, CalendarSource>;
  onRequestCreate: (date: Date) => void;
  onRequestEdit?: (event: CalendarEvent) => void;
  onDeleteEvent: (id: string) => void;
};

export type CalendarAgendaSection = {
  dateKey: string;
  label: string;
  events: CalendarEvent[];
};

export type CalendarCreateModalProps = {
  open: boolean;
  name: string;
  type: CalendarType;
  color: string;
  folderOptions: CalendarFolderOption[];
  folderId: string;
  memberOptions: CalendarMemberOption[];
  memberIds: string[];
  error?: string | null;
  onChangeName: (value: string) => void;
  onChangeType: (value: CalendarType) => void;
  onChangeColor: (value: string) => void;
  onChangeFolder: (value: string) => void;
  onToggleMember: (id: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export type CalendarManageModalProps = {
  open: boolean;
  name: string;
  type: CalendarType;
  color: string;
  categories: Array<Pick<CalendarSource, "id" | "name" | "color" | "isDefault">>;
  memberOptions: CalendarMemberOption[];
  memberIds: string[];
  error?: string | null;
  onChangeName: (value: string) => void;
  onChangeType: (value: CalendarType) => void;
  onChangeColor: (value: string) => void;
  onToggleMember: (id: string) => void;
  onAddCategory: (payload: { name: string; color?: string }) => void;
  onUpdateCategory: (id: string, patch: { name?: string; color?: string }) => void;
  onDeleteCategory: (id: string) => void;
  onSubmit: () => void;
  onDelete: () => void;
  onClose: () => void;
};

export type UpcomingEventCardProps = {
  event: CalendarEvent;
  calendarName?: string;
  color?: string;
  onDelete: (id: string) => void;
  onEdit?: (event: CalendarEvent) => void;
  compact?: boolean;
};

export type CalendarMonthViewProps = {
  current: Date;
  selectedDate: Date;
  days: Date[];
  eventsByDate: Map<string, CalendarEvent[]>;
  calendarMap: Map<string, CalendarSource>;
  maxVisible?: number;
  onSelectDate: (date: Date) => void;
  onRequestDetails?: (date: Date) => void;
};

export type DayEventPillVariant = "single" | "start" | "middle" | "end";

export type DayEventPillProps = {
  event: CalendarEvent;
  color?: string;
  variant: DayEventPillVariant;
  showLabel?: boolean;
};

export type TimelineTask = {
  id: string;
  calendarId: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  calendarName: string;
  allDay: boolean;
  createdBy?: { id: string; name: string; avatarUrl?: string | null };
  sourceType?: "manual" | "issue";
  location?: string;
  description?: string;
};

export type TimelineGroup = {
  calendarId: string;
  calendarName: string;
  calendarColor: string;
  tasks: TimelineTask[];
};

export type CalendarTimelineViewProps = {
  current: Date;
  events: CalendarEvent[];
  calendarMap: Map<string, CalendarSource>;
  onRequestCreate: (date: Date) => void;
  onSelectDate: (date: Date) => void;
  onRequestDetails: (date: Date) => void;
  editingEventId?: string | null;
};

export type TimelineTaskBarProps = {
  title: string;
  start: Date;
  end: Date;
  color: string;
  timelineStart: Date;
  totalDays: number;
  onSelect: () => void;
  hint: string;
  createdBy?: { id: string; name: string; avatarUrl?: string | null };
  sourceType?: "manual" | "issue";
  calendarName?: string;
  location?: string;
  description?: string;
  allDay?: boolean;
  offsetIndex?: number;
  barHeight?: number;
  verticalPadding?: number;
  stackSpacing?: number;
  isActive?: boolean;
};

export type CalendarDetailsPanelProps = {
  selectedDate: Date;
  events: CalendarEvent[];
  calendars: CalendarSource[];
  calendarMap: Map<string, CalendarSource>;
  draft: EventDraft;
  isFormOpen: boolean;
  formError: string | null;
  editingEventId: string | null;
  onChangeDraft: (patch: Partial<EventDraft>) => void;
  onRequestCreate: () => void;
  onRequestEdit: (event: CalendarEvent) => void;
  onCancelCreate: () => void;
  onSubmit: () => void;
  onDeleteEvent: (id: string) => void;
  onClose?: () => void;
  variant?: "panel" | "modal";
};
