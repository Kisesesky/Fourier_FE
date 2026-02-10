// app/(workspace)/workspace/[teamId]/_model/view.constants.ts

import {
  CalendarDays,
  FolderSearch,
  MessageCircleMore,
  Network,
  Server,
  Users,
} from "lucide-react";

import type { MemberRole, PresenceStatus } from "@/workspace/members/_model/types";
import type { FriendPresenceStatus, TeamPermissionOption } from "./view.types";

export const HIDDEN_FRIENDS_KEY = "friends:hidden";
export const RECENT_VISITED_STORAGE_KEY = "recently-visited";

export const RECENT_ICON_MAP: Record<string, typeof Users> = {
  project: Server,
  docs: FolderSearch,
  chat: MessageCircleMore,
  calendar: CalendarDays,
  issues: Network,
  members: Users,
};

export const FRIEND_STATUS_COLOR: Record<FriendPresenceStatus, string> = {
  online: "bg-emerald-400/10 text-emerald-300",
  offline: "bg-slate-500/15 text-muted",
};

export const TEAM_ROLE_LABELS: Record<MemberRole, string> = {
  owner: "생성자",
  manager: "관리자",
  member: "편집자",
  guest: "뷰어",
};

export const TEAM_DISPLAY_ROLES: MemberRole[] = ["owner", "manager", "member", "guest"];
export const TEAM_INVITE_ROLES: MemberRole[] = ["manager", "member", "guest"];

export const TEAM_PERMISSION_OPTIONS: TeamPermissionOption[] = [
  { id: "TEAM_INVITE_MEMBER", label: "팀 멤버 초대/삭제" },
  { id: "TEAM_UPDATE_ROLE", label: "팀 멤버 역할 변경" },
  { id: "TEAM_SETTINGS_UPDATE", label: "팀 설정 변경" },
  { id: "PROJECT_CREATE_DELETE", label: "프로젝트 생성/삭제" },
  { id: "PROJECT_INVITE_MEMBER", label: "프로젝트 멤버 초대/삭제" },
  { id: "PROJECT_UPDATE_ROLE", label: "프로젝트 멤버 역할 변경" },
];

export const TEAM_DEFAULT_ROLE_DESCRIPTIONS: Record<MemberRole, string> = {
  owner: "워크스페이스/팀 전반을 모두 관리합니다.",
  manager: "팀 운영 및 프로젝트 관리를 담당합니다.",
  member: "프로젝트 작업을 생성/수정합니다.",
  guest: "읽기와 댓글 중심으로 참여합니다.",
};

export const TEAM_DEFAULT_ROLE_PERMISSIONS: Record<MemberRole, string[]> = {
  owner: TEAM_PERMISSION_OPTIONS.map((item) => item.label),
  manager: TEAM_PERMISSION_OPTIONS.map((item) => item.label),
  member: ["프로젝트 생성/삭제", "프로젝트 멤버 초대/삭제"],
  guest: ["읽기/댓글"],
};

export const MAX_TEAM_NICKNAME_LENGTH = 32;

export const TEAM_MEMBER_STATUS_COLOR: Record<PresenceStatus, string> = {
  online: "bg-emerald-400/10 text-emerald-300",
  away: "bg-amber-400/10 text-amber-200",
  offline: "bg-slate-500/15 text-muted",
  dnd: "bg-rose-500/15 text-rose-300",
};
