// app/(workspace)/workspace/[teamId]/_components/WorkspaceTabs.tsx
import clsx from "clsx";
import { WORKSPACE_TABS } from "../_model/constants/workspace-tabs.constants";

export type TabType = (typeof WORKSPACE_TABS)[number];

interface WorkspaceTabsProps {
  activeTab: TabType;
  onChange: (tab: TabType) => void;
}

const WorkspaceTabs = ({ activeTab, onChange }: WorkspaceTabsProps) => (
  <div className="border-b border-border">
    <div className="flex flex-wrap items-center gap-6 text-sm text-muted">
      {WORKSPACE_TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          className={clsx(
            "pb-4 text-[12px] font-semibold uppercase tracking-[0.4em]",
            tab === activeTab ? "text-foreground" : "text-muted hover:text-foreground"
          )}
          onClick={() => onChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  </div>
);

export const tabs = WORKSPACE_TABS;
export type { WorkspaceTabsProps };
export default WorkspaceTabs;
