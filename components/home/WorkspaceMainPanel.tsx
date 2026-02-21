// components/home/WorkspaceMainPanel.tsx
'use client';

import { LayoutGrid, List } from 'lucide-react';
import InviteBanner from '@/workspace/root/InviteBanner';
import ProjectCard from '@/workspace/root/projects/ProjectCard';
import ProjectMenu from '@/workspace/root/projects/ProjectMenu';
import RecentVisitedView from '@/workspace/root/views/RecentVisitedView';
import FriendsView from '@/workspace/root/views/FriendsView';
import WorkspaceTabs, { type TabType } from '@/workspace/root/WorkspaceTabs';
import type { Project, ProjectViewMode } from '@/types/workspace';

type Props = {
  teamsCount: number;
  onOpenCreateTeam: () => void;
  leftNavView: 'projects' | 'recent' | 'favorites' | 'friends';
  favoriteProjects: Project[];
  viewMode: ProjectViewMode;
  onChangeViewMode: (mode: ProjectViewMode) => void;
  starredProjects: Record<string, boolean>;
  menuProject: string | null;
  setMenuProject: React.Dispatch<React.SetStateAction<string | null>>;
  onToggleStar: (projectId: string) => Promise<void>;
  onOpenProject: (projectId: string) => void;
  onOpenEditProjectModal: (project: Project) => void;
  onCloneProject: (projectId: string) => void;
  onOpenDeleteModal: (projectId: string, projectName: string) => void;
  friendsTab: 'friends' | 'requests' | 'manage';
  onChangeFriendsTab: (tab: 'friends' | 'requests' | 'manage') => void;
  onSelectTeam: (teamId: string) => void;
  activeTeamName?: string;
  activeTeamRole?: string;
  activeTab: TabType;
  onChangeActiveTab: (tab: TabType) => void;
  workspaceContent: React.ReactNode;
};

export default function WorkspaceMainPanel({
  teamsCount,
  onOpenCreateTeam,
  leftNavView,
  favoriteProjects,
  viewMode,
  onChangeViewMode,
  starredProjects,
  menuProject,
  setMenuProject,
  onToggleStar,
  onOpenProject,
  onOpenEditProjectModal,
  onCloneProject,
  onOpenDeleteModal,
  friendsTab,
  onChangeFriendsTab,
  onSelectTeam,
  activeTeamName,
  activeTeamRole,
  activeTab,
  onChangeActiveTab,
  workspaceContent,
}: Props) {
  return (
    <main className="flex h-full flex-1 flex-col gap-6 overflow-y-auto px-5 py-6 md:px-10">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
        {teamsCount === 0 ? (
          <section className="rounded-2xl border border-dashed border-border bg-panel p-10 text-center text-sm text-muted">
            <p className="text-lg font-semibold text-foreground">팀이 없습니다.</p>
            <p className="mt-2 text-sm text-muted">먼저 팀을 생성한 다음 진행해주세요.</p>
            <p className="text-[11px] text-muted">Tip: 팀은 나중에 언제든 수정/초대가 가능해요.</p>
            <button
              type="button"
              className="mt-5 rounded-full border border-border px-5 py-2 text-sm text-muted transition hover:bg-accent hover:text-foreground"
              onClick={onOpenCreateTeam}
            >
              + 팀 추가
            </button>
          </section>
        ) : leftNavView === 'recent' ? (
          <RecentVisitedView />
        ) : leftNavView === 'favorites' ? (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.4em] text-white/40">Pinned</p>
                <h2 className="text-3xl font-semibold text-white">My Favorites</h2>
                <p className="text-sm text-white/55">즐겨찾기한 프로젝트를 빠르게 열어보세요.</p>
              </div>
              <div className="flex items-center gap-2">
                {(['grid', 'list'] as ProjectViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={`flex h-12 w-12 items-center justify-center rounded-full border ${
                      viewMode === mode ? 'border-white text-white' : 'border-white/20 text-white/50 hover:text-white'
                    }`}
                    aria-label={`${mode} view`}
                    onClick={() => onChangeViewMode(mode)}
                  >
                    {mode === 'grid' ? <LayoutGrid size={16} /> : <List size={16} />}
                  </button>
                ))}
              </div>
            </div>
            {favoriteProjects.length === 0 ? (
              <div className="rounded-2xl border border-border bg-panel p-10 text-center text-sm text-muted">
                아직 즐겨찾기한 프로젝트가 없습니다. 프로젝트 카드의 ⭐ 버튼을 눌러 추가해 보세요.
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'flex flex-wrap gap-5' : 'space-y-3'}>
                {favoriteProjects.map((project) => (
                  <div key={project.id} className="relative">
                    <ProjectCard
                      project={project}
                      viewMode={viewMode}
                      isStarred={!!starredProjects[project.id]}
                      onToggleStar={onToggleStar}
                      onOpenMenu={(id) => setMenuProject((prev) => (prev === id ? null : id))}
                      onOpenProject={onOpenProject}
                    />
                    {menuProject === project.id && (
                      <ProjectMenu
                        onClose={() => setMenuProject(null)}
                        onEdit={() => onOpenEditProjectModal(project)}
                        onClone={() => onCloneProject(project.id)}
                        onDelete={() => onOpenDeleteModal(project.id, project.title)}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : leftNavView === 'friends' ? (
          <FriendsView onSelectTeam={onSelectTeam} activeTab={friendsTab} onTabChange={onChangeFriendsTab} />
        ) : (
          <>
            <section className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight">{activeTeamName ?? 'Workspace'}</h1>
                {activeTeamRole && (
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">{activeTeamRole}</span>
                )}
              </div>
              <p className="text-xs uppercase tracking-[0.5em] text-muted">Projects</p>
            </section>
            {activeTab === 'Projects' && <InviteBanner />}
            <WorkspaceTabs activeTab={activeTab} onChange={onChangeActiveTab} />
            {workspaceContent}
          </>
        )}
      </div>
    </main>
  );
}
