import type { Issue } from "@/workspace/issues/_model/types";

export const STATUS_STYLE: Record<Issue["status"], string> = {
  todo: "bg-amber-100 text-amber-700",
  in_progress: "bg-rose-100 text-rose-700",
  review: "bg-violet-100 text-violet-700",
  done: "bg-emerald-100 text-emerald-700",
  backlog: "bg-slate-200 text-slate-700",
};

export const PRIORITY_STYLE: Record<Issue["priority"], string> = {
  very_low: "bg-slate-100 text-slate-700",
  low: "bg-sky-100 text-sky-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-rose-100 text-rose-700",
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
