// app/(workspace)/workspace/[teamId]/[projectId]/issues/_model/analytics.constants.ts

import type { Issue } from "@/workspace/issues/_model/types";

export const ISSUE_STATUS_META_CHART: Array<{
  key: Issue["status"];
  label: string;
  bar: string;
}> = [
  { key: "backlog", label: "백로그", bar: "bg-slate-400" },
  { key: "todo", label: "할 일", bar: "bg-cyan-400" },
  { key: "in_progress", label: "진행 중", bar: "bg-amber-400" },
  { key: "review", label: "리뷰", bar: "bg-fuchsia-400" },
  { key: "done", label: "완료", bar: "bg-emerald-400" },
];

export const ISSUE_PRIORITY_META_CHART: Array<{
  key: Issue["priority"];
  label: string;
  bar: string;
}> = [
  { key: "urgent", label: "매우높음", bar: "bg-rose-500" },
  { key: "high", label: "높음", bar: "bg-orange-400" },
  { key: "medium", label: "보통", bar: "bg-sky-400" },
  { key: "low", label: "낮음", bar: "bg-emerald-400" },
  { key: "very_low", label: "매우낮음", bar: "bg-slate-400" },
];

export const ISSUE_STATUS_META_DASHBOARD: Array<{
  key: Issue["status"];
  label: string;
  bar: string;
  chip: string;
  result: string;
}> = [
  { key: "backlog", label: "백로그", bar: "bg-slate-400", chip: "bg-slate-400 text-slate-100", result: "text-slate-400" },
  { key: "todo", label: "할 일", bar: "bg-cyan-400", chip: "bg-cyan-400 text-cyan-100", result: "text-cyan-400" },
  { key: "in_progress", label: "진행 중", bar: "bg-amber-400", chip: "bg-amber-400 text-amber-100", result: "text-amber-400" },
  { key: "review", label: "리뷰", bar: "bg-fuchsia-400", chip: "bg-fuchsia-400 text-fuchsia-100", result: "text-fuchsia-400" },
  { key: "done", label: "완료", bar: "bg-emerald-400", chip: "bg-emerald-400 text-emerald-100", result: "text-emerald-400" },
];

export const ISSUE_PRIORITY_META_DASHBOARD: Array<{
  key: Issue["priority"];
  label: string;
  bar: string;
  chip: string;
  result: string;
}> = [
  { key: "urgent", label: "매우높음", bar: "bg-rose-500", chip: "bg-rose-400 text-rose-100", result: "text-rose-400" },
  { key: "high", label: "높음", bar: "bg-orange-400", chip: "bg-orange-400 text-orange-100", result: "text-orange-400" },
  { key: "medium", label: "보통", bar: "bg-sky-400", chip: "bg-sky-400 text-sky-100", result: "text-sky-400" },
  { key: "low", label: "낮음", bar: "bg-emerald-400", chip: "bg-emerald-400 text-emerald-100", result: "text-emerald-400" },
  { key: "very_low", label: "매우낮음", bar: "bg-slate-400", chip: "bg-slate-400 text-slate-100", result: "text-slate-400" },
];

export const ISSUE_GROUP_PALETTE = ["#38bdf8", "#f472b6", "#a78bfa", "#facc15", "#4ade80", "#f97316"];
