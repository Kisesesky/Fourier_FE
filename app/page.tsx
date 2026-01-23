'use client';

import { useEffect, useMemo, useState } from "react";
import Topbar from "@/components/layout/Topbar";
import LeftNav from "@/workspace/root/LeftNav";
import WorkspaceTabs, { type TabType } from "@/workspace/root/WorkspaceTabs";
import InviteBanner from "@/workspace/root/InviteBanner";
import ProjectToolbar from "@/workspace/root/projects/ProjectToolbar";
import ProjectCard from "@/workspace/root/projects/ProjectCard";
import ProjectMenu from "@/workspace/root/projects/ProjectMenu";
import SettingsView from "@/workspace/root/views/SettingsView";
import ActivitiesView from "@/workspace/root/views/ActivitiesView";
import WorkspaceSettingsModal from "@/workspace/root/WorkspaceSettingsModal";
import RecentVisitedView from "@/workspace/root/views/RecentVisitedView";
import { recentVisited } from "@/workspace/root-model/workspaceData";
import type { Project, ProjectViewMode } from "@/types/workspace";
import { LayoutGrid, List } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useTeams } from "@/app/(workspace)/workspace/[teamId]/_service/useTeams";
import { useProjects } from "@/app/(workspace)/workspace/[teamId]/[projectId]/_service/userProjects";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import { createTeam, deleteTeam, updateTeam } from "@/lib/team";
import { cloneProject, createProject, deleteProject, favoriteProject, unfavoriteProject, updateProject } from "@/lib/projects";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/common/Modal";
import { uploadImage } from "@/lib/uploads";
import MembersView from "./(workspace)/workspace/[teamId]/[projectId]/members/_components/MembersView";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export default function HomePage() {
  const router = useRouter();
  const { workspace } = useWorkspace();
  const { profile, error: profileError } = useAuthProfile();
  const { teams: fetchedTeams, refetch: refetchTeams } = useTeams(workspace?.id ?? "", profile?.id);
  const { show } = useToast();
  const [teams, setTeams] = useState<typeof fetchedTeams>([]);
  const [teamsOpen, setTeamsOpen] = useState(true);
  const [showNewTeamModal, setShowNewTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [requestedActiveTeamId, setRequestedActiveTeamId] = useState<string | null>(null);
  const [newTeamIconValue, setNewTeamIconValue] = useState("");
  const [teamIconMode, setTeamIconMode] = useState<"url" | "upload">("url");
  const [teamIconFile, setTeamIconFile] = useState<File | null>(null);
  const [uploadingTeamIcon, setUploadingTeamIcon] = useState(false);
  const [viewMode, setViewMode] = useState<ProjectViewMode>("grid");
  const [starredProjects, setStarredProjects] = useState<Record<string, boolean>>({});
  const [menuProject, setMenuProject] = useState<string | null>(null);
  const [leftNavView, setLeftNavView] = useState<"projects" | "recent" | "favorites">("projects");
  const [activeTab, setActiveTab] = useState<TabType>("Projects");
  const [showWorkspaceSettings, setShowWorkspaceSettings] = useState(false);
  const [projectsByTeam, setProjectsByTeam] = useState<Record<string, Project[]>>({});
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [editProjectModalOpen, setEditProjectModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetProjectId, setTargetProjectId] = useState<string | null>(null);
  const [targetProjectName, setTargetProjectName] = useState("");
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectStatus, setEditProjectStatus] = useState<"ACTIVE" | "DRAFT" | "DISABLED">("ACTIVE");
  const [editProjectIconValue, setEditProjectIconValue] = useState("");
  const [editProjectIconMode, setEditProjectIconMode] = useState<"url" | "upload">("url");
  const [editProjectIconFile, setEditProjectIconFile] = useState<File | null>(null);
  const [uploadingEditProjectIcon, setUploadingEditProjectIcon] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [newProjectIconValue, setNewProjectIconValue] = useState("");
  const [newProjectStatus, setNewProjectStatus] = useState<"ACTIVE" | "DRAFT" | "DISABLED">("ACTIVE");
  const [projectIconMode, setProjectIconMode] = useState<"url" | "upload">("url");
  const [projectIconFile, setProjectIconFile] = useState<File | null>(null);
  const [uploadingProjectIcon, setUploadingProjectIcon] = useState(false);
  const [teamRenameModalOpen, setTeamRenameModalOpen] = useState(false);
  const [teamDeleteModalOpen, setTeamDeleteModalOpen] = useState(false);
  const [targetTeamId, setTargetTeamId] = useState<string | null>(null);
  const [targetTeamName, setTargetTeamName] = useState("");
  const [teamRenameValue, setTeamRenameValue] = useState("");
  const [teamEditIconValue, setTeamEditIconValue] = useState("");
  const [teamEditIconMode, setTeamEditIconMode] = useState<"url" | "upload">("url");
  const [teamEditIconFile, setTeamEditIconFile] = useState<File | null>(null);
  const [uploadingTeamEditIcon, setUploadingTeamEditIcon] = useState(false);
  const favoriteProjects = useMemo(() => {
    const currentTeam = teams.find((team) => team.active) ?? teams[0];
    if (!currentTeam) return [];
    return (projectsByTeam[currentTeam.id] ?? []).filter((project) => starredProjects[project.id]);
  }, [projectsByTeam, starredProjects, teams]);
  const activeTeam = useMemo(() => teams.find((team) => team.active) ?? teams[0], [teams]);
  const activeTeamId = activeTeam?.id;
  const { projects: fetchedProjects, error: projectError, refetch: refetchProjects } = useProjects(activeTeamId);
  const teamProjects = activeTeam ? projectsByTeam[activeTeam.id] ?? [] : [];
  const handleProjectNavigate = (projectId: string) => {
    if (!activeTeam) return;
    const href = `/workspace/${encodeURIComponent(activeTeam.id)}/${encodeURIComponent(projectId)}`;
    if (typeof window !== "undefined") {
      const project = teamProjects.find((item) => item.id === projectId);
      const stored = localStorage.getItem("recentProjects");
      const parsed: Array<{ id: string; label: string; href: string }> = stored ? JSON.parse(stored) : [];
      const next = [
        { id: projectId, label: project?.title ?? "Project", href },
        ...parsed.filter((item) => item.id !== projectId),
      ].slice(0, 6);
      localStorage.setItem("recentProjects", JSON.stringify(next));
      window.dispatchEvent(new Event("recent-projects-updated"));
    }
    router.push(href);
  };
  const handleToggleStar = async (projectId: string) => {
    if (!activeTeam) return;
    const nextValue = !starredProjects[projectId];
    setStarredProjects((prev) => ({ ...prev, [projectId]: nextValue }));
    try {
      if (nextValue) {
        await favoriteProject(activeTeam.id, projectId);
      } else {
        await unfavoriteProject(activeTeam.id, projectId);
      }
      show({
        title: nextValue ? "즐겨찾기로 추가되었습니다." : "즐겨찾기가 해제되었습니다.",
        description: "",
        variant: nextValue ? "success" : "warning",
      });
    } catch (err) {
      console.error("Failed to toggle favorite", err);
      setStarredProjects((prev) => ({ ...prev, [projectId]: !nextValue }));
      show({
        title: "즐겨찾기 처리 실패",
        description: "잠시 후 다시 시도해주세요.",
        variant: "error",
      });
    }
  };

  const handleCreateTeam = async () => {
    const trimmed = newTeamName.trim();
    if (!trimmed || !workspace?.id || creatingTeam) return;

    try {
      setCreatingTeam(true);
      const iconValue = newTeamIconValue.trim();
      const created = await createTeam(workspace.id, {
        name: trimmed,
        ...(iconValue ? { iconType: "IMAGE", iconValue } : {}),
      });
      setRequestedActiveTeamId(created?.id ?? null);
      await refetchTeams();
      setNewTeamName("");
      setNewTeamIconValue("");
      setTeamIconFile(null);
      setTeamIconMode("url");
      setShowNewTeamModal(false);
      show({
        title: "팀 생성 완료",
        description: `${trimmed} 팀이 생성되었습니다.`,
        variant: "success",
      });
    } catch (err) {
      console.error("Failed to create team", err);
      show({
        title: "팀 생성 실패",
        description: "권한 또는 입력값을 확인해주세요.",
        variant: "error",
      });
    } finally {
      setCreatingTeam(false);
    }
  };

  const handleCreateProject = async () => {
    if (!activeTeam || creatingProject) return;
    const trimmedName = newProjectName.trim();
    if (!trimmedName) return;
    try {
      setCreatingProject(true);
      const iconValue = newProjectIconValue.trim();
      const created = await createProject(activeTeam.id, {
        name: trimmedName,
        description: newProjectDescription.trim() || undefined,
        ...(iconValue ? { iconType: "IMAGE", iconValue } : {}),
        status: newProjectStatus,
      });
      await refetchProjects();
      setShowNewProjectModal(false);
      setNewProjectName("");
      setNewProjectDescription("");
      setNewProjectIconValue("");
      setProjectIconFile(null);
      setProjectIconMode("url");
      setNewProjectStatus("ACTIVE");
      show({
        title: "프로젝트 생성 완료",
        description: `${created?.name ?? trimmedName} 프로젝트가 생성되었습니다.`,
        variant: "success",
      });
    } catch (err) {
      console.error("Failed to create project", err);
      const status =
        (err as { response?: { status?: number; data?: { statusCode?: number } } })?.response?.status ??
        (err as { response?: { data?: { statusCode?: number } } })?.response?.data?.statusCode;
      const message =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const description = Array.isArray(message) ? message.join(" ") : message;
      if (status === 401) {
        show({
          title: "로그인이 필요합니다",
          description: "다시 로그인해주세요.",
          variant: "warning",
        });
        localStorage.removeItem("accessToken");
        router.replace("/login");
        return;
      }
      show({
        title: "프로젝트 생성 실패",
        description: description || "권한 또는 입력값을 확인해주세요.",
        variant: "error",
      });
    } finally {
      setCreatingProject(false);
    }
  };

  const openTeamRenameModal = (teamId: string, name: string) => {
    setTargetTeamId(teamId);
    setTargetTeamName(name);
    setTeamRenameValue(name);
    const current = teams.find((team) => team.id === teamId);
    setTeamEditIconValue(current?.iconValue ?? "");
    setTeamEditIconMode("url");
    setTeamEditIconFile(null);
    setTeamRenameModalOpen(true);
  };

  const openTeamDeleteModal = (teamId: string, name: string) => {
    setTargetTeamId(teamId);
    setTargetTeamName(name);
    setTeamDeleteModalOpen(true);
  };

  const handleRenameTeam = async () => {
    if (!workspace?.id || !targetTeamId) return;
    const nextName = teamRenameValue.trim();
    const iconValue = teamEditIconValue.trim();
    if (!nextName) return;
    try {
      await updateTeam(workspace.id, targetTeamId, {
        name: nextName,
        ...(iconValue ? { iconType: "IMAGE", iconValue } : {}),
      });
      await refetchTeams();
      show({
        title: "팀 수정 완료",
        description: "팀 정보가 업데이트되었습니다.",
        variant: "success",
      });
      setTeamRenameModalOpen(false);
    } catch (err) {
      console.error("Failed to update team", err);
      const message =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const description = Array.isArray(message) ? message.join(" ") : message;
      show({
        title: "팀 수정 실패",
        description: description || "권한 또는 입력값을 확인해주세요.",
        variant: "error",
      });
    }
  };

  const handleDeleteTeam = async () => {
    if (!workspace?.id || !targetTeamId) return;
    try {
      await deleteTeam(workspace.id, targetTeamId);
      setRequestedActiveTeamId(null);
      await refetchTeams();
      show({
        title: "팀 삭제 완료",
        description: "팀이 삭제되었습니다.",
        variant: "success",
      });
      setTeamDeleteModalOpen(false);
    } catch (err) {
      console.error("Failed to delete team", err);
      const message =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const description = Array.isArray(message) ? message.join(" ") : message;
      show({
        title: "팀 삭제 실패",
        description: description || "권한 또는 입력값을 확인해주세요.",
        variant: "error",
      });
    }
  };

  const handleUploadTeamEditIcon = async () => {
    if (!teamEditIconFile) return;
    try {
      setUploadingTeamEditIcon(true);
      const url = await uploadImage(teamEditIconFile);
      setTeamEditIconValue(url);
      show({
        title: "아이콘 업로드 완료",
        description: "팀 아이콘이 업로드되었습니다.",
        variant: "success",
      });
    } catch (err) {
      console.error("Failed to upload team icon", err);
      show({
        title: "아이콘 업로드 실패",
        description: "이미지 파일을 확인해주세요.",
        variant: "error",
      });
    } finally {
      setUploadingTeamEditIcon(false);
    }
  };

  const handleUploadTeamIcon = async () => {
    if (!teamIconFile) return;
    try {
      setUploadingTeamIcon(true);
      const url = await uploadImage(teamIconFile);
      setNewTeamIconValue(url);
      show({
        title: "아이콘 업로드 완료",
        description: "팀 아이콘이 업로드되었습니다.",
        variant: "success",
      });
    } catch (err) {
      console.error("Failed to upload team icon", err);
      show({
        title: "아이콘 업로드 실패",
        description: "이미지 파일을 확인해주세요.",
        variant: "error",
      });
    } finally {
      setUploadingTeamIcon(false);
    }
  };

  const handleUploadProjectIcon = async () => {
    if (!projectIconFile) return;
    try {
      setUploadingProjectIcon(true);
      const url = await uploadImage(projectIconFile);
      setNewProjectIconValue(url);
      show({
        title: "아이콘 업로드 완료",
        description: "프로젝트 아이콘이 업로드되었습니다.",
        variant: "success",
      });
    } catch (err) {
      console.error("Failed to upload project icon", err);
      show({
        title: "아이콘 업로드 실패",
        description: "이미지 파일을 확인해주세요.",
        variant: "error",
      });
    } finally {
      setUploadingProjectIcon(false);
    }
  };

  const handleUploadEditProjectIcon = async () => {
    if (!editProjectIconFile) return;
    try {
      setUploadingEditProjectIcon(true);
      const url = await uploadImage(editProjectIconFile);
      setEditProjectIconValue(url);
      show({
        title: "아이콘 업로드 완료",
        description: "프로젝트 아이콘이 업로드되었습니다.",
        variant: "success",
      });
    } catch (err) {
      console.error("Failed to upload edit project icon", err);
      show({
        title: "아이콘 업로드 실패",
        description: "이미지 파일을 확인해주세요.",
        variant: "error",
      });
    } finally {
      setUploadingEditProjectIcon(false);
    }
  };

  const openEditProjectModal = (project: Project) => {
    setTargetProjectId(project.id);
    setTargetProjectName(project.title);
    setEditProjectName(project.title);
    setEditProjectStatus((project.status ?? project.tag ?? "ACTIVE") as "ACTIVE" | "DRAFT" | "DISABLED");
    setEditProjectIconValue(project.iconValue ?? "");
    setEditProjectIconMode("url");
    setEditProjectIconFile(null);
    setEditProjectModalOpen(true);
  };

  const openDeleteModal = (projectId: string, name: string) => {
    setTargetProjectId(projectId);
    setTargetProjectName(name);
    setDeleteModalOpen(true);
  };

  const handleUpdateProject = async () => {
    if (!activeTeam || !targetProjectId) return;
    const nextName = editProjectName.trim();
    const nextStatus = editProjectStatus;
    const iconValue = editProjectIconValue.trim();
    try {
      await updateProject(activeTeam.id, targetProjectId, {
        ...(nextName ? { name: nextName } : {}),
        status: nextStatus,
        ...(iconValue ? { iconType: "IMAGE", iconValue } : {}),
      });
      await refetchProjects();
      show({
        title: "프로젝트 수정 완료",
        description: "프로젝트 정보가 업데이트되었습니다.",
        variant: "success",
      });
      setEditProjectModalOpen(false);
    } catch (err) {
      console.error("Failed to update project", err);
      const message =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const description = Array.isArray(message) ? message.join(" ") : message;
      show({
        title: "프로젝트 수정 실패",
        description: description || "권한 또는 입력값을 확인해주세요.",
        variant: "error",
      });
    }
  };

  const handleCloneProject = async (projectId: string) => {
    if (!activeTeam) return;
    try {
      await cloneProject(activeTeam.id, projectId);
      await refetchProjects();
      show({
        title: "프로젝트 복제 완료",
        description: "프로젝트가 복제되었습니다.",
        variant: "success",
      });
    } catch (err) {
      console.error("Failed to clone project", err);
      show({
        title: "프로젝트 복제 실패",
        description: "권한 또는 입력값을 확인해주세요.",
        variant: "error",
      });
    }
  };

  const handleDeleteProject = async () => {
    if (!activeTeam || !targetProjectId) return;
    try {
      await deleteProject(activeTeam.id, targetProjectId);
      await refetchProjects();
      show({
        title: "프로젝트 삭제 완료",
        description: "프로젝트가 삭제되었습니다.",
        variant: "success",
      });
      setDeleteModalOpen(false);
    } catch (err) {
      console.error("Failed to delete project", err);
      const message =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const description = Array.isArray(message) ? message.join(" ") : message;
      show({
        title: "프로젝트 삭제 실패",
        description: description || "권한 또는 입력값을 확인해주세요.",
        variant: "error",
      });
    }
  };

  useEffect(() => {
    if (!menuProject) return;
    const handleClick = () => setMenuProject(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [menuProject]);

  useEffect(() => {
    if (!showNewTeamModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowNewTeamModal(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showNewTeamModal]);

  useEffect(() => {
    if (!showNewProjectModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowNewProjectModal(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showNewProjectModal]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!sessionStorage.getItem("auth:justSignedIn")) return;
    sessionStorage.removeItem("auth:justSignedIn");
    show({
      title: "로그인 완료",
      description: "워크스페이스 정보를 불러오는 중입니다.",
      variant: "success",
    });
  }, [show]);

  useEffect(() => {
    if (!profileError) return;
    const status =
      (profileError as { response?: { status?: number; data?: { statusCode?: number } } })?.response?.status ??
      (profileError as { response?: { data?: { statusCode?: number } } })?.response?.data?.statusCode;
    if (status !== 401) return;
    localStorage.removeItem("accessToken");
    show({
      title: "로그인이 필요합니다",
      description: "다시 로그인해주세요.",
      variant: "warning",
    });
    router.replace("/login");
  }, [profileError, router, show]);

  useEffect(() => {
    if (fetchedTeams.length === 0) {
      setTeams([]);
      setProjectsByTeam({});
      return;
    }
    setTeams((prev) => {
      let activeId = requestedActiveTeamId ?? prev.find((team) => team.active)?.id;
      if (activeId && !fetchedTeams.some((team) => team.id === activeId)) {
        activeId = undefined;
      }
      return fetchedTeams.map((team, index) => ({
        ...team,
        active: team.id === activeId || (!activeId && index === 0),
      }));
    });
    setProjectsByTeam((prev) => {
      const next = { ...prev };
      fetchedTeams.forEach((team) => {
        if (!next[team.id]) next[team.id] = [];
      });
      return next;
    });
    if (requestedActiveTeamId) setRequestedActiveTeamId(null);
  }, [fetchedTeams, requestedActiveTeamId]);

  useEffect(() => {
    if (!activeTeamId) return;
    if (!fetchedProjects) return;
    setProjectsByTeam((prev) => ({
      ...prev,
      [activeTeamId]: fetchedProjects.map((project) => ({
        id: project.id,
        title: project.name,
        tag: project.status || "ACTIVE",
        owner: activeTeam?.name ?? "Team",
        updated: project.createdAt
          ? new Date(project.createdAt).toLocaleDateString()
          : "Recently",
        description: project.description || "",
        iconType: project.iconType,
        iconValue: project.iconValue,
        status: project.status || "ACTIVE",
        isFavorite: project.isFavorite,
      })),
    }));
  }, [activeTeamId, activeTeam?.name, fetchedProjects]);

  useEffect(() => {
    if (!fetchedProjects) return;
    setStarredProjects((prev) => {
      const next = { ...prev };
      fetchedProjects.forEach((project) => {
        if (project.isFavorite !== undefined) {
          next[project.id] = project.isFavorite;
        }
      });
      return next;
    });
  }, [fetchedProjects]);

  useEffect(() => {
    if (!projectError) return;
    show({
      title: "프로젝트 로딩 실패",
      description: "프로젝트 목록을 불러오지 못했습니다.",
      variant: "error",
    });
  }, [projectError, show]);

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
                    onToggleStar={handleToggleStar}
                    onOpenMenu={(id) => setMenuProject((prev) => (prev === id ? null : id))}
                    onOpenProject={handleProjectNavigate}
                  />
                    {menuProject === project.id && (
                      <ProjectMenu
                        onClose={() => setMenuProject(null)}
                        onEdit={() => openEditProjectModal(project)}
                        onClone={() => handleCloneProject(project.id)}
                        onDelete={() => openDeleteModal(project.id, project.title)}
                      />
                    )}
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
          onRenameTeam={(teamId, name) => openTeamRenameModal(teamId, name)}
          onDeleteTeam={(teamId, name) => openTeamDeleteModal(teamId, name)}
          activeView={leftNavView}
          onChangeView={setLeftNavView}
          favoriteCount={favoriteProjects.length}
          recentCount={recentVisited.length}
          onSelectTeam={(teamId) => {
            setTeams((prev) =>
              prev.map((team) => ({
                ...team,
                active: team.id === teamId,
              }))
            );
            setLeftNavView("projects");
            setActiveTab("Projects");
          }}
        />

        <main className="flex flex-1 flex-col gap-6 px-5 py-6 md:px-10">
          <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
            {teams.length === 0 ? (
              <section className="rounded-2xl border border-dashed border-border bg-panel p-10 text-center text-sm text-muted">
                <p className="text-lg font-semibold text-foreground">팀이 없습니다.</p>
                <p className="mt-2 text-sm text-muted">먼저 팀을 생성한 다음 진행해주세요.</p>
                <p className="text-[11px] text-muted">Tip: 팀은 나중에 언제든 수정/초대가 가능해요.</p>
                <button
                  type="button"
                  className="mt-5 rounded-full border border-border px-5 py-2 text-sm text-muted transition hover:bg-accent hover:text-foreground"
                  onClick={() => setShowNewTeamModal(true)}
                >
                  + 팀 추가
                </button>
              </section>
            ) : leftNavView === "recent" ? (
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
                          onToggleStar={handleToggleStar}
                          onOpenMenu={(id) => setMenuProject((prev) => (prev === id ? null : id))}
                          onOpenProject={handleProjectNavigate}
                        />
                        {menuProject === project.id && (
                          <ProjectMenu
                            onClose={() => setMenuProject(null)}
                            onEdit={() => openEditProjectModal(project)}
                            onClone={() => handleCloneProject(project.id)}
                            onDelete={() => openDeleteModal(project.id, project.title)}
                          />
                        )}
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setShowNewTeamModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-border bg-panel p-6 text-foreground shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.45em] text-muted">Create a team</p>
              <h2 className="text-2xl font-semibold">
                {newTeamName.trim() ? `${newTeamName.trim()}'s Team` : "Name your space"}
              </h2>
              <p className="text-sm text-muted">
                Teams keep projects organized. You can rename anytime.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-4 rounded-2xl border border-border bg-accent/40 p-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-border bg-panel">
                {newTeamIconValue ? (
                  <img src={newTeamIconValue} alt="Team icon" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-muted">Icon</span>
                )}
              </div>
              <div className="flex-1">
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-[11px] uppercase tracking-[0.3em] text-muted">Team Icon</label>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      className={`rounded-full border px-3 py-1 ${teamIconMode === "url" ? "border-primary text-foreground" : "border-border text-muted"}`}
                      onClick={() => setTeamIconMode("url")}
                    >
                      URL
                    </button>
                    <button
                      type="button"
                      className={`rounded-full border px-3 py-1 ${teamIconMode === "upload" ? "border-primary text-foreground" : "border-border text-muted"}`}
                      onClick={() => setTeamIconMode("upload")}
                    >
                      Upload
                    </button>
                  </div>
                </div>
                {teamIconMode === "url" ? (
                  <input
                    className="w-full rounded-xl border border-border bg-panel px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-ring"
                    placeholder="https://..."
                    value={newTeamIconValue}
                    onChange={(e) => setNewTeamIconValue(e.target.value)}
                  />
                ) : (
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full text-sm text-muted"
                      onChange={(e) => setTeamIconFile(e.target.files?.[0] ?? null)}
                    />
                    <button
                      type="button"
                      className="rounded-full bg-primary px-4 py-1.5 text-xs text-primary-foreground disabled:opacity-50"
                      disabled={!teamIconFile || uploadingTeamIcon}
                      onClick={handleUploadTeamIcon}
                    >
                      {uploadingTeamIcon ? "Uploading..." : "Upload"}
                    </button>
                  </div>
                )}
                <div className="mt-2">
                  <label className="text-[11px] uppercase tracking-[0.3em] text-muted">Team Name</label>
                  <input
                    className="mt-3 w-full rounded-xl border border-border bg-panel px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-ring"
                    placeholder="Team name"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 text-sm">
              <button
                type="button"
                className="rounded-full bg-primary px-5 py-1.5 text-primary-foreground disabled:opacity-50"
                disabled={!newTeamName.trim() || creatingTeam}
                onClick={handleCreateTeam}
              >
                {creatingTeam ? "Creating..." : "Create"}
              </button>
              <button
                type="button"
                className="rounded-full border border-border px-4 py-1.5 text-muted"
                onClick={() => {
                  setShowNewTeamModal(false);
                  setNewTeamName("");
                  setNewTeamIconValue("");
                  setTeamIconFile(null);
                  setTeamIconMode("url");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewProjectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setShowNewProjectModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-border bg-panel p-6 text-foreground shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.45em] text-muted">Create a project</p>
              <h2 className="text-2xl font-semibold">{newProjectName.trim() || "Start something new"}</h2>
              <p className="text-sm text-muted">Add an icon, a short description, and status.</p>
            </div>

            <div className="mt-6 flex items-center gap-4 rounded-2xl border border-border bg-accent/40 p-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-border bg-panel">
                {newProjectIconValue ? (
                  <img src={newProjectIconValue} alt="Project icon" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-muted">Icon</span>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] uppercase tracking-[0.3em] text-muted">Project Icon</label>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      className={`rounded-full border px-3 py-1 ${projectIconMode === "url" ? "border-primary text-foreground" : "border-border text-muted"}`}
                      onClick={() => setProjectIconMode("url")}
                    >
                      URL
                    </button>
                    <button
                      type="button"
                      className={`rounded-full border px-3 py-1 ${projectIconMode === "upload" ? "border-primary text-foreground" : "border-border text-muted"}`}
                      onClick={() => setProjectIconMode("upload")}
                    >
                      Upload
                    </button>
                  </div>
                </div>
                {projectIconMode === "url" ? (
                  <input
                    className="w-full rounded-xl border border-border bg-panel px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-ring"
                    placeholder="https://..."
                    value={newProjectIconValue}
                    onChange={(e) => setNewProjectIconValue(e.target.value)}
                  />
                ) : (
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full text-sm text-muted"
                      onChange={(e) => setProjectIconFile(e.target.files?.[0] ?? null)}
                    />
                    <button
                      type="button"
                      className="rounded-full bg-primary px-4 py-1.5 text-xs text-primary-foreground disabled:opacity-50"
                      disabled={!projectIconFile || uploadingProjectIcon}
                      onClick={handleUploadProjectIcon}
                    >
                      {uploadingProjectIcon ? "Uploading..." : "Upload"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <input
                className="w-full rounded-xl border border-border bg-panel px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-ring"
                placeholder="Project name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
              />
              <textarea
                className="w-full rounded-xl border border-border bg-panel px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-ring"
                placeholder="Description"
                rows={3}
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
              />
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-muted">Status</label>
                <select
                  className="h-10 w-full rounded-xl border border-border bg-panel px-3 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-ring"
                  value={newProjectStatus}
                  onChange={(e) => setNewProjectStatus(e.target.value as "ACTIVE" | "DRAFT" | "DISABLED")}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="DRAFT">Draft</option>
                  <option value="DISABLED">Disabled</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 text-sm">
              <button
                type="button"
                className="rounded-full border border-border px-4 py-1.5 text-muted"
                onClick={() => {
                  setShowNewProjectModal(false);
                  setNewProjectName("");
                  setNewProjectDescription("");
                  setNewProjectIconValue("");
                  setProjectIconFile(null);
                  setProjectIconMode("url");
                  setNewProjectStatus("ACTIVE");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-primary px-5 py-1.5 text-primary-foreground disabled:opacity-50"
                disabled={!newProjectName.trim() || creatingProject}
                onClick={handleCreateProject}
              >
                {creatingProject ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={editProjectModalOpen}
        onClose={() => setEditProjectModalOpen(false)}
        title="프로젝트 수정"
        widthClass="max-w-md"
      >
        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <p className="text-sm text-muted">이름, 아이콘, 상태를 업데이트하세요.</p>
            <input
              className="w-full rounded-xl border border-border bg-panel px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-ring"
              value={editProjectName}
              onChange={(e) => setEditProjectName(e.target.value)}
              placeholder="프로젝트 이름"
            />
          </div>
          <div className="space-y-3 rounded-2xl border border-border bg-accent/40 p-4">
            <div className="flex items-center justify-between">
              <label className="text-[11px] uppercase tracking-[0.3em] text-muted">Project Icon</label>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  className={`rounded-full border px-3 py-1 ${editProjectIconMode === "url" ? "border-primary text-foreground" : "border-border text-muted"}`}
                  onClick={() => setEditProjectIconMode("url")}
                >
                  URL
                </button>
                <button
                  type="button"
                  className={`rounded-full border px-3 py-1 ${editProjectIconMode === "upload" ? "border-primary text-foreground" : "border-border text-muted"}`}
                  onClick={() => setEditProjectIconMode("upload")}
                >
                  Upload
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-border bg-panel">
                {editProjectIconValue ? (
                  <img src={editProjectIconValue} alt="Project icon" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-muted">Icon</span>
                )}
              </div>
              <div className="flex-1">
                {editProjectIconMode === "url" ? (
                  <input
                    className="w-full rounded-xl border border-border bg-panel px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-ring"
                    placeholder="https://..."
                    value={editProjectIconValue}
                    onChange={(e) => setEditProjectIconValue(e.target.value)}
                  />
                ) : (
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full text-sm text-muted"
                      onChange={(e) => setEditProjectIconFile(e.target.files?.[0] ?? null)}
                    />
                    <button
                      type="button"
                      className="rounded-full bg-primary px-4 py-1.5 text-xs text-primary-foreground disabled:opacity-50"
                      disabled={!editProjectIconFile || uploadingEditProjectIcon}
                      onClick={handleUploadEditProjectIcon}
                    >
                      {uploadingEditProjectIcon ? "Uploading..." : "Upload"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.3em] text-muted">Status</label>
            <select
              className="h-10 w-full rounded-xl border border-border bg-panel px-3 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-ring"
              value={editProjectStatus}
              onChange={(e) => setEditProjectStatus(e.target.value as "ACTIVE" | "DRAFT" | "DISABLED")}
            >
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="DISABLED">Disabled</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 text-sm">
            <button
              type="button"
              className="rounded-full border border-border px-4 py-1.5 text-muted"
              onClick={() => setEditProjectModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-full bg-primary px-5 py-1.5 text-primary-foreground disabled:opacity-50"
              disabled={!editProjectName.trim()}
              onClick={handleUpdateProject}
            >
              Save
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="프로젝트 삭제"
        widthClass="max-w-md"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted">
            "{targetProjectName}" 프로젝트를 삭제할까요? 이 작업은 되돌릴 수 없습니다.
          </p>
          <div className="flex justify-end gap-2 text-sm">
            <button
              type="button"
              className="rounded-full border border-border px-4 py-1.5 text-muted"
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-full bg-rose-500 px-5 py-1.5 text-white disabled:opacity-50"
              onClick={handleDeleteProject}
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={teamRenameModalOpen}
        onClose={() => setTeamRenameModalOpen(false)}
        title="팀 수정"
        widthClass="max-w-md"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted">팀 이름과 아이콘을 수정하세요.</p>
          <input
            className="w-full rounded-xl border border-border bg-panel px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-ring"
            value={teamRenameValue}
            onChange={(e) => setTeamRenameValue(e.target.value)}
            placeholder="팀 이름"
          />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] uppercase tracking-[0.3em] text-muted">Team Icon</label>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  className={`rounded-full border px-3 py-1 ${teamEditIconMode === "url" ? "border-primary text-foreground" : "border-border text-muted"}`}
                  onClick={() => setTeamEditIconMode("url")}
                >
                  URL
                </button>
                <button
                  type="button"
                  className={`rounded-full border px-3 py-1 ${teamEditIconMode === "upload" ? "border-primary text-foreground" : "border-border text-muted"}`}
                  onClick={() => setTeamEditIconMode("upload")}
                >
                  Upload
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-border bg-panel">
                {teamEditIconValue ? (
                  <img src={teamEditIconValue} alt="Team icon" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-muted">Icon</span>
                )}
              </div>
              <div className="flex-1">
                {teamEditIconMode === "url" ? (
                  <input
                    className="w-full rounded-xl border border-border bg-panel px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-ring"
                    placeholder="https://..."
                    value={teamEditIconValue}
                    onChange={(e) => setTeamEditIconValue(e.target.value)}
                  />
                ) : (
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full text-sm text-muted"
                      onChange={(e) => setTeamEditIconFile(e.target.files?.[0] ?? null)}
                    />
                    <button
                      type="button"
                      className="rounded-full bg-primary px-4 py-1.5 text-xs text-primary-foreground disabled:opacity-50"
                      disabled={!teamEditIconFile || uploadingTeamEditIcon}
                      onClick={handleUploadTeamEditIcon}
                    >
                      {uploadingTeamEditIcon ? "Uploading..." : "Upload"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 text-sm">
            <button
              type="button"
              className="rounded-full border border-border px-4 py-1.5 text-muted"
              onClick={() => setTeamRenameModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-full bg-primary px-5 py-1.5 text-primary-foreground disabled:opacity-50"
              disabled={!teamRenameValue.trim()}
              onClick={handleRenameTeam}
            >
              Save
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={teamDeleteModalOpen}
        onClose={() => setTeamDeleteModalOpen(false)}
        title="팀 삭제"
        widthClass="max-w-md"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted">
            "{targetTeamName}" 팀을 삭제할까요? 이 작업은 되돌릴 수 없습니다.
          </p>
          <div className="flex justify-end gap-2 text-sm">
            <button
              type="button"
              className="rounded-full border border-border px-4 py-1.5 text-muted"
              onClick={() => setTeamDeleteModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-full bg-rose-500 px-5 py-1.5 text-white disabled:opacity-50"
              onClick={handleDeleteTeam}
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {showWorkspaceSettings && <WorkspaceSettingsModal onClose={() => setShowWorkspaceSettings(false)} />}
    </div>
  );
}
