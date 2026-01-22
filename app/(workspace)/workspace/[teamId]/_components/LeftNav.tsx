import clsx from "clsx";
import { ChevronDown, ChevronRight, Share2 } from "lucide-react";
import type { Team } from "@/types/workspace";
import { shortcuts } from "@/workspace/root-model/workspaceData";

type LeftNavView = "projects" | "recent" | "favorites";

interface LeftNavProps {
  teams: Team[];
  teamsOpen: boolean;
  onToggleTeams: () => void;
  onAddTeam: () => void;
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
  activeView,
  onChangeView,
  favoriteCount,
  recentCount,
  onSelectTeam,
}: LeftNavProps) => (
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
        {teams.map((team) => (
          <button
            key={team.id}
            type="button"
            className={clsx(
              "w-full rounded-2xl border border-border px-4 py-3 text-left transition",
              team.active ? "bg-accent/30 text-foreground shadow-[0_3px_12px_rgba(0,0,0,0.04)]" : "hover:bg-accent"
            )}
            onClick={() => onSelectTeam(team.id)}
          >
            <span className="text-[14px] font-semibold tracking-wide">{team.name}</span>
          </button>
        ))}
        <button
          type="button"
          className="w-full rounded-2xl border border-dashed border-border px-4 py-3 text-left text-[13px] font-medium tracking-wide text-muted transition hover:bg-accent hover:text-foreground"
          onClick={onAddTeam}
        >
          + New Team
        </button>
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

export default LeftNav;

