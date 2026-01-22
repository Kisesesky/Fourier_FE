'use client';

import { useEffect, useMemo, useState } from "react";
import Topbar from "@/components/layout/Topbar";
import LeftNav from "@/workspace/root/LeftNav";
import WorkspaceTabs, { type TabType } from "@/workspace/root/WorkspaceTabs";
import InviteBanner from "@/workspace/root/InviteBanner";
import ProjectToolbar from "@/workspace/root/projects/ProjectToolbar";
import ProjectCard from "@/workspace/root/projects/ProjectCard";
import ProjectMenu from "@/workspace/root/projects/ProjectMenu";
import MembersView from "@/workspace/root/views/MembersView";
import SettingsView from "@/workspace/root/views/SettingsView";
import ActivitiesView from "@/workspace/root/views/ActivitiesView";
import WorkspaceSettingsModal from "@/workspace/root/WorkspaceSettingsModal";
import RecentVisitedView from "@/workspace/root/views/RecentVisitedView";
import { initialTeams, projects, recentVisited } from "@/workspace/root-model/workspaceData";
import type { Project, ProjectViewMode } from "@/types/workspace";
import { LayoutGrid, List } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useTeams } from "@/app/(workspace)/workspace/[teamId]/_service/useTeams";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export default function HomePage() {
  const router = useRouter();
  const { workspace } = useWorkspace();
  const { teams: fetchedTeams } = useTeams(workspace?.id ?? "");
  const [teams, setTeams] = useState(initialTeams);
  const [teamsOpen, setTeamsOpen] = useState(true);
  const [showNewTeamModal, setShowNewTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [viewMode, setViewMode] = useState<ProjectViewMode>("grid");
  const [starredProjects, setStarredProjects] = useState<Record<string, boolean>>({});
  const [menuProject, setMenuProject] = useState<string | null>(null);
  const [leftNavView, setLeftNavView] = useState<"projects" | "recent" | "favorites">("projects");
  const [activeTab, setActiveTab] = useState<TabType>("Projects");
  const [showWorkspaceSettings, setShowWorkspaceSettings] = useState(false);
  const [projectsByTeam, setProjectsByTeam] = useState<Record<string, Project[]>>(() => {
    const map: Record<string, Project[]> = {};
    initialTeams.forEach((team) => {
      map[team.id] = [];
    });
    const defaultTeam = initialTeams[0]?.id;
    if (defaultTeam) {
      map[defaultTeam] = projects;
    }
    return map;
  });
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectTag, setNewProjectTag] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const favoriteProjects = useMemo(() => {
    const currentTeam = teams.find((team) => team.active) ?? teams[0];
    if (!currentTeam) return [];
    return (projectsByTeam[currentTeam.id] ?? []).filter((project) => starredProjects[project.id]);
  }, [projectsByTeam, starredProjects, teams]);
  const activeTeam = useMemo(() => teams.find((team) => team.active) ?? teams[0], [teams]);
  const teamProjects = activeTeam ? projectsByTeam[activeTeam.id] ?? [] : [];
  const handleProjectNavigate = (projectId: string) => {
    if (!activeTeam) return;
    router.push(`/workspace/${encodeURIComponent(activeTeam.id)}/${encodeURIComponent(projectId)}`);
  };

  const handleCreateTeam = () => {
    const trimmed = newTeamName.trim();
    if (!trimmed) return;
    const teamSlug = slugify(trimmed) || `team-${Date.now()}`;
    const newTeam = {
      id: `team-${teamSlug}`,
      name: trimmed,
      role: "Team Owner",
      members: 1,
      active: true,
    };
    setTeams((prev) => [
      ...prev.map((team) => ({ ...team, active: false })),
      newTeam,
    ]);
    setProjectsByTeam((prev) => ({ ...prev, [newTeam.id]: [] }));
    setNewTeamName("");
    setShowNewTeamModal(false);
  };

  const handleCreateProject = () => {
    if (!activeTeam) return;
    const trimmedName = newProjectName.trim();
    if (!trimmedName) return;
    const projectSlug = slugify(trimmedName) || `project-${Date.now()}`;
    const project: Project = {
      id: projectSlug,
      title: trimmedName,
      tag: newProjectTag.trim() || "General",
      owner: activeTeam.name,
      updated: "Just now",
      description: newProjectDescription.trim() || "New project",
    };
    setProjectsByTeam((prev) => ({
      ...prev,
      [activeTeam.id]: [...(prev[activeTeam.id] ?? []), project],
    }));
    setShowNewProjectModal(false);
    setNewProjectName("");
    setNewProjectTag("");
    setNewProjectDescription("");
  };

  useEffect(() => {
    if (!menuProject) return;
    const handleClick = () => setMenuProject(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [menuProject]);

  useEffect(() => {
    if (!fetchedTeams.length) return;
    setTeams((prev) => {
      const activeId = prev.find((team) => team.active)?.id;
      return fetchedTeams.map((team, index) => ({
        ...team,
        active: team.id === activeId || (!activeId && index === 0),
      }));
    });
  }, [fetchedTeams]);

  useEffect(() => {
    if (!teams.length) return;
    setProjectsByTeam((prev) => {
      const next = { ...prev };
      teams.forEach((team) => {
        if (!next[team.id]) next[team.id] = [];
      });
      return next;
    });
  }, [teams]);

  const renderWorkspaceContent = () => {
    switch (activeTab) {
      case "Projects":
        return (
          <>
            <ProjectToolbar
              viewMode={viewMode}
              onChangeView={setViewMode}
              onCreateProject={() => setShowNewProjectModal(true)}
            />
            <div
              className={
                viewMode === "grid"
                  ? "pt-2 flex flex-wrap gap-5"
                  : "pt-2 space-y-3"
              }
            >
              {teamProjects.map((project) => (
                <div key={project.id} className="relative">
                  <ProjectCard
                    project={project}
                    viewMode={viewMode}
                    isStarred={!!starredProjects[project.id]}
                    onToggleStar={(id) => setStarredProjects((prev) => ({ ...prev, [id]: !prev[id] }))}
                    onOpenMenu={(id) => setMenuProject((prev) => (prev === id ? null : id))}
                    onOpenProject={handleProjectNavigate}
                  />
                  {menuProject === project.id && <ProjectMenu onClose={() => setMenuProject(null)} />}
                </div>
              ))}
            </div>
          </>
        );
      case "Activities":
        return <ActivitiesView />;
      case "Members":
        return <MembersView />;
      case "Settings":
        return <SettingsView />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Topbar workspaceMode onWorkspaceSettings={() => setShowWorkspaceSettings(true)} />

      <div className="flex min-h-[calc(100vh-4rem)]">
        <LeftNav
          teams={teams}
          teamsOpen={teamsOpen}
          onToggleTeams={() => setTeamsOpen((prev) => !prev)}
          onAddTeam={() => setShowNewTeamModal(true)}
          activeView={leftNavView}
          onChangeView={setLeftNavView}
          favoriteCount={favoriteProjects.length}
          recentCount={recentVisited.length}
          onSelectTeam={(teamId) =>
            setTeams((prev) =>
              prev.map((team) => ({
                ...team,
                active: team.id === teamId,
              }))
            )
          }
        />

        <main className="flex flex-1 flex-col gap-6 px-5 py-6 md:px-10">
          <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
            {leftNavView === "recent" ? (
              <RecentVisitedView />
            ) : leftNavView === "favorites" ? (
              <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.4em] text-white/40">Pinned</p>
                    <h2 className="text-3xl font-semibold text-white">My Favorites</h2>
                    <p className="text-sm text-white/55">즐겨찾기한 프로젝트를 빠르게 열어보세요.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(["grid", "list"] as ProjectViewMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                          viewMode === mode
                            ? "border-white text-white"
                            : "border-white/20 text-white/50 hover:text-white"
                        }`}
                        aria-label={`${mode} view`}
                        onClick={() => setViewMode(mode)}
                      >
                        {mode === "grid" ? <LayoutGrid size={16} /> : <List size={16} />}
                      </button>
                    ))}
                  </div>
                </div>
                {favoriteProjects.length === 0 ? (
                  <div className="rounded-2xl border border-border bg-panel p-10 text-center text-sm text-muted">
                    아직 즐겨찾기한 프로젝트가 없습니다. 프로젝트 카드의 ⭐ 버튼을 눌러 추가해 보세요.
                  </div>
                ) : (
                  <div className={viewMode === "grid" ? "flex flex-wrap gap-5" : "space-y-3"}>
                    {favoriteProjects.map((project) => (
                      <div key={project.id} className="relative">
                        <ProjectCard
                          project={project}
                          viewMode={viewMode}
                          isStarred={!!starredProjects[project.id]}
                          onToggleStar={(id) => setStarredProjects((prev) => ({ ...prev, [id]: !prev[id] }))}
                          onOpenMenu={(id) => setMenuProject((prev) => (prev === id ? null : id))}
                          onOpenProject={handleProjectNavigate}
                        />
                        {menuProject === project.id && <ProjectMenu onClose={() => setMenuProject(null)} />}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ) : (
              <>
                <section className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-semibold tracking-tight">{activeTeam?.name ?? "Workspace"}</h1>
                    {activeTeam?.role && (
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                        {activeTeam.role}
                      </span>
                    )}
                  </div>
                  <p className="text-xs uppercase tracking-[0.5em] text-muted">Projects</p>
                </section>
                {activeTab === "Projects" && <InviteBanner />}
                <WorkspaceTabs activeTab={activeTab} onChange={setActiveTab} />
                {renderWorkspaceContent()}
              </>
            )}
          </div>
        </main>
      </div>

      {showNewTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-panel p-6 text-foreground">
            <h2 className="text-lg font-semibold">Create Team</h2>
            <p className="mt-1 text-sm text-muted">Enter a name for your new team.</p>
            <input
              className="mt-4 w-full rounded-xl border border-border bg-panel px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-ring"
              placeholder="Team name"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
            />
            <div className="mt-6 flex justify-end gap-2 text-sm">
              <button
                type="button"
                className="rounded-full border border-white/20 px-4 py-1.5 text-white/70"
                onClick={() => {
                  setShowNewTeamModal(false);
                  setNewTeamName("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-primary px-5 py-1.5 text-primary-foreground disabled:opacity-50"
                disabled={!newTeamName.trim()}
                onClick={handleCreateTeam}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-panel p-6 text-foreground">
            <h2 className="text-lg font-semibold">Create Project</h2>
            <p className="mt-1 text-sm text-muted">Enter details for your new project.</p>
            <div className="mt-4 space-y-4">
              <input
                className="w-full rounded-xl border border-border bg-panel px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-ring"
                placeholder="Project name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
              />
              <input
                className="w-full rounded-xl border border-border bg-panel px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-ring"
                placeholder="Tag"
                value={newProjectTag}
                onChange={(e) => setNewProjectTag(e.target.value)}
              />
              <textarea
                className="w-full rounded-xl border border-border bg-panel px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-ring"
                placeholder="Description"
                rows={3}
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
              />
            </div>
            <div className="mt-6 flex justify-end gap-2 text-sm">
              <button
                type="button"
                className="rounded-full border border-border px-4 py-1.5 text-muted"
                onClick={() => {
                  setShowNewProjectModal(false);
                  setNewProjectName("");
                  setNewProjectTag("");
                  setNewProjectDescription("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-primary px-5 py-1.5 text-primary-foreground disabled:opacity-50"
                disabled={!newProjectName.trim()}
                onClick={handleCreateProject}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showWorkspaceSettings && <WorkspaceSettingsModal onClose={() => setShowWorkspaceSettings(false)} />}
    </div>
  );
}
