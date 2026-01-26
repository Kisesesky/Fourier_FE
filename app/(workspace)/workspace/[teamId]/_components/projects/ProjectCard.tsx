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
  const status = project.status ?? project.tag ?? "ACTIVE";
  const statusTone =
    status === "ACTIVE"
      ? "text-emerald-400 border-emerald-500/40"
      : status === "DRAFT"
        ? "text-amber-300 border-amber-400/40"
        : "text-rose-300 border-rose-400/40";

  if (viewMode === "list") {
    return (
      <article
        className="group flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-panel px-5 py-4 text-foreground transition hover:border-border/80 hover:shadow-[0_3px_10px_rgba(0,0,0,0.08)]"
        role="button"
        tabIndex={0}
        onClick={handleOpen}
        onKeyDown={handleKeyOpen}
      >
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl">
            {project.iconValue ? (
              <img src={project.iconValue} alt={`${project.title} icon`} className="h-full w-full object-cover" />
            ) : (
              <Grid2x2 size={18} />
            )}
          </span>
          <div className="flex flex-1 items-center justify-between">
            <div>
            <h3 className="font-semibold">
              {project.title.endsWith("'s Project") ? project.title : `${project.title}'s Project`}
            </h3>
              <div className="mt-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-muted">
                <span className={clsx("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px]", statusTone)}>
                  {status}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3 text-muted opacity-0 transition group-hover:opacity-100">
          <button
            className="text-muted transition group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onOpenMenu(project.id);
            }}
            aria-label="More actions"
          >
            <MoreHorizontal size={18} />
          </button>
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
            className={isStarred ? "text-amber-300" : "text-muted"}
            onClick={(event) => {
              event.stopPropagation();
              onToggleStar(project.id);
            }}
            aria-label="Star project"
          >
            <Star size={16} className={isStarred ? "fill-amber-300" : ""} />
          </button>
        </div>
      </article>
    );
  }

  return (
    <article
      className="group flex h-[280px] w-full cursor-pointer flex-col justify-between rounded-[28px] border border-border bg-panel p-6 text-sm text-foreground shadow-[0_4px_14px_rgba(0,0,0,0.05)] transition hover:border-border/80 hover:shadow-[0_6px_18px_rgba(0,0,0,0.08)]"
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={handleKeyOpen}
    >
      <div className="grid grid-cols-[72px,1fr] items-start gap-4">
        <div className="space-y-3">
          <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl">
            {project.iconValue ? (
              <img src={project.iconValue} alt={`${project.title} icon`} className="h-full w-full object-cover" />
            ) : (
              <Grid2x2 size={18} />
            )}
          </span>
        </div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-2xl font-semibold">
              {project.title.endsWith("'s Project") ? project.title : `${project.title}'s Project`}
            </h3>
            <div className="mt-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-muted">
              <span className={clsx("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px]", statusTone)}>
                {status}
              </span>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenMenu(project.id);
            }}
            aria-label="More actions"
            className="text-muted opacity-0 transition group-hover:opacity-100"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
        <div className="col-span-2 rounded-2xl border border-border bg-accent/40 p-3">
            <p className="mt-2 line-clamp-3 text-sm text-muted">{project.description}</p>
        </div>
      </div>
      <div>
        <div className="mt-3 flex items-center justify-between text-muted opacity-0 transition group-hover:opacity-100">
          <button
            className={isStarred ? "text-amber-300" : "text-muted"}
            onClick={(event) => {
              event.stopPropagation();
              onToggleStar(project.id);
            }}
            aria-label="Star project"
          >
            <Star size={16} className={isStarred ? "fill-amber-300" : ""} />
          </button>
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
        </div>
      </div>
    </article>
  );
};

export default ProjectCard;
