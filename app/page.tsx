// app/page.tsx
'use client';

import { useEffect, useMemo, useState } from "react";
import LandingMainContent from "@/components/landing/LandingMainContent";
import LandingShell from "@/components/landing/LandingShell";
import WorkspaceMainPanel from "@/components/home/WorkspaceMainPanel";
import Topbar from "@/components/layout/Topbar";
import LeftNav from "@/workspace/root/LeftNav";
import ProjectToolbar from "@/workspace/root/projects/ProjectToolbar";
import ProjectCard from "@/workspace/root/projects/ProjectCard";
import ProjectMenu from "@/workspace/root/projects/ProjectMenu";
import SettingsView from "@/workspace/root/views/SettingsView";
import ActivitiesView from "@/workspace/root/views/ActivitiesView";
import WorkspaceSettingsModal from "@/workspace/root/WorkspaceSettingsModal";
import HomePageModals from "@/workspace/root/HomePageModals";
import type { TabType } from "@/workspace/root/WorkspaceTabs";
import type { Project, ProjectViewMode } from "@/types/workspace";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useTeams } from "@/app/(workspace)/workspace/[teamId]/_model/hooks/useTeams";
import { useProjects } from "@/app/(workspace)/workspace/[teamId]/[projectId]/_model/hooks/useProjects";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import { createTeam, deleteTeam, updateTeam } from "@/lib/team";
import { cloneProject, createProject, deleteProject, favoriteProject, unfavoriteProject, updateProject } from "@/lib/projects";
import { useToast } from "@/components/ui/Toast";
import Drawer from "@/components/ui/Drawer";
import { uploadImage } from "@/lib/uploads";
import TeamMembersView from "./(workspace)/workspace/[teamId]/_components/views/TeamMembersView";
import { fetchFriends } from "@/lib/members";
import FloatingDm from "./(workspace)/workspace/[teamId]/_components/FloatingDm";

