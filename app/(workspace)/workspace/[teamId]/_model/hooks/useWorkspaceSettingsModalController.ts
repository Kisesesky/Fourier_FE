// app/(workspace)/workspace/[teamId]/_model/hooks/useWorkspaceSettingsModalController.ts
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspaceUser } from "@/hooks/useWorkspaceUser";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useWorkspacePath } from "@/hooks/useWorkspacePath";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import { changePassword, updateProfile } from "@/lib/auth";
import { setAuthToken } from "@/lib/api";
import { loadProfilePrefs, saveProfilePrefs } from "@/lib/profile-prefs";
import { loadUserPresence, type UserPresenceStatus } from "@/lib/presence";
import { getWorkspaceContext } from "../../_service/workspace-settings.api";
import {
  WORKSPACE_SETTINGS_KEY,
  WORKSPACE_SETTINGS_TABS,
} from "../constants/workspace-settings.constants";
import type {
  PasswordFormState,
  PasswordVisibleState,
  WorkspaceNotificationSettings,
  WorkspaceSettingsSection,
} from "../types/workspace-settings.types";

const DEFAULT_NOTIFICATIONS: WorkspaceNotificationSettings = {
  mentions: true,
  dm: true,
  customerCenterReply: true,
  emailDigest: false,
};

const DEFAULT_PROFILE_PREFS = {
  displayName: "",
  avatarUrl: "",
  backgroundImageUrl: "",
};

const DEFAULT_PASSWORD_FORM: PasswordFormState = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const DEFAULT_PASSWORD_VISIBLE: PasswordVisibleState = {
  current: false,
  next: false,
  confirm: false,
};

