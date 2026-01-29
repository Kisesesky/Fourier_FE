import clsx from "clsx";
import { LayoutGrid, List, Plus, Upload } from "lucide-react";
import type { ProjectViewMode } from "@/types/workspace";

const viewModes = [
  { id: "grid", icon: LayoutGrid, label: "Grid" },
  { id: "list", icon: List, label: "List" },
] as const;

interface ProjectToolbarProps {
  viewMode: ProjectViewMode;
  onChangeView: (mode: ProjectViewMode) => void;
  onCreateProject?: () => void;
  onImportProject?: () => void;
}

const ProjectToolbar = ({ viewMode, onChangeView, onCreateProject, onImportProject }: ProjectToolbarProps) => (
  <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
    <div className="flex items-center gap-2">
      {viewModes.map((mode) => {
        const Icon = mode.icon;
        return (
          <button
            key={mode.id}
            type="button"
            className={clsx(
              "inline-flex h-12 w-12 items-center justify-center rounded-[10px] border border-border bg-panel",
              viewMode === mode.id ? "text-foreground" : "text-muted hover:bg-accent"
            )}
            aria-label={mode.label}
            onClick={() => onChangeView(mode.id)}
          >
            <Icon size={16} />
          </button>
        );
      })}
    </div>
    <div className="flex items-center gap-3 text-sm">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-foreground transition hover:bg-accent"
        onClick={onImportProject}
      >
        <Upload size={16} />
        Import Project
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full bg-[#e7cfac] px-5 py-2 text-[#1f1507] transition hover:bg-[#dcbf93]"
        onClick={onCreateProject}
      >
        <Plus size={16} />
        New Project
      </button>
    </div>
  </div>
);

export default ProjectToolbar;

