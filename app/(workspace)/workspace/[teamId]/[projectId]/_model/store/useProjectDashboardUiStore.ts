// app/(workspace)/workspace/[teamId]/[projectId]/_model/store/useProjectDashboardUiStore.ts

import { create } from "zustand";
import type { SetStateAction } from "react";
import type { GraphMode } from "../dashboard-page.types";

type ChatTab = "all" | "channels" | "messages" | "threads";
type IssueTab = "all" | "table" | "kanban" | "timeline" | "chart";
type CalendarTab = "all" | "calendars" | "events" | "analytics";
type MemberTab = "all" | "directory" | "roles" | "activity";
type DocsTab = "all" | "documents" | "activity" | "analytics";
type FileTab = "all" | "files" | "storage" | "recent";

type UiStoreState = {
  messageGraphMode: GraphMode;
  issueGraphMode: GraphMode;
  memberGraphMode: GraphMode;
  docGraphMode: GraphMode;
  calendarGraphMode: GraphMode;
  messageHourlyDate: string;
  messageDailyMonth: string;
  messageMonthlyYear: string;
  issueHourlyDate: string;
  issueDailyMonth: string;
  issueMonthlyYear: string;
  memberHourlyDate: string;
  memberDailyMonth: string;
  memberMonthlyYear: string;
  docHourlyDate: string;
  docDailyMonth: string;
  docMonthlyYear: string;
  calendarHourlyDate: string;
  calendarDailyMonth: string;
  calendarMonthlyYear: string;
  chatTab: ChatTab;
  issueTab: IssueTab;
  calendarTab: CalendarTab;
  memberTab: MemberTab;
  docsTab: DocsTab;
  fileTab: FileTab;
  setMessageGraphMode: (value: SetStateAction<GraphMode>) => void;
  setIssueGraphMode: (value: SetStateAction<GraphMode>) => void;
  setMemberGraphMode: (value: SetStateAction<GraphMode>) => void;
  setDocGraphMode: (value: SetStateAction<GraphMode>) => void;
  setCalendarGraphMode: (value: SetStateAction<GraphMode>) => void;
  setMessageHourlyDate: (value: SetStateAction<string>) => void;
  setMessageDailyMonth: (value: SetStateAction<string>) => void;
  setMessageMonthlyYear: (value: SetStateAction<string>) => void;
  setIssueHourlyDate: (value: SetStateAction<string>) => void;
  setIssueDailyMonth: (value: SetStateAction<string>) => void;
  setIssueMonthlyYear: (value: SetStateAction<string>) => void;
  setMemberHourlyDate: (value: SetStateAction<string>) => void;
  setMemberDailyMonth: (value: SetStateAction<string>) => void;
  setMemberMonthlyYear: (value: SetStateAction<string>) => void;
  setDocHourlyDate: (value: SetStateAction<string>) => void;
  setDocDailyMonth: (value: SetStateAction<string>) => void;
  setDocMonthlyYear: (value: SetStateAction<string>) => void;
  setCalendarHourlyDate: (value: SetStateAction<string>) => void;
  setCalendarDailyMonth: (value: SetStateAction<string>) => void;
  setCalendarMonthlyYear: (value: SetStateAction<string>) => void;
  setChatTab: (value: SetStateAction<ChatTab>) => void;
  setIssueTab: (value: SetStateAction<IssueTab>) => void;
  setCalendarTab: (value: SetStateAction<CalendarTab>) => void;
  setMemberTab: (value: SetStateAction<MemberTab>) => void;
  setDocsTab: (value: SetStateAction<DocsTab>) => void;
  setFileTab: (value: SetStateAction<FileTab>) => void;
  resetUiState: () => void;
};

const resolve = <T,>(next: SetStateAction<T>, prev: T): T =>
  typeof next === "function" ? (next as (value: T) => T)(prev) : next;

