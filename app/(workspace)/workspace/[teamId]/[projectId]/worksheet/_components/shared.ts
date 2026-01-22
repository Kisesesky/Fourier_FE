// components/worksheet/shared.ts
"use client";

import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import type { WorksheetStatus } from "@/workspace/worksheet/_model/types";

export const STATUS_LABEL: Record<WorksheetStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-accent text-muted" },
  "in-review": { label: "In Review", className: "border border-amber-200 bg-amber-50 text-amber-700" },
  done: { label: "Done", className: "bg-emerald-100 text-emerald-700" },
};

export function formatRelative(ts: number) {
  try {
    return formatDistanceToNow(ts, { addSuffix: true, locale: ko });
  } catch {
    return new Date(ts).toLocaleDateString();
  }
}
