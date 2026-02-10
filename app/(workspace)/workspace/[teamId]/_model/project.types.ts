// app/(workspace)/workspace/[teamId]/_model/project.types.ts

import type { LucideIcon } from "lucide-react";
import type { Project, ProjectViewMode } from "@/types/workspace";

export type ProjectCardProps = {
  project: Project;
  viewMode: ProjectViewMode;
  isStarred: boolean;
  onToggleStar: (id: string) => void;
  onOpenMenu: (id: string) => void;
  onOpenProject?: (id: string) => void;
  hideActions?: boolean;
};

export type ProjectMenuItem = {
  label: string;
  icon: LucideIcon;
  className?: string;
  action: () => void;
};

export type ProjectMenuProps = {
  onClose: () => void;
  onEdit: () => void;
  onClone: () => void;
  onDelete: () => void;
};

export type ProjectToolbarProps = {
  viewMode: ProjectViewMode;
  onChangeView: (mode: ProjectViewMode) => void;
  onCreateProject?: () => void;
  onImportProject?: () => void;
};
