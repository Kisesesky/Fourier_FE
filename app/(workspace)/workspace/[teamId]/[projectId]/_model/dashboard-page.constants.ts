// app/(workspace)/workspace/[teamId]/[projectId]/_model/dashboard-page.constants.ts

import type { AnalyticsCounts } from "./dashboard-page.types";

export const ISSUE_STATUS_STYLES: Record<string, string> = {
  backlog: "bg-slate-500/15 text-slate-700 border-slate-500/40",
  todo: "bg-rose-500/15 text-rose-700 border-rose-500/40",
  in_progress: "bg-amber-500/15 text-amber-700 border-amber-500/40",
  review: "bg-violet-500/15 text-violet-700 border-violet-500/40",
  done: "bg-emerald-500/15 text-emerald-700 border-emerald-500/40",
};

export const ISSUE_PRIORITY_STYLES: Record<string, string> = {
  very_low: "bg-slate-500/15 text-slate-700 border-slate-500/40",
  low: "bg-sky-500/15 text-sky-700 border-sky-500/40",
  medium: "bg-amber-500/15 text-amber-700 border-amber-500/40",
  normal: "bg-amber-500/15 text-amber-700 border-amber-500/40",
  high: "bg-orange-500/15 text-orange-700 border-orange-500/40",
  urgent: "bg-rose-500/15 text-rose-700 border-rose-500/40",
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
