import { useKanban } from "@/workspace/issues/_model/store";
import type { PaintJob } from "@/workspace/issues/_model/kanbanTypes";
import { useMemo } from "react";

import { PAINT_PILL } from "./constants";
import { KANBAN_TEXT } from "./text";
import { entityToList } from "./utils";

export function PaintingSection() {
  const { paintQueue, updatePaintJob } = useKanban((state) => ({
    paintQueue: state.paintQueue,
    updatePaintJob: state.updatePaintJob,
  }));
  const queue = useMemo(() => entityToList(paintQueue), [paintQueue]);
  const stats = useMemo(
    () => ({
      scheduled: queue.filter((job) => job.status === "scheduled").length,
      mixing: queue.filter((job) => job.status === "mixing").length,
      ready: queue.filter((job) => job.status === "ready").length,
    }),
    [queue],
  );

  return (
    <section className="rounded-2xl border border-border bg-panel/95 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted">{KANBAN_TEXT.headings.inkEyebrow}</p>
          <h2 className="text-sm font-semibold text-foreground">{KANBAN_TEXT.headings.inkTitle}</h2>
        </div>
        <div className="flex gap-2 text-xs text-muted">
          <span className="rounded-full border border-border/60 px-3 py-1">
            {KANBAN_TEXT.statuses.paint.scheduled} {stats.scheduled}
          </span>
          <span className="rounded-full border border-border/60 px-3 py-1">
            {KANBAN_TEXT.statuses.paint.mixing} {stats.mixing}
          </span>
          <span className="rounded-full border border-border/60 px-3 py-1">
            {KANBAN_TEXT.statuses.paint.ready} {stats.ready}
          </span>
        </div>
      </div>
      <div className="space-y-3 p-4">
        {queue.map((job) => (
          <article key={job.id} className="rounded-2xl border border-border/60 bg-background/80 p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-foreground">{job.name}</p>
                <p className="text-xs text-muted">{job.colors.join(", ")}</p>
              </div>
              <select
                className={["rounded-full border px-3 py-1 text-[11px] font-semibold", PAINT_PILL[job.status]].join(" ")}
                aria-label={`${job.name} ${KANBAN_TEXT.labels.statusChange}`}
                value={job.status}
                onChange={(event) => updatePaintJob(job.id, { status: event.target.value as PaintJob["status"] })}
              >
                {(["scheduled", "mixing", "ready"] as PaintJob["status"][]).map((status) => (
                  <option key={status} value={status}>
                    {paintLabel(status)}
                  </option>
                ))}
              </select>
            </div>
            <label className="mt-3 block text-xs text-muted">
              {KANBAN_TEXT.labels.scheduleNote}
              <textarea
                className="mt-1 w-full rounded-lg border border-border bg-panel px-3 py-2 text-sm text-foreground"
                value={job.schedule}
                onChange={(event) => updatePaintJob(job.id, { schedule: event.target.value })}
              />
            </label>
          </article>
        ))}
        {!queue.length && (
          <p className="rounded-2xl border border-dashed border-border/60 bg-background/60 p-6 text-center text-xs text-muted">
            {KANBAN_TEXT.empty.noInk}
          </p>
        )}
      </div>
    </section>
  );
}

const paintLabel = (status: PaintJob["status"]) => KANBAN_TEXT.statuses.paint[status];