const createInitial = () => {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const monthStr = today.toISOString().slice(0, 7);
  const yearStr = String(today.getFullYear());
  return {
    messageGraphMode: "hourly" as GraphMode,
    issueGraphMode: "hourly" as GraphMode,
    memberGraphMode: "hourly" as GraphMode,
    docGraphMode: "hourly" as GraphMode,
    calendarGraphMode: "hourly" as GraphMode,
    messageHourlyDate: todayStr,
    messageDailyMonth: monthStr,
    messageMonthlyYear: yearStr,
    issueHourlyDate: todayStr,
    issueDailyMonth: monthStr,
    issueMonthlyYear: yearStr,
    memberHourlyDate: todayStr,
    memberDailyMonth: monthStr,
    memberMonthlyYear: yearStr,
    docHourlyDate: todayStr,
    docDailyMonth: monthStr,
    docMonthlyYear: yearStr,
    calendarHourlyDate: todayStr,
    calendarDailyMonth: monthStr,
    calendarMonthlyYear: yearStr,
    chatTab: "all" as ChatTab,
    issueTab: "all" as IssueTab,
    calendarTab: "all" as CalendarTab,
    memberTab: "all" as MemberTab,
    docsTab: "all" as DocsTab,
    fileTab: "all" as FileTab,
  };
};

export const useProjectDashboardUiStore = create<UiStoreState>((set) => ({
  ...createInitial(),
  setMessageGraphMode: (value) => set((state) => ({ messageGraphMode: resolve(value, state.messageGraphMode) })),
  setIssueGraphMode: (value) => set((state) => ({ issueGraphMode: resolve(value, state.issueGraphMode) })),
  setMemberGraphMode: (value) => set((state) => ({ memberGraphMode: resolve(value, state.memberGraphMode) })),
  setDocGraphMode: (value) => set((state) => ({ docGraphMode: resolve(value, state.docGraphMode) })),
  setCalendarGraphMode: (value) => set((state) => ({ calendarGraphMode: resolve(value, state.calendarGraphMode) })),
  setMessageHourlyDate: (value) => set((state) => ({ messageHourlyDate: resolve(value, state.messageHourlyDate) })),
  setMessageDailyMonth: (value) => set((state) => ({ messageDailyMonth: resolve(value, state.messageDailyMonth) })),
  setMessageMonthlyYear: (value) => set((state) => ({ messageMonthlyYear: resolve(value, state.messageMonthlyYear) })),
  setIssueHourlyDate: (value) => set((state) => ({ issueHourlyDate: resolve(value, state.issueHourlyDate) })),
  setIssueDailyMonth: (value) => set((state) => ({ issueDailyMonth: resolve(value, state.issueDailyMonth) })),
  setIssueMonthlyYear: (value) => set((state) => ({ issueMonthlyYear: resolve(value, state.issueMonthlyYear) })),
  setMemberHourlyDate: (value) => set((state) => ({ memberHourlyDate: resolve(value, state.memberHourlyDate) })),
  setMemberDailyMonth: (value) => set((state) => ({ memberDailyMonth: resolve(value, state.memberDailyMonth) })),
  setMemberMonthlyYear: (value) => set((state) => ({ memberMonthlyYear: resolve(value, state.memberMonthlyYear) })),
  setDocHourlyDate: (value) => set((state) => ({ docHourlyDate: resolve(value, state.docHourlyDate) })),
  setDocDailyMonth: (value) => set((state) => ({ docDailyMonth: resolve(value, state.docDailyMonth) })),
  setDocMonthlyYear: (value) => set((state) => ({ docMonthlyYear: resolve(value, state.docMonthlyYear) })),
  setCalendarHourlyDate: (value) => set((state) => ({ calendarHourlyDate: resolve(value, state.calendarHourlyDate) })),
  setCalendarDailyMonth: (value) => set((state) => ({ calendarDailyMonth: resolve(value, state.calendarDailyMonth) })),
  setCalendarMonthlyYear: (value) => set((state) => ({ calendarMonthlyYear: resolve(value, state.calendarMonthlyYear) })),
  setChatTab: (value) => set((state) => ({ chatTab: resolve(value, state.chatTab) })),
  setIssueTab: (value) => set((state) => ({ issueTab: resolve(value, state.issueTab) })),
  setCalendarTab: (value) => set((state) => ({ calendarTab: resolve(value, state.calendarTab) })),
  setMemberTab: (value) => set((state) => ({ memberTab: resolve(value, state.memberTab) })),
  setDocsTab: (value) => set((state) => ({ docsTab: resolve(value, state.docsTab) })),
  setFileTab: (value) => set((state) => ({ fileTab: resolve(value, state.fileTab) })),
  resetUiState: () => set(() => ({ ...createInitial() })),
}));
