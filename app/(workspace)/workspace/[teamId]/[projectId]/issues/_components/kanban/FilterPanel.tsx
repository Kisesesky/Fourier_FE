import { useKanban } from "@/workspace/issues/_model/store";
import type { TimelineFilter, VendorFilter } from "@/workspace/issues/_model/kanbanTypes";
import { X } from "lucide-react";

import { KANBAN_TEXT } from "./text";
import { timelineFilterLabel, vendorFilterLabel } from "./utils";

export function FilterPanel() {
  const { ui, filters, closeFilterPanel, setTimelineFilter, setVendorFilter } = useKanban((state) => ({
    ui: state.ui,
    filters: state.filters,
    closeFilterPanel: state.closeFilterPanel,
    setTimelineFilter: state.setTimelineFilter,
    setVendorFilter: state.setVendorFilter,
  }));

  if (!ui.filterPanel) return null;
  const panelType = ui.filterPanel;
  const isTimeline = panelType === "timeline";
  const options = isTimeline
    ? (["all", "planned", "in-progress", "at-risk", "blocked", "done"] as TimelineFilter[])
    : (["all", "planned", "in-progress", "delayed"] as VendorFilter[]);
  const active = isTimeline ? filters.timeline : filters.vendor;

  const handleSelect = (value: TimelineFilter | VendorFilter) => {
    if (isTimeline) {
      setTimelineFilter(value as TimelineFilter);
    } else {
      setVendorFilter(value as VendorFilter);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 px-4 py-6 sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-border bg-panel p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted">{KANBAN_TEXT.actions.filter}</p>
            <h3 className="text-sm font-semibold">
              {isTimeline ? KANBAN_TEXT.headings.planningTitle : KANBAN_TEXT.headings.subcontractTitle}
            </h3>
          </div>
          <button
            type="button"
            onClick={closeFilterPanel}
            className="rounded-full border border-border p-1 text-muted hover:text-foreground"
            aria-label="Close filter panel"
          >
            <X size={14} />
          </button>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {options.map((option) => {
            const isActive = option === active;
            const label = isTimeline
              ? timelineFilterLabel(option as TimelineFilter)
              : vendorFilterLabel(option as VendorFilter);
            return (
              <button
                key={option}
                type="button"
                onClick={() => handleSelect(option)}
                className={[
                  "rounded-xl border px-3 py-2 text-sm font-medium transition",
                  isActive ? "border-brand bg-brand/10 text-brand" : "border-border text-muted hover:text-foreground",
                ].join(" ")}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}


