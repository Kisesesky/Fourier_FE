// components/landing/landing.constants.ts
import {
  Bug,
  CalendarDays,
  FileText,
  FolderOpen,
  LayoutDashboard,
  MessageSquareText,
  type LucideIcon,
} from "lucide-react";

export type LandingModuleLink = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const LANDING_MODULE_LINKS: LandingModuleLink[] = [
  { label: "홈 대시보드", href: "/product/home-dashboard", icon: LayoutDashboard },
  { label: "채팅", href: "/product/chat", icon: MessageSquareText },
  { label: "이슈", href: "/product/issues", icon: Bug },
  { label: "캘린더", href: "/product/calendar", icon: CalendarDays },
  { label: "문서", href: "/product/docs", icon: FileText },
  { label: "파일함", href: "/product/files", icon: FolderOpen },
];
