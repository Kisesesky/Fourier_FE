'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import {
  Bell,
  ChevronRight,
  CircleUserRound,
  Eye,
  EyeOff,
  Settings2,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import MemberProfilePanel from "@/workspace/members/_components/MemberProfilePanel";
import { useWorkspaceUser } from "@/hooks/useWorkspaceUser";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useWorkspacePath } from "@/hooks/useWorkspacePath";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import { changePassword, updateProfile } from "@/lib/auth";
import { setAuthToken } from "@/lib/api";
import { fetchProjects } from "@/lib/projects";
import { fetchTeams } from "@/lib/team";
import { loadProfilePrefs, saveProfilePrefs } from "@/lib/profile-prefs";
import { loadUserPresence, saveUserPresence, type UserPresenceStatus } from "@/lib/presence";

const SETTINGS_KEY = "workspace:settings:notifications";

const TABS = [
  { id: "Workspace", label: "Workspace", icon: Settings2, description: "현재 워크스페이스 컨텍스트와 빠른 액션" },
  { id: "Members", label: "Members", icon: Users, description: "멤버 관리 화면 이동" },
  { id: "Notifications", label: "Notifications", icon: Bell, description: "알림 옵션 제어" },
  { id: "My Account", label: "My Account", icon: CircleUserRound, description: "내 계정 및 보안 정보" },
] as const;

type WorkspaceSettingsSection = (typeof TABS)[number]["id"];

interface WorkspaceSettingsModalProps {
  onClose: () => void;
}

