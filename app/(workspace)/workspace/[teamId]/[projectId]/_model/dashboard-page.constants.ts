// app/(workspace)/workspace/[teamId]/[projectId]/_model/dashboard-page.constants.ts

import type { AnalyticsCounts } from "./dashboard-page.types";

export const ISSUE_STATUS_STYLES: Record<string, string> = {
  backlog: "bg-slate-500 text-slate-100",
  todo: "bg-rose-500 text-rose-100",
  in_progress: "bg-amber-500 text-amber-100",
  review: "bg-violet-500 text-violet-100",
  done: "bg-emerald-500 text-emerald-100",
};

export const ISSUE_PRIORITY_STYLES: Record<string, string> = {
  very_low: "bg-slate-500 text-slate-100",
  low: "bg-sky-500 text-sky-100",
  medium: "bg-amber-500 text-amber-100",
  normal: "bg-amber-500 text-amber-100",
  high: "bg-orange-500 text-orange-100",
  urgent: "bg-rose-500 text-rose-100",
};

export const ISSUE_STATUS_LABELS: Record<string, string> = {
  backlog: "백로그",
  todo: "할 일",
  in_progress: "작업 중",
  review: "리뷰 대기",
  done: "완료",
};

export const ISSUE_PRIORITY_LABELS: Record<string, string> = {
  very_low: "매우 낮음",
  low: "낮음",
  medium: "보통",
  normal: "보통",
  high: "높음",
  urgent: "긴급",
};

export const MEMBER_ROLE_LABELS: Record<string, string> = {
  OWNER: "소유자",
  MANAGER: "관리자",
  MEMBER: "멤버",
  GUEST: "게스트",
};

export const createEmptyIssueStats = () => ({
  backlog: 0,
  todo: 0,
  in_progress: 0,
  review: 0,
  done: 0,
});

export const createEmptyAnalyticsCounts = (): AnalyticsCounts => ({
  hourly: [],
  daily: [],
  monthly: [],
});
