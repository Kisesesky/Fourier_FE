// app/(workspace)/workspace/[teamId]/_model/view.utils.ts

import type { MemberRole } from "@/workspace/members/_model/types";

export const mapTeamRole = (role: string): MemberRole => {
  switch (role) {
    case "OWNER":
      return "owner";
    case "ADMIN":
    case "MANAGER":
      return "manager";
    case "MEMBER":
      return "member";
    case "GUEST":
      return "guest";
    default:
      return "member";
  }
};

export const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const getOptionalInitials = (name?: string | null) => {
  if (!name) return "?";
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

export const formatVisitedLabel = (ts: number) => {
  const diffMs = Date.now() - ts;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) return "방금 전 방문입니다";
  if (diffMinutes < 60) return `${diffMinutes}분 전 방문입니다`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전 방문입니다`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}일 전 방문입니다`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `${diffWeeks}주 전 방문입니다`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}달 전 방문입니다`;
  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears}년 전 방문입니다`;
};
