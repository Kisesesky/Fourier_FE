// components/worksheet/WorksheetListView.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useWorksheet } from "@/workspace/worksheet/_model/store";
import type { WorksheetMeta, WorksheetStatus } from "@/workspace/worksheet/_model/types";
import { STATUS_LABEL, formatRelative } from "./shared";

type WorksheetTableProps = {
  rows: WorksheetMeta[];
  onOpen: (id: string) => void;
  emptyLabel?: string;
};

function WorksheetTable({ rows, onOpen, emptyLabel = "No worksheets yet" }: WorksheetTableProps) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-accent/40 py-16 text-sm text-muted">
        <p className="font-medium text-foreground/80">{emptyLabel}</p>
        <p className="mt-1 text-xs">Create your first worksheet to centralize checklists, matrices, and more.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-panel shadow">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-accent/50 text-muted">
          <tr className="text-left">
            <th className="px-4 py-2 font-medium">Title</th>
            <th className="px-4 py-2 font-medium">Owner</th>
            <th className="px-4 py-2 font-medium">Updated</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const badge = STATUS_LABEL[row.status];
            return (
              <tr key={row.id} className="cursor-pointer border-t border-border/60 hover:bg-accent/60" onClick={() => onOpen(row.id)}>
                <td className="px-4 py-2">
                  <div className="font-medium text-foreground/90">{row.title}</div>
                  <div className="text-xs text-muted">{row.id}</div>
                </td>
                <td className="px-4 py-2">{row.ownerName}</td>
                <td className="px-4 py-2 text-muted">{formatRelative(row.updatedAt)}</td>
                <td className="px-4 py-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                    {badge.label}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpen(row.id);
                    }}
                    className="text-xs font-medium text-brand hover:underline"
                  >
                    Open
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function WorksheetListView() {
  const router = useRouter();
  const { worksheets, createWorksheet, setActiveWorksheet } = useWorksheet((state) => ({
    worksheets: state.worksheets,
    createWorksheet: state.createWorksheet,
    setActiveWorksheet: state.setActiveWorksheet,
  }));
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<WorksheetStatus | "all">("all");

  const sortedRows = useMemo(() => [...worksheets].sort((a, b) => b.updatedAt - a.updatedAt), [worksheets]);
  const filteredRows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return sortedRows.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) {
        return false;
      }
      if (!term) return true;
      return `${row.title} ${row.ownerName} ${row.id}`.toLowerCase().includes(term);
    });
  }, [sortedRows, query, statusFilter]);
  const hasFilters = query.trim().length > 0 || statusFilter !== "all";

  const handleOpen = (id: string) => {
    setActiveWorksheet(id);
    router.push(`/worksheet/${id}`);
  };

  const handleCreate = () => {
    const id = createWorksheet();
    setActiveWorksheet(id);
    router.push(`/worksheet/${id}`);
  };

  const resetFilters = () => {
    setQuery("");
    setStatusFilter("all");
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-start justify-between gap-4 px-4 py-6 sm:px-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Worksheet</p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">Worksheet hub</h1>
          <p className="mt-1 text-sm text-muted">
            Manage checklists, matrices, and experiments from one place. Open any worksheet to jump into its dedicated workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleCreate} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent/60">
            New Worksheet
          </button>
          <button className="rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:bg-accent/60" disabled>
            Template Gallery
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto px-4 py-6 sm:px-6">
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground/90">Recently Updated</h2>
              <p className="text-xs text-muted">Click a worksheet row to open the detailed editor view.</p>
              <p className="mt-1 text-[11px] text-muted">
                Showing {filteredRows.length} of {sortedRows.length} worksheets
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-48 rounded-md border border-border bg-accent/60 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand/60"
                placeholder="Search worksheets"
              />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as WorksheetStatus | "all")}
                className="rounded-md border border-border bg-accent/60 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand/60"
              >
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="in-review">In Review</option>
                <option value="done">Done</option>
              </select>
              {hasFilters && (
                <button
                  onClick={resetFilters}
                  className="rounded-md border border-border px-2 py-1 text-xs text-muted hover:bg-accent/60"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <WorksheetTable
            rows={filteredRows}
            onOpen={handleOpen}
            emptyLabel={sortedRows.length ? "No worksheets match the current filters." : "No worksheets yet"}
          />
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Data Table",
              description: "Structure product or operations data with sort, filter, and linkage.",
            },
            {
              title: "Checklist",
              description: "Collaborative task lists that stay in sync across the team.",
            },
            {
              title: "Insight Board",
              description: "Transform worksheet data into charts and KPI snapshots quickly.",
            },
          ].map((card) => (
            <article
              key={card.title}
              className="rounded-xl border border-border bg-panel/50 p-4 shadow-sm transition hover:border-brand/60 hover:shadow-md"
            >
              <h3 className="text-sm font-semibold text-foreground/90">{card.title}</h3>
              <p className="mt-2 text-xs text-muted">{card.description}</p>
              <button className="mt-4 text-xs font-medium text-muted" disabled>
                Coming soon
              </button>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
