import clsx from "clsx";

const tabs = ["Projects", "Activities", "Members", "Settings"] as const;
export type TabType = (typeof tabs)[number];

interface WorkspaceTabsProps {
  activeTab: TabType;
  onChange: (tab: TabType) => void;
}

const WorkspaceTabs = ({ activeTab, onChange }: WorkspaceTabsProps) => (
  <div className="border-b border-border">
    <div className="flex flex-wrap items-center gap-6 text-sm text-muted">
      {tabs.map((tab) => (
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

export { tabs };
export type { WorkspaceTabsProps };
export default WorkspaceTabs;

