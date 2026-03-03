// app/(workspace)/workspace/[teamId]/_model/hooks/useLeftNavState.ts
import { useEffect, useMemo, useRef, useState } from "react";
import { ACTIVE_WORKSPACE_ID_KEY, WORKSPACE_EVENTS } from "@/hooks/workspace.constants";
import { useWorkspace } from "@/hooks/useWorkspace";

export function useLeftNavState(teams: Array<{ id: string; active?: boolean }>, onNavigate?: () => void) {
  const [openMenuTeamId, setOpenMenuTeamId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { workspaces, workspace, activeWorkspaceId, setActiveWorkspaceId } = useWorkspace();
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const workspaceMenuRef = useRef<HTMLDivElement | null>(null);
  const teamRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  useEffect(() => {
    const activeTeam = teams.find((team) => team.active);
    if (!activeTeam) return;
    const element = teamRefs.current.get(activeTeam.id);
    if (element) {
      element.scrollIntoView({ block: "nearest", behavior: "smooth" });
      element.focus();
    }
  }, [teams]);

  useEffect(() => {
    if (!openMenuTeamId) return;
    const onClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setOpenMenuTeamId(null);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [openMenuTeamId]);

  useEffect(() => {
    if (!workspaceMenuOpen) return;
    const onClick = (event: MouseEvent) => {
      if (!workspaceMenuRef.current) return;
      if (!workspaceMenuRef.current.contains(event.target as Node)) {
        setWorkspaceMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [workspaceMenuOpen]);

  const teamInitials = useMemo(
    () => (name: string) =>
      name
        .split(/\s+/)
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase(),
    [],
  );

  const selectWorkspace = (workspaceId: string) => {
    localStorage.setItem(ACTIVE_WORKSPACE_ID_KEY, workspaceId);
    setActiveWorkspaceId(workspaceId);
    window.dispatchEvent(new CustomEvent(WORKSPACE_EVENTS.SELECT, { detail: { workspaceId } }));
    window.dispatchEvent(new Event("teams:refresh"));
    setWorkspaceMenuOpen(false);
    onNavigate?.();
  };

  return {
    openMenuTeamId,
    setOpenMenuTeamId,
    menuRef,
    workspaces,
    workspace,
    activeWorkspaceId,
    workspaceMenuOpen,
    setWorkspaceMenuOpen,
    workspaceMenuRef,
    teamRefs,
    teamInitials,
    selectWorkspace,
  };
}

