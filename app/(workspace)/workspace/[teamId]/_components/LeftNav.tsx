// app/(workspace)/workspace/[teamId]/_components/LeftNav.tsx
'use client';

import clsx from "clsx";
import { ChevronDown, ChevronRight, MoreHorizontal, Share2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Team } from "@/types/workspace";
import { shortcuts } from "@/workspace/root-model/workspaceData";

type LeftNavView = "projects" | "recent" | "favorites";

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
  onSelectTeam: (teamId: string) => void;
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
  onSelectTeam,
}: LeftNavProps) => {
  const [openMenuTeamId, setOpenMenuTeamId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

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

  return (
    <aside className="hidden w-80 shrink-0 flex-col border-r border-border bg-panel px-6 py-6 text-sm text-muted transition-colors md:flex">
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
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-accent text-[11px] text-foreground">
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
                  className={clsx(
                    "group relative w-full rounded-2xl border border-border px-4 py-3 text-left transition",
                    team.active ? "bg-accent/30 text-foreground shadow-[0_3px_12px_rgba(0,0,0,0.04)]" : "hover:bg-accent"
                  )}
                  onClick={() => onSelectTeam(team.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-border bg-panel text-[11px] font-semibold text-muted">
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
        const isActive =
          (isRecent && activeView === "recent") || (isFavorite && activeView === "favorites");
        const hintValue = isFavorite
          ? favoriteCount.toString()
          : isRecent
            ? recentCount.toString()
            : item.hint;
        return (
          <button
            key={item.id}
            type="button"
            className={clsx(
              "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition",
              isActive ? "bg-accent text-foreground" : "text-muted hover:bg-accent"
            )}
            onClick={() => onChangeView(isRecent ? "recent" : isFavorite ? "favorites" : "projects")}
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

    <div className="mt-auto border-t border-border pt-6">
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm text-muted transition hover:bg-accent"
      >
        <span className="font-medium tracking-wide">Organizations</span>
        <Share2 size={14} />
      </button>
    </div>
  </aside>
  );
};

export default LeftNav;