const WorkspaceSettingsModal = ({ onClose }: WorkspaceSettingsModalProps) => {
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
  const [profilePrefs, setProfilePrefs] = useState<{ displayName: string; avatarUrl: string; backgroundImageUrl: string }>({
    displayName: "",
    avatarUrl: "",
    backgroundImageUrl: "",
  });
  const [notificationSettings, setNotificationSettings] = useState({
    mentions: true,
    dm: true,
    customerCenterReply: true,
    emailDigest: false,
  });
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordVisible, setPasswordVisible] = useState({
    current: false,
    next: false,
    confirm: false,
  });
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as Partial<typeof notificationSettings>;
      setNotificationSettings((prev) => ({ ...prev, ...parsed }));
    } catch {
      // noop
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  useEffect(() => {
    if (!decodedTeamId || !decodedProjectId) return;
    let cancelled = false;
    const workspaceId = activeWorkspace?.id ?? (typeof window !== "undefined" ? localStorage.getItem("activeWorkspaceId") : null);
    const load = async () => {
      if (workspaceId) {
        try {
          const teams = await fetchTeams(workspaceId);
          if (!cancelled) {
            const foundTeam = teams.find((team) => team.id === decodedTeamId);
            setTeamName(foundTeam?.name ?? "Team");
            setTeamIconValue(foundTeam?.iconValue ?? null);
          }
        } catch {
          if (!cancelled) {
            setTeamName("Team");
            setTeamIconValue(null);
          }
        }
      }
      try {
        const projects = await fetchProjects(decodedTeamId);
        if (cancelled) return;
        const foundProject = projects.find((project: { id: string; name: string; iconValue?: string | null }) => project.id === decodedProjectId);
        setProjectName(foundProject?.name ?? "Project");
        setProjectIconValue(foundProject?.iconValue ?? null);
      } catch {
        if (cancelled) return;
        setProjectName("Project");
        setProjectIconValue(null);
      }
    };
    void load();
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

  const selectedTab = TABS.find((tab) => tab.id === activeSection) ?? TABS[0];
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

  const handleChangePassword = () => {
    setPasswordError("");
    setPasswordDone("");
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setPasswordVisible({ current: false, next: false, confirm: false });
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

  const renderContent = () => {
    if (activeSection === "Workspace") {
      return (
        <div className="space-y-4">
          <div className="rounded-3xl border border-border bg-panel px-5 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Context</p>
            <div className="mt-3 rounded-2xl border border-border bg-background p-4">
              <div className="flex items-center gap-3">
                <IconBadge label={teamName} iconValue={teamIconValue} />
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted">Team</p>
                  <p className="text-sm font-semibold text-foreground">{teamName || "-"}</p>
                </div>
              </div>
              <div className="ml-6 mt-3 border-l border-border/80 pl-5">
                <div className="flex items-center gap-3 rounded-xl border border-border bg-panel/70 px-3 py-2">
                  <IconBadge label={projectName} iconValue={projectIconValue} />
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted">Project</p>
                    <p className="text-sm font-semibold text-foreground">{projectName || "-"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-panel px-5 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Quick Actions</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-full border border-border px-3 py-1.5 text-sm text-muted hover:bg-accent hover:text-foreground"
                onClick={() => {
                  router.push(buildHref(["members"], "/"));
                  onClose();
                }}
              >
                멤버 관리로 이동
              </button>
              <button
                type="button"
                className="rounded-full border border-border px-3 py-1.5 text-sm text-muted hover:bg-accent hover:text-foreground"
                onClick={() => {
                  router.push(buildHref(["issues"], "/"));
                  onClose();
                }}
              >
                이슈 보드로 이동
              </button>
              <button
                type="button"
                className="rounded-full border border-border px-3 py-1.5 text-sm text-muted hover:bg-accent hover:text-foreground"
                onClick={() => window.dispatchEvent(new Event("support:open"))}
              >
                고객센터 열기
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === "Members") {
      return (
        <div className="rounded-3xl border border-border bg-panel px-6 py-8">
          <p className="text-sm text-muted">멤버 초대/권한 변경은 멤버 화면에서 바로 관리할 수 있습니다.</p>
          <button
            type="button"
            className="mt-4 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90"
            onClick={() => {
              router.push(buildHref(["members"], "/"));
              onClose();
            }}
          >
            멤버 화면 열기
          </button>
        </div>
      );
    }

    if (activeSection === "Notifications") {
      return (
        <div className="space-y-3">
          <ToggleRow
            label="채널 멘션 알림"
            checked={notificationSettings.mentions}
            onChange={(checked) => setNotificationSettings((prev) => ({ ...prev, mentions: checked }))}
          />
          <ToggleRow
            label="DM 알림"
            checked={notificationSettings.dm}
            onChange={(checked) => setNotificationSettings((prev) => ({ ...prev, dm: checked }))}
          />
          <ToggleRow
            label="고객센터 답변 알림"
            checked={notificationSettings.customerCenterReply}
            onChange={(checked) => setNotificationSettings((prev) => ({ ...prev, customerCenterReply: checked }))}
          />
          <ToggleRow
            label="이메일 다이제스트"
            checked={notificationSettings.emailDigest}
            onChange={(checked) => setNotificationSettings((prev) => ({ ...prev, emailDigest: checked }))}
          />
          <p className="pt-2 text-xs text-muted">변경사항은 자동 저장됩니다.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <MemberProfilePanel
          member={{
            id: profile?.id ?? currentUser?.id ?? "me",
            name: displayName,
            displayName,
            email: accountEmail,
            avatarUrl,
            backgroundImageUrl,
            description: profile?.bio ?? undefined,
            role: currentUser?.role ?? "member",
            joinedAt: profile?.createdAt ? Date.parse(profile.createdAt) : Date.now(),
            lastActiveAt: profile?.updatedAt ? Date.parse(profile.updatedAt) : Date.now(),
          }}
          presence={{
            memberId: profile?.id ?? "me",
            status: userPresence,
            lastSeenAt: Date.now(),
          }}
          canEditPresence
          canEditProfile
          canRemove={false}
          isSelf
          onPresenceChange={(status) => {
            setUserPresence(status);
            saveUserPresence(status);
          }}
          onProfileSave={handleSaveProfile}
          onCancel={() => undefined}
        />
        <div className="rounded-xl border border-border bg-panel p-4">
          <div>
            <p className="text-sm font-semibold text-foreground">비밀번호와 인증</p>
            <div className="mt-2">
              <button
                type="button"
                onClick={handleChangePassword}
                className="rounded-lg bg-sky-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-sky-600"
              >
                비밀번호 변경하기
              </button>
            </div>
          </div>
          <div className="mt-5 border-t border-border pt-4">
            <p className="text-sm font-semibold text-foreground">계정 제거</p>
            <p className="mt-1 text-xs text-muted">계정 비활성화하면 언제든 복구할 수 있어요.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDeactivateAccount}
                className="rounded-lg bg-rose-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-rose-600"
              >
                계정 비활성화
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="rounded-lg border px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
              >
                계정 삭제하기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
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

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 py-8"
      onMouseDown={(event) => {
        if (!modalRef.current) return;
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="relative flex w-full max-w-5xl flex-col gap-6 rounded-[36px] border border-border bg-background p-6 text-foreground md:flex-row"
      >

        <nav className="w-full space-y-2 md:w-64">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={clsx(
                  "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold transition",
                  active ? "bg-foreground text-background" : "text-muted hover:bg-accent hover:text-foreground"
                )}
                onClick={() => setActiveSection(tab.id)}
              >
                <span className="inline-flex items-center gap-2">
                  <Icon size={15} />
                  {tab.label}
                </span>
                {active && <ChevronRight size={16} className="text-background" />}
              </button>
            );
          })}
        </nav>

        <div className="flex h-[70vh] flex-1 flex-col pr-1">
          <div className="mb-4 bg-background px-1 pb-3 pt-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xl font-semibold text-foreground">{selectedTab.label}</p>
                <p className="text-sm text-muted">{selectedTab.description}</p>
              </div>
              <button
                type="button"
                className="rounded-full border border-border p-2 text-muted transition hover:bg-accent hover:text-foreground"
                onClick={onClose}
                aria-label="Close workspace settings"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          <div className="scrollbar-custom min-h-0 overflow-y-auto pr-1">
            {renderContent()}
          </div>
        </div>
      </div>

      {passwordModalOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-panel p-5 text-foreground shadow-2xl">
            <div className="flex items-start justify-between">
              <p className="text-lg font-semibold">비밀번호를 바꿔주세요</p>
              <button
                type="button"
                onClick={() => setPasswordModalOpen(false)}
                className="p-1 text-muted hover:bg-accent hover:text-foreground"
                aria-label="닫기"
              >
                <X size={16} />
              </button>
            </div>
            <p className="mt-2 text-sm text-muted">현재 비밀번호와 새 비밀번호를 입력해주세요.</p>

            <div className="mt-4 space-y-3">
              <PasswordField
                label="현재비밀번호"
                value={passwordForm.currentPassword}
                visible={passwordVisible.current}
                onChange={(value) => setPasswordForm((prev) => ({ ...prev, currentPassword: value }))}
                onToggle={() => setPasswordVisible((prev) => ({ ...prev, current: !prev.current }))}
              />
              <PasswordField
                label="새 비밀번호"
                value={passwordForm.newPassword}
                visible={passwordVisible.next}
                onChange={(value) => setPasswordForm((prev) => ({ ...prev, newPassword: value }))}
                onToggle={() => setPasswordVisible((prev) => ({ ...prev, next: !prev.next }))}
              />
              <PasswordField
                label="새 비밀번호 확인"
                value={passwordForm.confirmPassword}
                visible={passwordVisible.confirm}
                onChange={(value) => setPasswordForm((prev) => ({ ...prev, confirmPassword: value }))}
                onToggle={() => setPasswordVisible((prev) => ({ ...prev, confirm: !prev.confirm }))}
              />
            </div>

            {passwordError && <p className="mt-3 text-sm text-rose-500">{passwordError}</p>}
            {passwordDone && <p className="mt-3 text-sm text-emerald-600">{passwordDone}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPasswordModalOpen(false)}
                className="rounded-lg border border-border px-3 py-2 text-sm text-muted hover:bg-accent hover:text-foreground"
              >
                취소
              </button>
              <button
                type="button"
                onClick={submitPasswordChange}
                disabled={passwordSaving}
                className="rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-50"
              >
                {passwordSaving ? "변경 중..." : "비밀번호 변경"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-2xl border border-border bg-panel px-4 py-3 text-sm">
      <span className="text-foreground">{label}</span>
      <button
        type="button"
        aria-pressed={checked}
        className={clsx(
          "relative h-6 w-11 rounded-full transition",
          checked ? "bg-emerald-500" : "bg-muted"
        )}
        onClick={() => onChange(!checked)}
      >
        <span
          className={clsx(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white transition",
            checked ? "left-[22px]" : "left-0.5"
          )}
        />
      </button>
    </label>
  );
}

export default WorkspaceSettingsModal;

function IconBadge({
  label,
  iconValue,
}: {
  label: string;
  iconValue?: string | null;
}) {
  return (
    <span className="inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30">
      {iconValue ? (
        <img src={iconValue} alt={label} className="h-full w-full object-cover" />
      ) : (
        <span className="text-base font-semibold text-foreground">{(label || "?").slice(0, 1).toUpperCase()}</span>
      )}
    </span>
  );
}

function PasswordField({
  label,
  value,
  visible,
  onChange,
  onToggle,
}: {
  label: string;
  value: string;
  visible: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full rounded-xl border border-border bg-background px-3 pr-10 text-sm text-foreground outline-none focus:border-sidebar-primary"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:bg-accent hover:text-foreground"
          aria-label="비밀번호 보기 토글"
        >
          {visible ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </span>
    </label>
  );
}
