// app/(workspace)/workspace/[teamId]/[projectId]/_model/dashboard-page.constants.ts

import type { AnalyticsCounts } from "./dashboard-page.types";

export const ISSUE_STATUS_STYLES: Record<string, string> = {
  backlog: "bg-zinc-500/15 text-zinc-200 border-zinc-500/40",
  todo: "bg-sky-500/15 text-sky-200 border-sky-500/40",
  in_progress: "bg-amber-500/15 text-amber-200 border-amber-500/40",
  review: "bg-purple-500/15 text-purple-200 border-purple-500/40",
  done: "bg-emerald-500/15 text-emerald-200 border-emerald-500/40",
};

export const ISSUE_PRIORITY_STYLES: Record<string, string> = {
  low: "bg-emerald-500/10 text-emerald-200 border-emerald-500/30",
  medium: "bg-sky-500/10 text-sky-200 border-sky-500/30",
  normal: "bg-zinc-500/10 text-zinc-200 border-zinc-500/30",
  high: "bg-amber-500/10 text-amber-200 border-amber-500/30",
  urgent: "bg-rose-500/10 text-rose-200 border-rose-500/30",
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
