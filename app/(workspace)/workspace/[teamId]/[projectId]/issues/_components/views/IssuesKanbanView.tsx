"use client";

import type { Issue } from "@/workspace/issues/_model/types";

export default function IssuesKanbanView({
  columns,
  grouped,
  onOpenIssue,
}: {
  columns: Array<{ key: Issue["status"]; label: string }>;
  grouped: Map<Issue["status"], Issue[]>;
  onOpenIssue: (issueId: string) => void;
}) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
      {columns.map((col) => {
        const items = grouped.get(col.key) ?? [];
        return (
          <div
            key={col.key}
            className={[
              "flex min-h-0 flex-col rounded-xl border border-border p-3",
              col.key === "done"
                ? "bg-emerald-500/10"
                : col.key === "in_progress"
                  ? "bg-amber-500/10"
                  : col.key === "review"
                    ? "bg-violet-500/10"
                    : "bg-rose-500/10",
            ].join(" ")}
          >
            <div className="flex items-center justify-between pb-2">
              <span className="text-sm font-semibold">{col.label}</span>
              <span className="rounded-full bg-background/70 px-2 py-0.5 text-xs text-muted">{items.length}</span>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
              {items.length === 0 && (
                <div className="rounded-lg border border-dashed border-border/60 bg-background/70 p-3 text-xs text-muted">
                  이슈가 없습니다.
                </div>
              )}
              {items.map((issue) => (
                <button
                  key={issue.id}
                  type="button"
                  onClick={() => onOpenIssue(issue.id)}
                  className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-white/90 p-3 text-left shadow-sm transition hover:border-brand/50 hover:bg-white"
                >
                  <div className="text-sm font-semibold text-foreground line-clamp-2">{issue.title}</div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-subtle text-xs font-semibold text-muted">
                    {(issue.assignee || "U").slice(0, 1).toUpperCase()}
                  </div>
                </button>
              ))}
              <button
                type="button"
                className="rounded-lg border border-dashed border-border/60 bg-background/70 px-3 py-2 text-left text-xs text-muted hover:bg-subtle/60"
              >
                + 추가
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
