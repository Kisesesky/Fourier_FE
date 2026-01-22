import { useKanban } from "@/workspace/issues/_model/store";
import type { JobSheet, JobSheetStatus } from "@/workspace/issues/_model/kanbanTypes";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { JOB_PILL, TIMELINE_FILTER_LABELS } from "./constants";
import { KANBAN_TEXT } from "./text";
import { entityToList } from "./utils";

export function JobSheetSection() {
  const { jobSheets, openJobSheetDialog, updateJobSheet } = useKanban((state) => ({
    jobSheets: state.jobSheets,
    openJobSheetDialog: state.openJobSheetDialog,
    updateJobSheet: state.updateJobSheet,
  }));
  const sheets = useMemo(() => entityToList(jobSheets), [jobSheets]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobSheetStatus | "all">("all");
  const [hint, setHint] = useState<string | null>(null);
  const filteredSheets = useMemo(() => {
    return sheets.filter((sheet) => {
      const keyword = searchTerm.trim().toLowerCase();
      const matchesKeyword = keyword
        ? sheet.name.toLowerCase().includes(keyword) || sheet.code.toLowerCase().includes(keyword)
        : true;
      const matchesStatus = statusFilter === "all" ? true : sheet.status === statusFilter;
      return matchesKeyword && matchesStatus;
    });
  }, [sheets, searchTerm, statusFilter]);
  const statusOptions: (JobSheetStatus | "all")[] = ["all", "planned", "in-progress", "completed", "delayed"];

  const handleSheetChange = (sheet: JobSheet, field: keyof JobSheet, value: string) => {
    const patch = field === "status" ? { status: value as JobSheetStatus } : { [field]: value };
    if (field === "start" || field === "end") {
      const nextStart = field === "start" ? value : sheet.start;
      const nextEnd = field === "end" ? value : sheet.end;
      if (new Date(nextStart) > new Date(nextEnd)) {
        setHint(KANBAN_TEXT.validation.jobSheet.range);
        return;
      }
    }
    setHint(null);
    updateJobSheet(sheet.id, patch as Partial<JobSheet>);
  };

  return (
    <section className="rounded-2xl border border-border bg-panel/95 shadow-sm">
      <div className="space-y-3 border-b border-border/60 px-4 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-muted">{KANBAN_TEXT.headings.jobSheetEyebrow}</p>
            <h2 className="text-sm font-semibold text-foreground">{KANBAN_TEXT.labels.jobSheet.plannerTitle}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1.5 text-xs text-muted focus-within:border-brand">
              <Search size={12} />
              <input
                className="bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
                placeholder={KANBAN_TEXT.filters.taskSearch}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>
            <select
              className="rounded-full border border-border/60 bg-background px-3 py-1.5 text-xs font-semibold text-muted"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? TIMELINE_FILTER_LABELS.all : statusLabel(option)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={openJobSheetDialog}
              className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand/90"
            >
              <Plus size={14} /> {KANBAN_TEXT.actions.newJobSheet}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] text-muted">
          <span className="rounded-full border border-border/60 px-3 py-1">
            {`${KANBAN_TEXT.labels.jobSheet.countPrefix}${filteredSheets.length}${KANBAN_TEXT.labels.jobSheet.countSuffix}`}
          </span>
        </div>
      </div>
      <div className="space-y-3">
        {filteredSheets.map((sheet) => (
          <article key={sheet.id} className="rounded-2xl border border-border/60 bg-background/90 p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-foreground">{sheet.name}</p>
                <p className="text-xs text-muted">{sheet.code}</p>
              </div>
                <select
                  className={["rounded-full border px-3 py-1 text-[11px] font-semibold", JOB_PILL[sheet.status]].join(" ")}
                  value={sheet.status}
                  aria-label={`${sheet.name} ${KANBAN_TEXT.labels.statusChange}`}
                  onChange={(event) => handleSheetChange(sheet, "status", event.target.value)}
                >
                {(["planned", "in-progress", "completed", "delayed"] as JobSheetStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-muted">{KANBAN_TEXT.labels.jobSheet.start}</span>
                <input
                  type="date"
                  value={sheet.start}
                  onChange={(event) => handleSheetChange(sheet, "start", event.target.value)}
                  className="w-full rounded-lg border border-border bg-panel px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-muted">{KANBAN_TEXT.labels.jobSheet.end}</span>
                <input
                  type="date"
                  value={sheet.end}
                  onChange={(event) => handleSheetChange(sheet, "end", event.target.value)}
                  className="w-full rounded-lg border border-border bg-panel px-3 py-2 text-sm"
                  min={sheet.start}
                />
              </label>
            </div>
          </article>
        ))}
        {hint && <p className="text-xs text-rose-500">{hint}</p>}
        {!filteredSheets.length && (
          <div className="rounded-2xl border border-dashed border-border/60 bg-background/60 p-6 text-center text-xs text-muted">
            {KANBAN_TEXT.empty.noTasks}
          </div>
        )}
      </div>
    </section>
  );
}

const statusLabel = (status: JobSheet["status"]) => KANBAN_TEXT.statuses.jobSheet[status];


