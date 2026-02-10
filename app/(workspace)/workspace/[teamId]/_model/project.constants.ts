// app/(workspace)/workspace/[teamId]/_model/project.constants.ts

import { Copy, LayoutGrid, List, Pencil, Trash2 } from "lucide-react";
import type { ProjectViewMode } from "@/types/workspace";
import type { ProjectMenuItem } from "@/app/(workspace)/workspace/[teamId]/_model/project.types";

export const PROJECT_VIEW_MODES: Array<{
  id: ProjectViewMode;
  icon: typeof LayoutGrid;
  label: string;
}> = [
  { id: "grid", icon: LayoutGrid, label: "Grid" },
  { id: "list", icon: List, label: "List" },
];

export const PROJECT_STATUS_TONE = {
  ACTIVE: "text-emerald-400 border-emerald-500/40",
  DRAFT: "text-amber-300 border-amber-400/40",
  ARCHIVED: "text-rose-300 border-rose-400/40",
  DEFAULT: "text-emerald-400 border-emerald-500/40",
} as const;

export function buildProjectMenuItems(
  onEdit: () => void,
  onClone: () => void,
  onDelete: () => void,
): ProjectMenuItem[] {
  return [
    { label: "Edit", icon: Pencil, action: onEdit },
    { label: "Clone Project", icon: Copy, action: onClone },
    { label: "Delete Project", icon: Trash2, className: "text-red-300", action: onDelete },
  ];
}
