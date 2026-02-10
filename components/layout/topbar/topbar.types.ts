// components/layout/topbar/topbar.types.ts

export type TopbarProps = {
  onToggleSidebarCollapse?: () => void;
  sidebarCollapsed?: boolean;
  workspaceMode?: boolean;
  onWorkspaceSettings?: () => void;
  onOpenWorkspaceNav?: () => void;
};

export type WorkspaceTab = {
  id: string;
  label: string;
  href: string;
  closable?: boolean;
};
