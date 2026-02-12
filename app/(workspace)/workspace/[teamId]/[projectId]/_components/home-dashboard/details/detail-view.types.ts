// app/(workspace)/workspace/[teamId]/[projectId]/_components/home-dashboard/details/detail-view.types.ts

import type { ComponentType, Dispatch, ReactNode, SetStateAction } from "react";
import type { CalendarEvent } from "@/workspace/calendar/_model/types";
import type { Issue } from "@/workspace/issues/_model/types";
import type { AnalyticsCounts, GraphMode } from "../../../_model/dashboard-page.types";

export type DetailTabsRenderer = <T extends string>(
  current: T,
  setCurrent: (value: T) => void,
  tabs: Array<{ key: T; label: string; icon?: ComponentType<{ size?: string | number }> }>
) => ReactNode;

type ChatTab = "all" | "channels" | "messages" | "threads";
type IssueTab = "all" | "table" | "kanban" | "timeline" | "chart";
type CalendarTab = "all" | "calendars" | "events" | "analytics";
type MemberTab = "all" | "directory" | "roles" | "activity";
type DocsTab = "all" | "documents" | "activity" | "analytics";
type FileTab = "all" | "files" | "storage" | "recent";

type ChannelRow = { id: string; name: string };
type ChannelActivityRow = { lastMessageTs?: number; lastPreview?: string };
type ChatUserRow = { id: string; name: string; avatarUrl?: string | null };
type MemberRow = { id: string; name: string; displayName?: string; avatarUrl?: string | null; role?: string; joinedAt?: number };
type DocRow = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  folderId?: string | null;
  authorName?: string | null;
  authorAvatarUrl?: string | null;
};
type FileRow = { id: string; name: string; createdAt: string; size: number };
type IssueStatusMap = {
  backlog: Issue[];
  todo: Issue[];
  in_progress: Issue[];
  review: Issue[];
  done: Issue[];
};

type DetailModel = {
  chatTab: ChatTab;
  setChatTab: Dispatch<SetStateAction<ChatTab>>;
  channels: ChannelRow[];
  channelActivity: Record<string, ChannelActivityRow>;
  chatUsers: Record<string, ChatUserRow>;
  currentUserId: string;
  chatStats: {
    messageCount: number;
    channelCount: number;
    dmCount: number;
    threadRootCount: number;
    threadReplyCount: number;
  };
  chatThreadRows: Array<{ channelId: string; channelName: string; threadCount: number }>;
  messageGraphMode: GraphMode;
  setMessageGraphMode: Dispatch<SetStateAction<GraphMode>>;
  messageHourlyDate: string;
  setMessageHourlyDate: Dispatch<SetStateAction<string>>;
  messageDailyMonth: string;
  setMessageDailyMonth: Dispatch<SetStateAction<string>>;
  messageMonthlyYear: string;
  setMessageMonthlyYear: Dispatch<SetStateAction<string>>;
  messageCounts: AnalyticsCounts;
  messageDates: number[];
  issueTab: IssueTab;
  setIssueTab: Dispatch<SetStateAction<IssueTab>>;
  issueCount: number;
  issueStats: { backlog: number; todo: number; in_progress: number; review: number; done: number };
  issueGraphMode: GraphMode;
  setIssueGraphMode: Dispatch<SetStateAction<GraphMode>>;
  issueHourlyDate: string;
  setIssueHourlyDate: Dispatch<SetStateAction<string>>;
  issueDailyMonth: string;
  setIssueDailyMonth: Dispatch<SetStateAction<string>>;
  issueMonthlyYear: string;
  setIssueMonthlyYear: Dispatch<SetStateAction<string>>;
  issueCounts: AnalyticsCounts;
  issues: Issue[];
  issuesByStatus: IssueStatusMap;
  memberTab: MemberTab;
  setMemberTab: Dispatch<SetStateAction<MemberTab>>;
  memberCount: number;
  memberGraphMode: GraphMode;
  setMemberGraphMode: Dispatch<SetStateAction<GraphMode>>;
  memberHourlyDate: string;
  setMemberHourlyDate: Dispatch<SetStateAction<string>>;
  memberDailyMonth: string;
  setMemberDailyMonth: Dispatch<SetStateAction<string>>;
  memberMonthlyYear: string;
  setMemberMonthlyYear: Dispatch<SetStateAction<string>>;
  memberCounts: AnalyticsCounts;
  members: MemberRow[];
  docsTab: DocsTab;
  setDocsTab: Dispatch<SetStateAction<DocsTab>>;
  docStats: { pages: number; snapshots: number; lastSaved: string };
  recentDocs: DocRow[];
  docGraphMode: GraphMode;
  setDocGraphMode: Dispatch<SetStateAction<GraphMode>>;
  docHourlyDate: string;
  setDocHourlyDate: Dispatch<SetStateAction<string>>;
  docDailyMonth: string;
  setDocDailyMonth: Dispatch<SetStateAction<string>>;
  docMonthlyYear: string;
  setDocMonthlyYear: Dispatch<SetStateAction<string>>;
  docCounts: AnalyticsCounts;
  docSnapshots: number[];
  calendarTab: CalendarTab;
  setCalendarTab: Dispatch<SetStateAction<CalendarTab>>;
  upcomingEvents: CalendarEvent[];
  calendarBuckets: Array<{ key: string; name: string; count: number; color: string }>;
  calendarCategoryBuckets: Array<{ key: string; name: string; count: number; color: string }>;
  calendarSources: Array<{ id: string; name: string; color: string; type?: string }>;
  calendarGraphMode: GraphMode;
  setCalendarGraphMode: Dispatch<SetStateAction<GraphMode>>;
  calendarHourlyDate: string;
  setCalendarHourlyDate: Dispatch<SetStateAction<string>>;
  calendarDailyMonth: string;
  setCalendarDailyMonth: Dispatch<SetStateAction<string>>;
  calendarMonthlyYear: string;
  setCalendarMonthlyYear: Dispatch<SetStateAction<string>>;
  calendarCounts: AnalyticsCounts;
  calendarEvents: CalendarEvent[];
  fileTab: FileTab;
  setFileTab: Dispatch<SetStateAction<FileTab>>;
  fileCount: number;
  fileTotalBytes: number;
  recentFiles: FileRow[];
};

export type DetailViewBaseProps = {
  pathname: string;
  onNavigate: (href: string) => void;
  renderHeader: (title: string, actions?: ReactNode, tabs?: ReactNode) => ReactNode;
  renderIssueSummary: () => ReactNode;
  renderDetailTabs: DetailTabsRenderer;
  renderGraphTabs: (mode: GraphMode, setMode: (value: GraphMode) => void) => ReactNode;
  renderGraphFilter: (
    mode: GraphMode,
    filter: { day: string; month: string; year: string },
    setFilter: (next: { day: string; month: string; year: string }) => void
  ) => ReactNode;
  renderBars: (values: number[], height?: number) => ReactNode;
  renderRangeLabels: (mode: GraphMode, count: number) => ReactNode;
  formatBytes: (bytes: number) => string;
  model: DetailModel;
};