export default function HomePage() {
  const router = useRouter();
  const { workspace } = useWorkspace();
  const { profile, error: profileError } = useAuthProfile();
  const { teams: fetchedTeams, refetch: refetchTeams } = useTeams(workspace?.id ?? "", profile?.id);
  const { show } = useToast();
  const [teams, setTeams] = useState<typeof fetchedTeams>([]);
  const [teamsOpen, setTeamsOpen] = useState(true);
  const [workspaceNavOpen, setWorkspaceNavOpen] = useState(false);
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
  const [leftNavView, setLeftNavView] = useState<"projects" | "recent" | "favorites" | "friends">("projects");
  const [friendsTab, setFriendsTab] = useState<"friends" | "requests" | "manage">("friends");
  const [friendCount, setFriendCount] = useState(0);
  const [recentCount, setRecentCount] = useState(0);
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const favoriteProjects = useMemo(() => {
    const currentTeam = teams.find((team) => team.active) ?? teams[0];
    if (!currentTeam) return [];
    return (projectsByTeam[currentTeam.id] ?? []).filter((project) => starredProjects[project.id]);
  }, [projectsByTeam, starredProjects, teams]);
  const activeTeam = useMemo(() => teams.find((team) => team.active) ?? teams[0], [teams]);
  const activeTeamId = activeTeam?.id;
  const { projects: fetchedProjects, error: projectError, refetch: refetchProjects } = useProjects(activeTeamId);
  const teamProjects = activeTeam ? projectsByTeam[activeTeam.id] ?? [] : [];
  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsAuthenticated(!!localStorage.getItem("accessToken"));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const STORAGE_KEY = "recently-visited";
    const load = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? (JSON.parse(raw) as unknown[]) : [];
        setRecentCount(Array.isArray(parsed) ? parsed.length : 0);
      } catch {
        setRecentCount(0);
      }
    };
    load();
    const handleUpdate = () => load();
    window.addEventListener("recently-visited:update", handleUpdate as EventListener);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("recently-visited:update", handleUpdate as EventListener);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);
  const handleProjectNavigate = (projectId: string) => {
    if (!activeTeam) return;
    const href = `/workspace/${encodeURIComponent(activeTeam.id)}/${encodeURIComponent(projectId)}`;
    if (typeof window !== "undefined") {
      const project = teamProjects.find((item) => item.id === projectId);
      const stored = localStorage.getItem("recentProjects");
      const parsed: Array<{ id: string; label: string; href: string; iconValue?: string; description?: string }> = stored
        ? JSON.parse(stored)
        : [];
      const next = [
        {
          id: projectId,
          label: project?.title ?? "Project",
          href,
          iconValue: project?.iconValue ?? "",
          description: project?.description ?? "",
        },
        ...parsed.filter((item) => item.id !== projectId),
      ].slice(0, 6);
      localStorage.setItem("recentProjects", JSON.stringify(next));
      window.dispatchEvent(new Event("recent-projects-updated"));
    }
    router.push(href);
  };
  const handleSelectTeam = (teamId: string) => {
    setTeams((prev) =>
      prev.map((team) => ({
        ...team,
        active: team.id === teamId,
      }))
    );
    setLeftNavView("projects");
    setActiveTab("Projects");
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
    const nameWithSuffix = trimmedName.endsWith("'s Project") ? trimmedName : `${trimmedName}'s Project`;
    try {
      setCreatingProject(true);
      const iconValue = newProjectIconValue.trim();
      const created = await createProject(activeTeam.id, {
        name: nameWithSuffix,
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
        description: `${created?.name ?? nameWithSuffix} 프로젝트가 생성되었습니다.`,
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
        router.replace("/sign-in ");
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

  const handleCloseNewTeamModal = () => {
    setShowNewTeamModal(false);
    setNewTeamName("");
    setNewTeamIconValue("");
    setTeamIconFile(null);
    setTeamIconMode("url");
  };

  const handleCloseNewProjectModal = () => {
    setShowNewProjectModal(false);
    setNewProjectName("");
    setNewProjectDescription("");
    setNewProjectIconValue("");
    setProjectIconFile(null);
    setProjectIconMode("url");
    setNewProjectStatus("ACTIVE");
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
    router.replace("/sign-in");
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
    if (!workspace?.id) return;
    const loadFriendCount = async () => {
      try {
        const list = await fetchFriends(workspace.id);
        setFriendCount(list.length);
      } catch (err) {
        console.error("Failed to fetch friend count", err);
      }
    };
    void loadFriendCount();
    const handler = () => void loadFriendCount();
    window.addEventListener("friends:refresh", handler as EventListener);
    return () => {
      window.removeEventListener("friends:refresh", handler as EventListener);
    };
  }, [workspace?.id]);

  useEffect(() => {
    const handler = () => {
      setLeftNavView("friends");
      setFriendsTab("requests");
    };
    window.addEventListener("friends:open-requests", handler as EventListener);
    return () => {
      window.removeEventListener("friends:open-requests", handler as EventListener);
    };
  }, []);

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

  if (isAuthenticated === false) {
    return (
      <LandingShell>
          <LandingMainContent />
      </LandingShell>
    );
  }

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
                  ? "pt-2 grid grid-cols-1 gap-6 lg:grid-cols-2"
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
        return <TeamMembersView teamId={activeTeamId} />;
      case "Settings":
        return <SettingsView />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground transition-colors">
      <div className="sticky top-0 z-40 h-14 shrink-0 border-b border-border bg-panel shadow-panel">
        <Topbar
          workspaceMode
          onWorkspaceSettings={() => setShowWorkspaceSettings(true)}
          onOpenWorkspaceNav={() => setWorkspaceNavOpen(true)}
        />
      </div>

      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        <LeftNav
          className="hidden md:flex"
          teams={teams}
          teamsOpen={teamsOpen}
          onToggleTeams={() => setTeamsOpen((prev) => !prev)}
          onAddTeam={() => setShowNewTeamModal(true)}
          onRenameTeam={(teamId, name) => openTeamRenameModal(teamId, name)}
          onDeleteTeam={(teamId, name) => openTeamDeleteModal(teamId, name)}
          activeView={leftNavView}
          onChangeView={setLeftNavView}
          favoriteCount={favoriteProjects.length}
          recentCount={recentCount}
          friendCount={friendCount}
          onSelectTeam={handleSelectTeam}
        />

        <WorkspaceMainPanel
          teamsCount={teams.length}
          onOpenCreateTeam={() => setShowNewTeamModal(true)}
          leftNavView={leftNavView}
          favoriteProjects={favoriteProjects}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          starredProjects={starredProjects}
          menuProject={menuProject}
          setMenuProject={setMenuProject}
          onToggleStar={handleToggleStar}
          onOpenProject={handleProjectNavigate}
          onOpenEditProjectModal={openEditProjectModal}
          onCloneProject={handleCloneProject}
          onOpenDeleteModal={openDeleteModal}
          friendsTab={friendsTab}
          onChangeFriendsTab={setFriendsTab}
          onSelectTeam={handleSelectTeam}
          activeTeamName={activeTeam?.name}
          activeTeamRole={activeTeam?.role}
          activeTab={activeTab}
          onChangeActiveTab={setActiveTab}
          workspaceContent={renderWorkspaceContent()}
        />
      </div>

      <Drawer
        open={workspaceNavOpen}
        onOpenChange={setWorkspaceNavOpen}
        width={320}
        side="left"
        hideHeader
      >
        <LeftNav
          variant="panel"
          className="flex-1 bg-panel px-4 py-5 text-foreground"
          teams={teams}
          teamsOpen={teamsOpen}
          onToggleTeams={() => setTeamsOpen((prev) => !prev)}
          onAddTeam={() => setShowNewTeamModal(true)}
          onRenameTeam={(teamId, name) => openTeamRenameModal(teamId, name)}
          onDeleteTeam={(teamId, name) => openTeamDeleteModal(teamId, name)}
          activeView={leftNavView}
          onChangeView={setLeftNavView}
          favoriteCount={favoriteProjects.length}
          recentCount={recentCount}
          friendCount={friendCount}
          onNavigate={() => setWorkspaceNavOpen(false)}
          onSelectTeam={(teamId) => {
            handleSelectTeam(teamId);
            setWorkspaceNavOpen(false);
          }}
        />
      </Drawer>

      <HomePageModals
        showNewTeamModal={showNewTeamModal}
        newTeamName={newTeamName}
        newTeamIconValue={newTeamIconValue}
        teamIconMode={teamIconMode}
        teamIconFile={teamIconFile}
        uploadingTeamIcon={uploadingTeamIcon}
        creatingTeam={creatingTeam}
        onCloseNewTeamModal={handleCloseNewTeamModal}
        onSetNewTeamName={setNewTeamName}
        onSetNewTeamIconValue={setNewTeamIconValue}
        onSetTeamIconMode={setTeamIconMode}
        onSetTeamIconFile={setTeamIconFile}
        onUploadTeamIcon={handleUploadTeamIcon}
        onCreateTeam={handleCreateTeam}
        showNewProjectModal={showNewProjectModal}
        newProjectName={newProjectName}
        newProjectDescription={newProjectDescription}
        newProjectIconValue={newProjectIconValue}
        newProjectStatus={newProjectStatus}
        projectIconMode={projectIconMode}
        projectIconFile={projectIconFile}
        uploadingProjectIcon={uploadingProjectIcon}
        creatingProject={creatingProject}
        onCloseNewProjectModal={handleCloseNewProjectModal}
        onSetNewProjectName={setNewProjectName}
        onSetNewProjectDescription={setNewProjectDescription}
        onSetNewProjectIconValue={setNewProjectIconValue}
        onSetNewProjectStatus={setNewProjectStatus}
        onSetProjectIconMode={setProjectIconMode}
        onSetProjectIconFile={setProjectIconFile}
        onUploadProjectIcon={handleUploadProjectIcon}
        onCreateProject={handleCreateProject}
        editProjectModalOpen={editProjectModalOpen}
        editProjectName={editProjectName}
        editProjectStatus={editProjectStatus}
        editProjectIconValue={editProjectIconValue}
        editProjectIconMode={editProjectIconMode}
        editProjectIconFile={editProjectIconFile}
        uploadingEditProjectIcon={uploadingEditProjectIcon}
        onCloseEditProjectModal={() => setEditProjectModalOpen(false)}
        onSetEditProjectName={setEditProjectName}
        onSetEditProjectStatus={setEditProjectStatus}
        onSetEditProjectIconValue={setEditProjectIconValue}
        onSetEditProjectIconMode={setEditProjectIconMode}
        onSetEditProjectIconFile={setEditProjectIconFile}
        onUploadEditProjectIcon={handleUploadEditProjectIcon}
        onUpdateProject={handleUpdateProject}
        deleteModalOpen={deleteModalOpen}
        targetProjectName={targetProjectName}
        onCloseDeleteModal={() => setDeleteModalOpen(false)}
        onDeleteProject={handleDeleteProject}
        teamRenameModalOpen={teamRenameModalOpen}
        teamRenameValue={teamRenameValue}
        teamEditIconValue={teamEditIconValue}
        teamEditIconMode={teamEditIconMode}
        teamEditIconFile={teamEditIconFile}
        uploadingTeamEditIcon={uploadingTeamEditIcon}
        onCloseTeamRenameModal={() => setTeamRenameModalOpen(false)}
        onSetTeamRenameValue={setTeamRenameValue}
        onSetTeamEditIconValue={setTeamEditIconValue}
        onSetTeamEditIconMode={setTeamEditIconMode}
        onSetTeamEditIconFile={setTeamEditIconFile}
        onUploadTeamEditIcon={handleUploadTeamEditIcon}
        onRenameTeam={handleRenameTeam}
        teamDeleteModalOpen={teamDeleteModalOpen}
        targetTeamName={targetTeamName}
        onCloseTeamDeleteModal={() => setTeamDeleteModalOpen(false)}
        onDeleteTeam={handleDeleteTeam}
      />

      {showWorkspaceSettings && <WorkspaceSettingsModal onClose={() => setShowWorkspaceSettings(false)} />}
      <FloatingDm />
    </div>
  );
}
