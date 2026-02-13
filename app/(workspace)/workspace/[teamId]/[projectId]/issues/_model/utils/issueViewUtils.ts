// app/(workspace)/workspace/[teamId]/[projectId]/issues/_model/utils/issueViewUtils.ts
import type { Issue } from "@/workspace/issues/_model/types";

export const STATUS_STYLE: Record<Issue["status"], string> = {
  todo: "bg-rose-500 text-rose-100",
  in_progress: "bg-amber-500 text-amber-100",
  review: "bg-violet-500 text-violet-100",
  done: "bg-emerald-500 text-emerald-100",
  backlog: "bg-slate-500 text-slate-100",
};

export const PRIORITY_STYLE: Record<Issue["priority"], string> = {
  very_low: "bg-slate-500 text-slate-100",
  low: "bg-sky-500 text-sky-100",
  medium: "bg-amber-500 text-amber-100",
  high: "bg-orange-500 text-orange-100",
  urgent: "bg-rose-500 text-rose-100",
};

export function formatIssueDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${mm}.${dd}`;
}

export function formatIssueDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${mm}.${dd} ${hh}:${min}`;
}

export function formatCommentDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
}

export function formatIssueDateRange(startAt?: string, endAt?: string) {
  if (!startAt && !endAt) return "-";
  const start = startAt ? formatIssueDate(startAt) : "";
  const end = endAt ? formatIssueDate(endAt) : "";
  if (start && end && start !== end) return `${start}~${end}`;
  return start || end || "-";
}
