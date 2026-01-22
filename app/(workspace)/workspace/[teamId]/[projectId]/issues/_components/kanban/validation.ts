import { KANBAN_TEXT } from "./text";
import type { JobSheetFormState, QuickTaskFormState } from "./types";

export function validateQuickTaskForm(form: QuickTaskFormState) {
  if (!form.title.trim()) return KANBAN_TEXT.validation.quickTask.title;
  if (!form.owner) return KANBAN_TEXT.validation.quickTask.owner;
  const start = Date.parse(form.start);
  const end = Date.parse(form.end);
  if (Number.isNaN(start) || Number.isNaN(end)) return KANBAN_TEXT.validation.quickTask.date;
  if (start > end) return KANBAN_TEXT.validation.quickTask.range;
  return null;
}

export function validateJobSheetForm(form: JobSheetFormState) {
  if (!form.name.trim()) return KANBAN_TEXT.validation.jobSheet.name;
  const start = Date.parse(form.start);
  const end = Date.parse(form.end);
  if (Number.isNaN(start) || Number.isNaN(end)) return KANBAN_TEXT.validation.jobSheet.date;
  if (start > end) return KANBAN_TEXT.validation.jobSheet.range;
  return null;
}
