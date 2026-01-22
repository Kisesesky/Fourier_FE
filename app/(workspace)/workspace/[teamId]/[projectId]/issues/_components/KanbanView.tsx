"use client";

import { useKanban } from "@/workspace/issues/_model/store";
import type { SummaryStat } from "@/workspace/issues/_model/kanbanTypes";
import type { ComponentType } from "react";
import { useEffect, useMemo } from "react";

import { FilterPanel } from "./kanban/FilterPanel";
import { JobSheetDialog } from "./kanban/JobSheetDialog";
import { JobSheetSection } from "./kanban/JobSheetSection";
import { KANBAN_TEXT } from "./kanban/text";
import { PaintingSection } from "./kanban/PaintingSection";
import { PlanningSection } from "./kanban/PlanningSection";
import { ResourceSection } from "./kanban/ResourceSection";
import { SubcontractSection } from "./kanban/SubcontractSection";

export default function KanbanView() {
  const { tabs, activeTab, setActiveTab, initRealtime, announcements, productionStats } = useKanban((state) => ({
    tabs: state.tabs,
    activeTab: state.activeTab,
    setActiveTab: state.setActiveTab,
    initRealtime: state.initRealtime,
    announcements: state.announcements,
    productionStats: state.productionStats,
  }));

  useEffect(() => {
    initRealtime();
  }, [initRealtime]);

  const shellSummaries = useMemo(() => productionStats.slice(0, 3), [productionStats]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background text-foreground">
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcements.slice(-1).map((item) => (
          <span key={item.id}>{item.message}</span>
        ))}
      </div>

      <KanbanHeader
        tabs={tabs}
        activeTab={activeTab}
        onSelectTab={(id) => setActiveTab(id as typeof activeTab)}
        summaries={shellSummaries}
      />

      <div className="relative flex min-h-0 flex-1 flex-col bg-background">
        <section className="flex-1 px-4 py-6 sm:px-10">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-10">
            {activeTab === "production" && <PlanningSection />}
            {activeTab === "jobSheet" && <JobSheetSection />}
            {activeTab === "painting" && <PaintingSection />}
            {activeTab === "subcontract" && <SubcontractSection />}
            {activeTab === "resource" && <ResourceSection />}
          </div>
        </section>
      </div>

      <FilterPanel />
      <JobSheetDialog />
    </div>
  );
}

type KanbanHeaderProps = {
  tabs: Array<{ id: string; label: string; icon: ComponentType<{ size?: number | string }> }>;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  summaries: Pick<SummaryStat, "title" | "value" | "helper">[];
};

function KanbanHeader({ tabs, activeTab, onSelectTab, summaries }: KanbanHeaderProps) {
  return (
    <header className="border-b border-border bg-panel">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.3em] text-muted">{KANBAN_TEXT.headings.planningEyebrow}</p>
            <h1 className="text-2xl font-semibold text-foreground">{KANBAN_TEXT.headings.planningTitle}</h1>
            <p className="text-sm text-muted">{KANBAN_TEXT.headings.planningSubtitle}</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            {summaries.map((stat) => (
              <div key={stat.title} className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted">{stat.title}</p>
                <p className="text-base font-semibold text-foreground">{stat.value}</p>
                <p className="text-[11px] text-muted">{stat.helper}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-border bg-panel/80">
        <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-10">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  className={[
                    "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
                    isActive
                      ? "border-brand bg-brand text-white shadow"
                      : "border-border bg-background/80 text-muted hover:border-brand/40 hover:text-foreground",
                  ].join(" ")}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
