// app/(workspace)/workspace/[teamId]/[projectId]/issues/_model/analytics.constants.ts

import type { Issue } from "@/workspace/issues/_model/types";

export const ISSUE_STATUS_META_CHART: Array<{
  key: Issue["status"];
  label: string;
  bar: string;
}> = [
  { key: "backlog", label: "백로그", bar: "bg-slate-500" },
  { key: "todo", label: "할 일", bar: "bg-rose-500" },
  { key: "in_progress", label: "진행 중", bar: "bg-amber-500" },
  { key: "review", label: "리뷰", bar: "bg-violet-500" },
  { key: "done", label: "완료", bar: "bg-emerald-500" },
];

export const ISSUE_PRIORITY_META_CHART: Array<{
  key: Issue["priority"];
  label: string;
  bar: string;
}> = [
  { key: "urgent", label: "매우높음", bar: "bg-rose-500" },
  { key: "high", label: "높음", bar: "bg-orange-500" },
  { key: "medium", label: "보통", bar: "bg-amber-500" },
  { key: "low", label: "낮음", bar: "bg-sky-500" },
  { key: "very_low", label: "매우낮음", bar: "bg-slate-500" },
];

export const ISSUE_STATUS_META_DASHBOARD: Array<{
  key: Issue["status"];
  label: string;
  bar: string;
  chip: string;
  result: string;
}> = [
  { key: "backlog", label: "백로그", bar: "bg-slate-500", chip: "bg-slate-500 text-slate-100", result: "text-slate-500" },
  { key: "todo", label: "할 일", bar: "bg-rose-500", chip: "bg-rose-500 text-rose-100", result: "text-rose-500" },
  { key: "in_progress", label: "진행 중", bar: "bg-amber-500", chip: "bg-amber-500 text-amber-100", result: "text-amber-500" },
  { key: "review", label: "리뷰", bar: "bg-violet-500", chip: "bg-violet-500 text-violet-100", result: "text-violet-500" },
  { key: "done", label: "완료", bar: "bg-emerald-500", chip: "bg-emerald-500 text-emerald-100", result: "text-emerald-500" },
];

export const ISSUE_PRIORITY_META_DASHBOARD: Array<{
  key: Issue["priority"];
  label: string;
  bar: string;
  chip: string;
  result: string;
}> = [
  { key: "urgent", label: "매우높음", bar: "bg-rose-500", chip: "bg-rose-500 text-rose-100", result: "text-rose-500" },
  { key: "high", label: "높음", bar: "bg-orange-500", chip: "bg-orange-500 text-orange-100", result: "text-orange-500" },
  { key: "medium", label: "보통", bar: "bg-amber-500", chip: "bg-amber-500 text-amber-100", result: "text-amber-500" },
  { key: "low", label: "낮음", bar: "bg-sky-500", chip: "bg-sky-500 text-sky-100", result: "text-sky-500" },
  { key: "very_low", label: "매우낮음", bar: "bg-slate-500", chip: "bg-slate-500 text-slate-100", result: "text-slate-500" },
];

export const ISSUE_GROUP_PALETTE = ["#38bdf8", "#f472b6", "#a78bfa", "#facc15", "#4ade80", "#f97316"];
