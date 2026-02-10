// app/(workspace)/workspace/[teamId]/_components/LeftNav.tsx
'use client';

import clsx from "clsx";
import { ChevronDown, ChevronRight, MoreHorizontal } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Team } from "@/types/workspace";
import { shortcuts } from "@/workspace/root-model/workspace.constants";
import { useWorkspace } from "@/hooks/useWorkspace";

type LeftNavView = "projects" | "recent" | "favorites" | "friends";

interface LeftNavProps {
  teams: Team[];
  teamsOpen: boolean;
  onToggleTeams: () => void;
  onAddTeam: () => void;
  onRenameTeam?: (teamId: string, name: string) => void;
  onDeleteTeam?: (teamId: string, name: string) => void;
  activeView: LeftNavView;
  onChangeView: (view: LeftNavView) => void;
  favoriteCount: number;
  recentCount: number;
  friendCount: number;
  onSelectTeam: (teamId: string) => void;
  variant?: "sidebar" | "panel";
  className?: string;
  onNavigate?: () => void;
}

const LeftNav = ({
  teams,
  teamsOpen,
  onToggleTeams,
  onAddTeam,
  onRenameTeam,
  onDeleteTeam,
  activeView,
  onChangeView,
  favoriteCount,
  recentCount,
  friendCount,
  onSelectTeam,
  variant = "sidebar",
  className,
  onNavigate,
}: LeftNavProps) => {
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
    []
  );

  const containerClass =
    variant === "panel"
      ? "flex h-full flex-col overflow-y-auto"
      : "w-80 shrink-0 flex-col border-r border-border bg-panel px-6 py-6 text-sm text-muted transition-colors md:sticky md:top-0 md:h-full md:overflow-y-auto md:flex md:w-64 lg:w-72 xl:w-80";

  return (
    <aside className={clsx(containerClass, className)}>
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">Workspace</p>
        <div className="relative mt-3" ref={workspaceMenuRef}>
          <button
            type="button"
            className={clsx(
              "flex w-full items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-foreground transition",
              workspaceMenuOpen ? "bg-accent" : "bg-panel hover:bg-accent"
            )}
            onClick={() => setWorkspaceMenuOpen((prev) => !prev)}
            aria-label="Select workspace"
          >
            <span className="truncate">{workspace?.name ?? "Workspace"}</span>
            <ChevronDown size={14} />
          </button>
          {workspaceMenuOpen && (
            <div className="absolute left-0 top-full z-20 mt-2 w-full rounded-2xl border border-border bg-panel p-2 text-sm shadow-xl">
              {workspaces.length === 0 ? (
                <p className="px-3 py-2 text-xs text-muted">워크스페이스가 없습니다.</p>
              ) : (
                workspaces.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={clsx(
                      "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-foreground hover:bg-accent",
                      activeWorkspaceId === item.id && "bg-accent/70"
                    )}
                  onClick={() => {
                    localStorage.setItem("activeWorkspaceId", item.id);
                    setActiveWorkspaceId(item.id);
                    window.dispatchEvent(new CustomEvent("workspace:select", { detail: { workspaceId: item.id } }));
                    window.dispatchEvent(new Event("teams:refresh"));
                    setWorkspaceMenuOpen(false);
                    onNavigate?.();
                  }}
                  >
                    <span className="font-medium">{item.name}</span>
                    {activeWorkspaceId === item.id && (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                        Active
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">
        <span>My Teams</span>
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted transition hover:text-foreground"
          onClick={onToggleTeams}
          aria-label="Toggle team list"
        >
          {teamsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>
      {teamsOpen && (
        <div className="mt-4 space-y-3">
          {teams.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-panel px-4 py-4 text-left text-xs text-muted">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-accent text-[11px] text-foreground">
                  팀
                </span>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-semibold text-foreground">팀이 없습니다</p>
                  <p className="text-xs text-muted">팀을 생성한 다음 진행해주세요.</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {teams.map((team) => (
                <div
                  key={team.id}
                  ref={(el) => {
                    teamRefs.current.set(team.id, el);
                  }}
                  className={clsx(
                    "group relative w-full rounded-2xl border border-border px-4 py-3 text-left transition",
                    team.active ? "bg-accent/30 text-foreground shadow-[0_3px_12px_rgba(0,0,0,0.04)]" : "hover:bg-accent"
                  )}
                  onClick={() => {
                    onSelectTeam(team.id);
                    onNavigate?.();
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-border bg-panel text-[11px] font-semibold text-muted">
                      {team.iconValue ? (
                        <img src={team.iconValue} alt={team.name} className="h-full w-full object-cover" />
                      ) : (
                        teamInitials(team.name)
                      )}
                    </span>
                    <span className="text-[14px] font-semibold tracking-wide">{team.name}'s Team</span>
                  </div>
                  <button
                    type="button"
                    className="absolute right-3 top-3 hidden rounded-full border border-border bg-panel p-1 text-muted transition hover:text-foreground group-hover:inline-flex"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuTeamId((prev) => (prev === team.id ? null : team.id));
                    }}
                    aria-label="Team actions"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                  {openMenuTeamId === team.id && (
                    <div
                      ref={menuRef}
                      className="absolute -right-1 top-12 z-30 w-40 rounded-2xl border border-border bg-panel/95 text-xs text-foreground shadow-2xl backdrop-blur"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-accent"
                        onClick={() => {
                          onRenameTeam?.(team.id, team.name);
                          setOpenMenuTeamId(null);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-red-300 hover:bg-accent"
                        onClick={() => {
                          onDeleteTeam?.(team.id, team.name);
                          setOpenMenuTeamId(null);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="w-full rounded-2xl border border-dashed border-border px-4 py-3 text-left text-[13px] font-medium tracking-wide text-muted transition hover:bg-accent hover:text-foreground"
                onClick={onAddTeam}
              >
                + New Team
              </button>
            </>
          )}
        </div>
      )}

    <div className="mt-8 space-y-2 border-t border-border pt-6">
      {shortcuts.map((item) => {
        const isRecent = item.id === "recent";
        const isFavorite = item.id === "favorite";
        const isFriends = item.id === "friends";
        const isActive =
          (isRecent && activeView === "recent") ||
          (isFavorite && activeView === "favorites") ||
          (isFriends && activeView === "friends");
        const hintValue = isFavorite
          ? favoriteCount.toString()
          : isRecent
            ? recentCount.toString()
            : isFriends
              ? friendCount.toString()
            : item.hint;
        return (
          <button
            key={item.id}
            type="button"
            className={clsx(
              "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition",
              isActive ? "bg-accent text-foreground" : "text-muted hover:bg-accent"
            )}
            onClick={() => {
              onChangeView(
                isRecent ? "recent" : isFavorite ? "favorites" : isFriends ? "friends" : "projects"
              );
              onNavigate?.();
            }}
          >
            <span className="flex items-center gap-2 text-[13px] font-medium">
              <item.icon size={14} className={clsx("text-muted", isActive && "text-foreground")} />
              {item.label}
            </span>
            {hintValue && <span className="text-[11px] text-muted">{hintValue}</span>}
          </button>
        );
      })}
    </div>

    
  </aside>
  );
};

export default LeftNav;
