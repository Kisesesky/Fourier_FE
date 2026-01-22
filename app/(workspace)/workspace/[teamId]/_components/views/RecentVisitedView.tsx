'use client';

import { useState } from "react";
import { ExternalLink, LayoutGrid, List, Star } from "lucide-react";
import { recentVisited } from "@/workspace/root-model/workspaceData";

const RecentVisitedView = () => {
  const [layout, setLayout] = useState<"grid" | "list">("grid");

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.4em] text-muted">History</p>
          <h2 className="text-3xl font-semibold text-foreground">Recently visited</h2>
          <p className="text-sm text-muted">Jump back into a project, resource, or plan instantly.</p>
        </div>
        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-muted">
          <button className="rounded-full border border-border px-3 py-1.5 transition hover:bg-accent hover:text-foreground">Projects</button>
          <button className="rounded-full border border-border px-3 py-1.5 transition hover:bg-accent hover:text-foreground">Resources</button>
          <button className="rounded-full border border-border px-3 py-1.5 transition hover:bg-accent hover:text-foreground">Plans</button>
          <div className="ml-3 flex items-center gap-1">
            <button
              type="button"
              className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                layout === "grid" ? "border-foreground text-foreground" : "border-border text-muted hover:text-foreground"
              }`}
              aria-label="Grid layout"
              onClick={() => setLayout("grid")}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                layout === "list" ? "border-foreground text-foreground" : "border-border text-muted hover:text-foreground"
              }`}
              aria-label="List layout"
              onClick={() => setLayout("list")}
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {layout === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {recentVisited.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.id}
                className="group flex items-center justify-between rounded-[26px] border border-border bg-panel px-5 py-4 text-foreground shadow-[0_3px_12px_rgba(0,0,0,0.05)]"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-muted">
                    <Icon size={18} />
                  </span>
                  <div>
                    <p className="text-lg font-semibold">{item.title}</p>
                    <p className="text-sm text-muted">{item.description}</p>
                    <p className="text-xs text-muted">{item.visited}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <span className="rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-muted">
                    {item.tag}
                  </span>
                  <div className="flex items-center gap-2 text-muted">
                    <button className="hover:text-foreground" aria-label="Open">
                      <ExternalLink size={16} />
                    </button>
                    <button className="hover:text-foreground" aria-label="Favorite">
                      <Star size={14} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {recentVisited.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.id}
                className="flex items-center justify-between rounded-2xl border border-border bg-panel px-5 py-3 text-foreground"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-muted">
                    <Icon size={16} />
                  </span>
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-sm text-muted">{item.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted">
                  <span className="rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-[0.3em]">
                    {item.tag}
                  </span>
                  <span>{item.visited}</span>
                  <button className="hover:text-foreground" aria-label="Open">
                    <ExternalLink size={16} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default RecentVisitedView;

