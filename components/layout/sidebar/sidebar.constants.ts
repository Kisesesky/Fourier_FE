// components/layout/sidebar/sidebar.constants.ts

import {
  Archive,
  BarChart3,
  BookText,
  CalendarDays,
  CalendarRange,
  FolderKanban,
  KanbanSquare,
  LayoutDashboard,
  MessageSquare,
  Table2,
  Users,
} from "lucide-react";

import type { SurfaceSlug } from "./sidebar.types";

export const NAV_LINKS = [
  { slug: "chat", icon: MessageSquare, label: "Chat" },
  { slug: "issues", icon: FolderKanban, label: "Issues" },
  { slug: "calendar", icon: CalendarDays, label: "Calendar" },
  { slug: "members", icon: Users, label: "Members" },
  { slug: "docs", icon: BookText, label: "Docs" },
  { slug: "file", icon: Archive, label: "File" },
] as const;

export const SURFACE_LABEL: Record<SurfaceSlug, string> = {
  chat: "채널 & DM",
  issues: "워크플로",
  calendar: "캘린더",
  members: "팀 구성원",
  docs: "문서",
  file: "파일 보관함",
};

export const ISSUE_TABS = [
  { key: "table", label: "테이블", icon: Table2 },
  { key: "timeline", label: "타임라인", icon: CalendarRange },
  { key: "kanban", label: "칸반", icon: KanbanSquare },
  { key: "chart", label: "차트", icon: BarChart3 },
  { key: "dashboard", label: "대시보드", icon: LayoutDashboard },
] as const;
