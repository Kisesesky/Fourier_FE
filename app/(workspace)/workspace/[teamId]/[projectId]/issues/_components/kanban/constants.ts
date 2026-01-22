import type {
  JobSheet,
  Machine,
  PaintJob,
  ProductionRisk,
  Subcontract,
  TimelineFilter,
  VendorFilter,
  WorkflowStatus,
} from "@/workspace/issues/_model/kanbanTypes";

import { KANBAN_TEXT } from "./text";

export const JOB_PILL: Record<JobSheet["status"], string> = {
  planned: "bg-slate-200 text-slate-700",
  "in-progress": "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  delayed: "bg-rose-100 text-rose-700",
};

export const PAINT_PILL: Record<PaintJob["status"], string> = {
  scheduled: "bg-slate-200 text-slate-700",
  mixing: "bg-sky-100 text-sky-700",
  ready: "bg-emerald-100 text-emerald-700",
};

export const SUBCONTRACT_PILL: Record<Subcontract["status"], string> = {
  planned: "bg-slate-200 text-slate-700",
  "in-progress": "bg-blue-100 text-blue-700",
  delayed: "bg-rose-100 text-rose-700",
};

export const MACHINE_PILL: Record<Machine["status"], string> = {
  available: "bg-emerald-100 text-emerald-700",
  busy: "bg-brand/10 text-brand",
};

export const RISK_PILL: Record<ProductionRisk["severity"], string> = {
  high: "bg-rose-100 text-rose-700",
  medium: "bg-amber-100 text-amber-700",
  watch: "bg-slate-200 text-slate-700",
};

export const WORKFLOW_STATUS_PILL: Record<WorkflowStatus, string> = {
  planned: "bg-slate-200 text-slate-700",
  "in-progress": "bg-brand/10 text-brand",
  "at-risk": "bg-amber-100 text-amber-700",
  blocked: "bg-rose-100 text-rose-700",
  done: "bg-emerald-100 text-emerald-700",
};

export const WORKFLOW_BAR_COLOR: Record<WorkflowStatus, string> = {
  planned: "#CBD2F5",
  "in-progress": "#7A7FFF",
  "at-risk": "#F6C343",
  blocked: "#F26C6C",
  done: "#64C27B",
};

export const WORKFLOW_STATUS_LABEL = KANBAN_TEXT.statuses.workflow;

export const TIMELINE_FILTER_LABELS: Record<TimelineFilter, string> = {
  all: KANBAN_TEXT.filters.view.all,
  planned: KANBAN_TEXT.statuses.workflow.planned,
  "in-progress": KANBAN_TEXT.statuses.workflow["in-progress"],
  "at-risk": KANBAN_TEXT.statuses.workflow["at-risk"],
  blocked: KANBAN_TEXT.statuses.workflow.blocked,
  done: KANBAN_TEXT.statuses.workflow.done,
};

export const VENDOR_FILTER_LABELS: Record<VendorFilter, string> = {
  all: KANBAN_TEXT.filters.view.all,
  planned: KANBAN_TEXT.statuses.subcontract.planned,
  "in-progress": KANBAN_TEXT.statuses.subcontract["in-progress"],
  delayed: KANBAN_TEXT.statuses.subcontract.delayed,
};

export const ROW_HEIGHT = 52;
export const BASE_DAY_CELL = 64;
export const WORKFLOW_STATUSES: WorkflowStatus[] = ["planned", "in-progress", "at-risk", "blocked", "done"];
