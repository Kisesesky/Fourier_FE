import { useKanban } from "@/workspace/issues/_model/store";
import type { JobSheetStatus } from "@/workspace/issues/_model/kanbanTypes";
import { X } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { formatDateInput } from "./date";
import { KANBAN_TEXT } from "./text";
import type { JobSheetFormState } from "./types";
import { validateJobSheetForm } from "./validation";

export function JobSheetDialog() {
  const { ui, closeJobSheetDialog, createJobSheet } = useKanban((state) => ({
    ui: state.ui,
    closeJobSheetDialog: state.closeJobSheetDialog,
    createJobSheet: state.createJobSheet,
  }));
  const open = ui.jobSheetDialogOpen;
  const createDefaults = (): JobSheetFormState => ({
    code: "",
    name: "",
    start: formatDateInput(new Date()),
    end: formatDateInput(new Date()),
    status: "planned",
  });
  const [form, setForm] = useState<JobSheetFormState>(createDefaults());
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(createDefaults());
      setFormError(null);
    }
  }, [open]);

  if (!open) return null;

  const updateField = (field: keyof JobSheetFormState, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      setFormError(validateJobSheetForm(next));
      return next;
    });
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateJobSheetForm(form);
    if (validation) {
      setFormError(validation);
      return;
    }
    createJobSheet({
      code: form.code,
      name: form.name,
      start: form.start,
      end: form.end,
      status: form.status,
    });
    closeJobSheetDialog();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 py-6 sm:items-center">
      <form onSubmit={onSubmit} className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-panel p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted">{KANBAN_TEXT.actions.newJobSheet}</p>
            <h3 className="text-sm font-semibold">{KANBAN_TEXT.labels.jobSheetForm.title}</h3>
          </div>
          <button
            type="button"
            onClick={closeJobSheetDialog}
            className="rounded-full border border-border p-1 text-muted hover:text-foreground"
            aria-label="Close job sheet dialog"
          >
            <X size={14} />
          </button>
        </div>

        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          {KANBAN_TEXT.labels.jobSheetForm.code}
          <input
            value={form.code}
            onChange={(event) => updateField("code", event.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="JS25-10"
            required
          />
        </label>

        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          {KANBAN_TEXT.labels.jobSheetForm.name}
          <input
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="Cutting MO25-10"
            required
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            {KANBAN_TEXT.labels.jobSheetForm.start}
            <input
              type="date"
              value={form.start}
              onChange={(event) => updateField("start", event.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            {KANBAN_TEXT.labels.jobSheetForm.end}
            <input
              type="date"
              value={form.end}
              min={form.start}
              onChange={(event) => updateField("end", event.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              required
            />
          </label>
        </div>

        {formError && <p className="text-xs text-rose-500">{formError}</p>}

        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          {KANBAN_TEXT.filters.status.label}
          <select
            value={form.status}
            onChange={(event) => updateField("status", event.target.value as JobSheetStatus)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {(["planned", "in-progress", "completed", "delayed"] as JobSheetStatus[]).map((status) => (
              <option key={status} value={status}>
                {KANBAN_TEXT.statuses.jobSheet[status]}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => {
              closeJobSheetDialog();
              setFormError(null);
            }}
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted hover:text-foreground"
          >
            {KANBAN_TEXT.actions.cancel}
          </button>
          <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90">
            {KANBAN_TEXT.actions.add}
          </button>
        </div>
      </form>
    </div>
  );
}


