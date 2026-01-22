import clsx from "clsx";
import { ExternalLink, Grid2x2, MoreHorizontal, Star } from "lucide-react";
import type { KeyboardEvent } from "react";
import type { Project, ProjectViewMode } from "@/types/workspace";

interface ProjectCardProps {
  project: Project;
  viewMode: ProjectViewMode;
  isStarred: boolean;
  onToggleStar: (id: string) => void;
  onOpenMenu: (id: string) => void;
  onOpenProject?: (id: string) => void;
}

const ProjectCard = ({ project, viewMode, isStarred, onToggleStar, onOpenMenu, onOpenProject }: ProjectCardProps) => {
  const handleOpen = () => onOpenProject?.(project.id);
  const handleKeyOpen = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpen();
    }
  };

  if (viewMode === "list") {
    return (
      <article
        className="group flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-panel px-5 py-4 text-foreground transition hover:border-border/80 hover:shadow-[0_3px_10px_rgba(0,0,0,0.08)]"
        role="button"
        tabIndex={0}
        onClick={handleOpen}
        onKeyDown={handleKeyOpen}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5e46e0] via-[#4330b8] to-[#2c246d]">
            <Grid2x2 size={18} />
          </span>
          <div>
            <h3 className="font-semibold">{project.title}</h3>
            <p className="text-xs text-muted">{project.tag}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-muted">
          <button
            className="hover:text-foreground"
            aria-label="Open"
            onClick={(event) => {
              event.stopPropagation();
              handleOpen();
            }}
          >
            <ExternalLink size={16} />
          </button>
          <button
            className={clsx(isStarred && "text-amber-300")}
            onClick={(event) => {
              event.stopPropagation();
              onToggleStar(project.id);
            }}
            aria-label="Star project"
          >
            <Star size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenMenu(project.id);
            }}
            aria-label="More actions"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </article>
    );
  }

  return (
    <article
      className="group flex h-[220px] w-[260px] cursor-pointer flex-col justify-between rounded-[26px] border border-border bg-panel p-5 text-sm text-foreground shadow-[0_4px_14px_rgba(0,0,0,0.05)] transition hover:border-border/80 hover:shadow-[0_6px_18px_rgba(0,0,0,0.08)]"
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={handleKeyOpen}
    >
      <div>
        <h3 className="text-2xl font-semibold">{project.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm text-muted">{project.description}</p>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-muted">
        <span className="rounded-full border border-border px-3 py-1 text-muted">{project.tag}</span>
        <span className="text-[10px] uppercase tracking-[0.4em]">Live</span>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-muted opacity-0 transition group-hover:opacity-100">
        <button
          className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs hover:text-foreground"
          aria-label="Open"
          onClick={(event) => {
            event.stopPropagation();
            handleOpen();
          }}
        >
          <ExternalLink size={14} /> Open
        </button>
        <div className="flex items-center gap-3">
          <button
            className={clsx(isStarred && "text-amber-300")}
            onClick={(event) => {
              event.stopPropagation();
              onToggleStar(project.id);
            }}
            aria-label="Star project"
          >
            <Star size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenMenu(project.id);
            }}
            aria-label="More actions"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProjectCard;