export function useWorkspaceSettingsModalController(onClose: () => void) {
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement | null>(null);
  const { currentUser } = useWorkspaceUser();
  const { workspace: activeWorkspace } = useWorkspace();
  const { profile } = useAuthProfile();
  const { workspace, buildHref } = useWorkspacePath();

  const [activeSection, setActiveSection] = useState<WorkspaceSettingsSection>("Workspace");
  const [teamName, setTeamName] = useState("Team");
  const [teamIconValue, setTeamIconValue] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("Project");
  const [projectIconValue, setProjectIconValue] = useState<string | null>(null);
  const [userPresence, setUserPresence] = useState<UserPresenceStatus>("online");
  const [profilePrefs, setProfilePrefs] = useState(DEFAULT_PROFILE_PREFS);
  const [notificationSettings, setNotificationSettings] =
    useState<WorkspaceNotificationSettings>(DEFAULT_NOTIFICATIONS);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(DEFAULT_PASSWORD_FORM);
  const [passwordVisible, setPasswordVisible] = useState<PasswordVisibleState>(DEFAULT_PASSWORD_VISIBLE);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordDone, setPasswordDone] = useState("");

  const accountEmail = profile?.email || (currentUser as { email?: string } | undefined)?.email || "-";
  const accountName = profile?.displayName || profile?.name || currentUser?.displayName || currentUser?.name || "Fourier member";
  const displayName = profilePrefs.displayName || accountName;
  const avatarUrl = profilePrefs.avatarUrl || currentUser?.avatarUrl || profile?.avatarUrl || undefined;
  const backgroundImageUrl = profilePrefs.backgroundImageUrl || profile?.backgroundImageUrl || undefined;

  const safeDecode = (value?: string) => {
    if (!value) return "";
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };

  const decodedTeamId = useMemo(() => safeDecode(workspace?.teamId), [workspace?.teamId]);
  const decodedProjectId = useMemo(() => safeDecode(workspace?.projectId), [workspace?.projectId]);
  const selectedTab = WORKSPACE_SETTINGS_TABS.find((tab) => tab.id === activeSection) ?? WORKSPACE_SETTINGS_TABS[0];

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(WORKSPACE_SETTINGS_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as Partial<WorkspaceNotificationSettings>;
      setNotificationSettings((prev) => ({ ...prev, ...parsed }));
    } catch {
      // noop
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(WORKSPACE_SETTINGS_KEY, JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  useEffect(() => {
    if (!decodedTeamId || !decodedProjectId) return;
    let cancelled = false;
    const workspaceId = activeWorkspace?.id ?? (typeof window !== "undefined" ? localStorage.getItem("activeWorkspaceId") : null);
    getWorkspaceContext(workspaceId, decodedTeamId, decodedProjectId)
      .then((context) => {
        if (cancelled) return;
        setTeamName(context.teamName);
        setTeamIconValue(context.teamIconValue);
        setProjectName(context.projectName);
        setProjectIconValue(context.projectIconValue);
      })
      .catch(() => {
        if (cancelled) return;
        setTeamName("Team");
        setTeamIconValue(null);
        setProjectName("Project");
        setProjectIconValue(null);
      });
    return () => {
      cancelled = true;
    };
  }, [decodedTeamId, decodedProjectId, activeWorkspace?.id]);

  useEffect(() => {
    setUserPresence(loadUserPresence());
    setProfilePrefs(loadProfilePrefs());
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSaveProfile = async (patch: {
    displayName?: string;
    avatarUrl?: string | null;
    backgroundImageUrl?: string | null;
    bio?: string;
  }) => {
    try {
      await updateProfile({
        displayName: patch.displayName?.trim(),
        backgroundImageUrl: patch.backgroundImageUrl?.trim() ?? "",
        bio: patch.bio,
      });
    } catch {
      // keep local prefs fallback
    }
    saveProfilePrefs({
      displayName: patch.displayName?.trim() ?? displayName,
      avatarUrl: patch.avatarUrl ?? "",
      backgroundImageUrl: patch.backgroundImageUrl ?? profilePrefs.backgroundImageUrl,
    });
    setProfilePrefs(loadProfilePrefs());
  };

  const openPasswordModal = () => {
    setPasswordError("");
    setPasswordDone("");
    setPasswordForm(DEFAULT_PASSWORD_FORM);
    setPasswordVisible(DEFAULT_PASSWORD_VISIBLE);
    setPasswordModalOpen(true);
  };

  const handleDeactivateAccount = () => {
    if (typeof window === "undefined") return;
    const ok = window.confirm("계정을 비활성화하시겠어요? 현재는 고객센터를 통해 처리됩니다.");
    if (!ok) return;
    window.dispatchEvent(new Event("support:open"));
  };

  const handleDeleteAccount = () => {
    if (typeof window === "undefined") return;
    const ok = window.confirm("정말 계정을 삭제하시겠어요? 현재는 고객센터를 통해 처리됩니다.");
    if (!ok) return;
    window.dispatchEvent(new Event("support:open"));
  };

  const submitPasswordChange = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError("모든 항목을 입력해 주세요.");
      return;
    }
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordError("현재 비밀번호와 새 비밀번호는 같을 수 없습니다.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    setPasswordSaving(true);
    setPasswordError("");
    try {
      const res = await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });
      setPasswordDone(res?.message || "비밀번호가 변경되었습니다.");
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
      }
      setAuthToken(null);
      window.setTimeout(() => {
        setPasswordModalOpen(false);
        onClose();
        router.replace("/sign-in");
      }, 700);
    } catch (error) {
      const rawMessage = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const normalized = Array.isArray(rawMessage) ? rawMessage.join(" ") : rawMessage ?? "";
      const lowered = normalized.toLowerCase();
      if (lowered.includes("newpassword is not strong enough") || lowered.includes("isstrongpassword")) {
        setPasswordError("비밀번호는 영문 대·소문자, 숫자, 특수문자 포함 8자 이상이어야 합니다.");
      } else {
        setPasswordError(normalized || "비밀번호 변경에 실패했습니다.");
      }
    } finally {
      setPasswordSaving(false);
    }
  };

  const openMembersPage = () => {
    router.push(buildHref(["members"], "/"));
    onClose();
  };

  const openIssuesPage = () => {
    router.push(buildHref(["issues"], "/"));
    onClose();
  };

  return {
    modalRef,
    profile,
    currentUser,
    activeSection,
    teamName,
    teamIconValue,
    projectName,
    projectIconValue,
    userPresence,
    profilePrefs,
    notificationSettings,
    passwordModalOpen,
    passwordForm,
    passwordVisible,
    passwordError,
    passwordSaving,
    passwordDone,
    accountEmail,
    accountName,
    displayName,
    avatarUrl,
    backgroundImageUrl,
    selectedTab,
    setActiveSection,
    setUserPresence,
    setNotificationSettings,
    setPasswordModalOpen,
    setPasswordForm,
    setPasswordVisible,
    handleSaveProfile,
    openPasswordModal,
    handleDeactivateAccount,
    handleDeleteAccount,
    submitPasswordChange,
    openMembersPage,
    openIssuesPage,
    onClose,
  };
}
