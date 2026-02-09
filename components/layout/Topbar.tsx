// components/layout/Topbar.tsx
"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { useToast } from "@/components/ui/Toast";
import {
  Ban,
  Bell,
  ChevronRight,
  Home,
  Info,
  LogOut,
  Menu,
  Monitor,
  Moon,
  MoreHorizontal,
  MessageSquare,
  RotateCcw,
  Search,
  Settings,
  Sun,
  UserCircle2,
  X,
} from "lucide-react";
import CommandPalette from "@/components/command/CommandPalette";
import SettingsModal from "@/components/settings/SettingsModal";
import MemberProfilePanel from "@/workspace/members/_components/MemberProfilePanel";
import { ThemeMode } from "@/lib/theme";
import { useThemeMode } from "@/hooks/useThemeMode";
import { useWorkspaceUser } from "@/hooks/useWorkspaceUser";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import { signOut, updateProfile } from "@/lib/auth";
import { setAuthToken } from "@/lib/api";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead, type NotificationItem } from "@/lib/notifications";
import { acceptTeamInvite, rejectTeamInvite } from "@/lib/team";
import { loadUserPresence, saveUserPresence, USER_PRESENCE_EVENT, type UserPresenceStatus } from "@/lib/presence";
import { loadProfilePrefs, saveProfilePrefs, USER_PROFILE_PREFS_EVENT } from "@/lib/profile-prefs";

const THEME_ICONS: Record<ThemeMode, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const THEME_LABELS: Record<ThemeMode, string> = {
  light: "Light mode",
  dark: "Dark mode",
  system: "System mode",
};

type TopbarProps = {
  onToggleSidebarCollapse?: () => void;
  sidebarCollapsed?: boolean;
  workspaceMode?: boolean;
  onWorkspaceSettings?: () => void;
  onOpenWorkspaceNav?: () => void;
};

type WorkspaceTab = {
  id: string;
  label: string;
  href: string;
  closable?: boolean;
};

const ToolbarIcon = ({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Bell;
  label: string;
  onClick?: () => void;
}) => (
  <button
    type="button"
    className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition hover:bg-accent hover:text-foreground"
    aria-label={label}
    onClick={onClick}
  >
    <Icon size={20} />
  </button>
);

export default function Topbar({
  onToggleSidebarCollapse,
  sidebarCollapsed,
  workspaceMode = false,
  onWorkspaceSettings,
  onOpenWorkspaceNav,
}: TopbarProps = {}) {
  const { show } = useToast();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { theme, cycleTheme } = useThemeMode();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userPresence, setUserPresence] = useState<UserPresenceStatus>("online");
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [profilePrefs, setProfilePrefs] = useState<{ displayName: string; avatarUrl: string; backgroundImageUrl: string }>({
    displayName: "",
    avatarUrl: "",
    backgroundImageUrl: "",
  });
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const { currentUser, userFallback } = useWorkspaceUser();
  const { profile } = useAuthProfile();
  const pathname = usePathname();
  const [tabs, setTabs] = useState<WorkspaceTab[]>([]);
  const [activeTab, setActiveTab] = useState("home");
  const [recentlyClosed, setRecentlyClosed] = useState<WorkspaceTab[]>([]);
  const [showRecentMenu, setShowRecentMenu] = useState(false);
  const [recentProjects, setRecentProjects] = useState<WorkspaceTab[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  const displayName =
    profilePrefs.displayName ||
    currentUser?.name ||
    profile?.displayName ||
    profile?.name ||
    profile?.email ||
    "User";
  const avatarUrl = profilePrefs.avatarUrl || currentUser?.avatarUrl || profile?.avatarUrl || undefined;
  const userInitials = useMemo(() => {
    const base = displayName?.trim() || "User";
    return base
      .split(/\s+/)
      .map((part: string) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [displayName]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [userMenuOpen]);

  useEffect(() => {
    setUserPresence(loadUserPresence());
    const onPresence = (event: Event) => {
      const detail = (event as CustomEvent<{ status?: UserPresenceStatus }>).detail;
      const next = detail?.status;
      if (next === "online" || next === "offline" || next === "away" || next === "dnd") {
        setUserPresence(next);
      } else {
        setUserPresence(loadUserPresence());
      }
    };
    window.addEventListener(USER_PRESENCE_EVENT, onPresence as EventListener);
    return () => window.removeEventListener(USER_PRESENCE_EVENT, onPresence as EventListener);
  }, []);

  useEffect(() => {
    setProfilePrefs(loadProfilePrefs());
    const onProfilePrefs = () => setProfilePrefs(loadProfilePrefs());
    window.addEventListener(USER_PROFILE_PREFS_EVENT, onProfilePrefs);
    return () => window.removeEventListener(USER_PROFILE_PREFS_EVENT, onProfilePrefs);
  }, []);


  useEffect(() => {
    if (!notificationsOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (!notificationRef.current) return;
      if (!notificationRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [notificationsOpen]);

  useEffect(() => {
    if (!showRecentMenu) return;
    const handleOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowRecentMenu(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showRecentMenu]);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const handleActivateWorkspaceTab = (tab: WorkspaceTab) => {
    setActiveTab(tab.id);
    setShowRecentMenu(false);
    router.push(tab.href);
  };

  const handleCloseWorkspaceTab = (tabId: string) => {
    const target = tabs.find((item) => item.id === tabId);
    if (!target || !target.closable) return;
    const nextRecent = recentProjects.filter((item) => item.id !== tabId);
    setRecentProjects(nextRecent);
    if (typeof window !== "undefined") {
      localStorage.setItem("recentProjects", JSON.stringify(nextRecent));
      window.dispatchEvent(new Event("recent-projects-updated"));
    }
    if (activeTab === tabId) {
      const fallback = tabs.find((item) => item.id === "home");
      if (fallback) {
        setActiveTab(fallback.id);
        router.push(fallback.href ?? "/");
      }
    }
    setRecentlyClosed((prev) => {
      const filtered = prev.filter((item) => item.id !== tabId);
      const next = [target, ...filtered].slice(0, 8);
      if (typeof window !== "undefined") {
        localStorage.setItem("recentlyClosedProjects", JSON.stringify(next));
      }
      return next;
    });
  };

  const restoreTab = (tab: WorkspaceTab) => {
    setShowRecentMenu(false);
    setRecentlyClosed((prev) => {
      const next = prev.filter((item) => item.id !== tab.id);
      if (typeof window !== "undefined") {
        localStorage.setItem("recentlyClosedProjects", JSON.stringify(next));
      }
      return next;
    });
    setRecentProjects((prev) => {
      if (prev.some((item) => item.id === tab.id)) return prev;
      const next = [...prev, tab];
      if (typeof window !== "undefined") {
        localStorage.setItem("recentProjects", JSON.stringify(next));
        window.dispatchEvent(new Event("recent-projects-updated"));
      }
      return next;
    });
    router.push(tab.href);
  };

  const ThemeIcon = useMemo(() => (mounted ? THEME_ICONS[theme] : Monitor), [theme, mounted]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadRecent = () => {
      if (typeof window === "undefined") return;
      const stored = localStorage.getItem("recentProjects");
      const parsed = stored ? (JSON.parse(stored) as WorkspaceTab[]) : [];
      setRecentProjects(parsed.filter((item) => item && item.id && item.href));
    };
    const loadClosed = () => {
      if (typeof window === "undefined") return;
      const stored = localStorage.getItem("recentlyClosedProjects");
      const parsed = stored ? (JSON.parse(stored) as WorkspaceTab[]) : [];
      setRecentlyClosed(parsed.filter((item) => item && item.id && item.href));
    };
    loadRecent();
    loadClosed();
    window.addEventListener("recent-projects-updated", loadRecent);
    return () => window.removeEventListener("recent-projects-updated", loadRecent);
  }, []);

  useEffect(() => {
    if (!pathname) return;
    const match = pathname.match(/^\/workspace\/[^/]+\/([^/]+)/);
    if (match?.[1]) {
      setActiveTab(match[1]);
    } else {
      setActiveTab("home");
    }
  }, [pathname]);

  useEffect(() => {
    setTabs([
      { id: "home", label: "Home", href: "/" },
      ...recentProjects.map((item) => ({ ...item, closable: true })),
    ]);
  }, [recentProjects]);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error("Logout failed", e);
      show({
        title: "로그아웃 실패",
        description: "네트워크 상태를 확인해주세요.",
        variant: "error",
      });
    } finally {
      // 프론트 상태 정리
      localStorage.removeItem("accessToken");
      setAuthToken(null);
      sessionStorage.removeItem("auth:justSignedIn");
      setUserMenuOpen(false);

      // 로그인 페이지로 이동
      router.replace("/sign-in ");
    }
  };

  const unreadCount = useMemo(
    () => notifications.filter((notice) => !notice.read).length,
    [notifications]
  );

  const loadNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to load notifications", error);
      show({
        title: "알림 로딩 실패",
        description: "알림을 불러오지 못했습니다.",
        variant: "error",
      });
    } finally {
      setLoadingNotifications(false);
    }
  };

  const toggleNotifications = async () => {
    setNotificationsOpen((prev) => !prev);
    if (!notificationsOpen) {
      await loadNotifications();
    }
  };

  const handleInviteAction = async (
    notification: NotificationItem,
    action: "accept" | "reject"
  ) => {
    const inviteId = notification.payload?.inviteId as string | undefined;
    const workspaceId = notification.payload?.workspaceId as string | undefined;
    if (!inviteId || !workspaceId) {
      show({
        title: "초대 처리 실패",
        description: "초대 정보를 확인할 수 없습니다.",
        variant: "error",
      });
      return;
    }
    try {
      if (action === "accept") {
        await acceptTeamInvite(workspaceId, inviteId);
        if (typeof window !== "undefined") {
          localStorage.setItem("activeWorkspaceId", workspaceId);
          window.dispatchEvent(new CustomEvent("workspace:select", { detail: { workspaceId } }));
          window.dispatchEvent(new Event("workspaces:refresh"));
          window.dispatchEvent(new Event("teams:refresh"));
        }
      } else {
        await rejectTeamInvite(workspaceId, inviteId);
      }
      setNotifications((prev) =>
        prev.map((item) => (item.id === notification.id ? { ...item, read: true } : item))
      );
      show({
        title: action === "accept" ? "초대 수락" : "초대 거절",
        description: action === "accept" ? "팀 초대를 수락했습니다." : "팀 초대를 거절했습니다.",
        variant: "success",
      });
    } catch (error) {
      console.error("Failed to handle invite", error);
      show({
        title: "초대 처리 실패",
        description: "다시 시도해주세요.",
        variant: "error",
      });
    }
  };

  const renderNotifications = () => (
    <div className="relative" ref={notificationRef}>
      <button
        type="button"
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-muted transition hover:bg-accent hover:text-foreground"
        aria-label="Notifications"
        onClick={toggleNotifications}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </button>
      {notificationsOpen && (
        <div className="absolute right-0 top-11 z-40 w-80 rounded-2xl border border-border bg-panel p-4 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">알림</p>
            <button
              type="button"
              className="text-xs text-muted hover:text-foreground"
              onClick={async () => {
                await markAllNotificationsRead();
                setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
              }}
            >
              모두 읽음
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {loadingNotifications ? (
              <div className="rounded-xl border border-border bg-accent px-3 py-4 text-sm text-muted">
                알림을 불러오는 중...
              </div>
            ) : notifications.length === 0 ? (
              <div className="rounded-xl border border-border bg-accent px-3 py-4 text-sm text-muted">
                새로운 알림이 없습니다.
              </div>
            ) : (
              notifications.map((notice) => {
                const normalizedType = String(notice.type ?? "").toUpperCase();
                const isInvite = normalizedType === "INVITE" || normalizedType === "TEAM_INVITE";
                const isFriendRequest = normalizedType === "FRIEND_REQUEST";
                const payload = notice.payload ?? {};
                const teamName = payload.teamName ?? "팀";
                const role = payload.role?.toLowerCase?.() ?? "member";
                const message = payload.message as string | undefined;
                const requesterName = payload.requesterName ?? "사용자";
                const roleLabel =
                  role === "owner"
                    ? "Owner"
                    : role === "manager"
                      ? "Manager"
                      : role === "guest"
                        ? "Guest"
                        : "Member";
                return (
                  <div
                    key={notice.id}
                    className={clsx(
                      "rounded-xl border border-border px-3 py-3 text-sm",
                      notice.read ? "bg-panel text-muted" : "bg-accent text-foreground"
                    )}
                  >
                    <p className="font-semibold">
                      {isInvite ? "팀 초대 알림" : isFriendRequest ? "친구 요청 알림" : "알림"}
                    </p>
                    {isInvite ? (
                      <>
                        <p className="mt-1 text-xs text-muted">팀: {teamName}</p>
                        <p className="mt-1 text-xs text-muted">역할: {roleLabel}</p>
                        <p className="mt-1 text-xs text-muted">
                          초대 메시지: {message?.trim() ? message : "—"}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {new Date(notice.createdAt).toLocaleString()}
                        </p>
                      </>
                    ) : isFriendRequest ? (
                      <>
                        <p className="mt-1 text-xs text-muted">{requesterName} 님이 친구 요청을 보냈습니다.</p>
                        <p className="mt-1 text-xs text-muted">
                          {new Date(notice.createdAt).toLocaleString()}
                        </p>
                      </>
                    ) : (
                      <p className="mt-1 text-xs text-muted">
                        {new Date(notice.createdAt).toLocaleString()}
                      </p>
                    )}
                    {isInvite && !notice.read && (
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          className="flex-1 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background"
                          onClick={() => handleInviteAction(notice, "accept")}
                        >
                          수락
                        </button>
                        <button
                          type="button"
                          className="flex-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted hover:text-foreground"
                          onClick={() => handleInviteAction(notice, "reject")}
                        >
                          거절
                        </button>
                      </div>
                    )}
                    {isFriendRequest && !notice.read && (
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          className="flex-1 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background"
                          onClick={async () => {
                            await markNotificationRead(notice.id);
                            setNotifications((prev) =>
                              prev.map((item) => (item.id === notice.id ? { ...item, read: true } : item))
                            );
                            if (typeof window !== "undefined") {
                              window.dispatchEvent(new Event("friends:open-requests"));
                            }
                            setNotificationsOpen(false);
                          }}
                        >
                          친구요청 보기
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
  const renderUserSection = () => (
    <div className="relative" ref={userMenuRef}>
      <button
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border bg-panel text-muted transition hover:text-foreground"
        aria-haspopup="menu"
        aria-expanded={userMenuOpen}
        onClick={() => setUserMenuOpen((prev) => !prev)}
        aria-label="User menu"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs font-semibold">{userInitials || userFallback}</span>
        )}
      </button>
      {userMenuOpen && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-52 rounded-md border border-border bg-panel py-1 shadow-panel">
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted transition hover:bg-accent hover:text-foreground"
            onClick={() => {
              setProfilePanelOpen(true);
              setUserMenuOpen(false);
            }}
          >
            <UserCircle2 size={16} />
            프로필 편집
          </button>
          <div className="group/status relative">
            <button
              type="button"
              className="flex w-full items-center justify-between px-3 py-2 text-sm text-muted transition hover:bg-accent hover:text-foreground"
            >
              <span className="inline-flex items-center gap-2">
                {userPresence === "online" && <span className="h-2.5 w-2.5 rounded-full bg-sky-400" aria-hidden />}
                {userPresence === "offline" && <span className="h-2.5 w-2.5 rounded-full bg-zinc-400" aria-hidden />}
                {userPresence === "away" && <Moon size={13} className="text-amber-400" aria-hidden />}
                {userPresence === "dnd" && <Ban size={13} className="text-rose-500" aria-hidden />}
                {userPresence === "online" && "온라인"}
                {userPresence === "offline" && "오프라인"}
                {userPresence === "away" && "자리비움"}
                {userPresence === "dnd" && "방해금지"}
              </span>
              <ChevronRight size={14} />
            </button>
            <div className="invisible absolute right-full top-0 z-50 mr-1 w-36 rounded-md border border-border bg-panel py-1 opacity-0 shadow-panel transition group-hover/status:visible group-hover/status:opacity-100 group-focus-within/status:visible group-focus-within/status:opacity-100">
              {[
                { key: "online", label: "온라인" },
                { key: "offline", label: "오프라인" },
                { key: "away", label: "자리비움" },
                { key: "dnd", label: "방해금지" },
              ].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted transition hover:bg-accent hover:text-foreground"
                  onClick={() => {
                    const next = option.key as UserPresenceStatus;
                    setUserPresence(next);
                    saveUserPresence(next);
                    setUserMenuOpen(false);
                  }}
                >
                  {option.key === "online" && <span className="h-2.5 w-2.5 rounded-full bg-sky-400" aria-hidden />}
                  {option.key === "offline" && <span className="h-2.5 w-2.5 rounded-full bg-zinc-400" aria-hidden />}
                  {option.key === "away" && <Moon size={13} className="text-amber-400" aria-hidden />}
                  {option.key === "dnd" && <Ban size={13} className="text-rose-500" aria-hidden />}
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="my-1 border-t border-border/70" />
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted transition hover:bg-accent hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </div>
  );

  const renderProfilePanel = () => (
    <Dialog.Root open={profilePanelOpen} onOpenChange={setProfilePanelOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-20 z-50 w-[500px] max-w-[92vw] -translate-x-1/2 rounded-2xl border border-border bg-panel p-5 shadow-panel focus:outline-none">
          <div className="mb-3 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-foreground">프로필 편집</Dialog.Title>
            <Dialog.Close className="rounded-full border border-border/70 p-1 text-muted transition hover:text-foreground" aria-label="닫기">
              <X size={16} />
            </Dialog.Close>
          </div>
          <MemberProfilePanel
            member={{
              id: profile?.id ?? currentUser?.id ?? "me",
              name: displayName,
              displayName: displayName,
              email: profile?.email ?? "",
              avatarUrl: avatarUrl,
              backgroundImageUrl: profilePrefs.backgroundImageUrl || profile?.backgroundImageUrl || undefined,
              description: profile?.bio ?? undefined,
              role: "member",
              joinedAt: Date.now(),
              lastActiveAt: Date.now(),
            }}
            presence={{
              memberId: profile?.id ?? "me",
              status: userPresence,
              lastSeenAt: Date.now(),
            }}
            canEditPresence
            canEditProfile
            canRemove={false}
            onPresenceChange={(status) => {
              setUserPresence(status);
              saveUserPresence(status);
            }}
            onProfileSave={async (patch) => {
              if (patch.displayName !== undefined || patch.bio !== undefined) {
                try {
                  await updateProfile({
                    displayName: patch.displayName?.trim(),
                    backgroundImageUrl: patch.backgroundImageUrl?.trim() ?? "",
                    bio: patch.bio,
                  });
                } catch {
                  // keep local fallback even if server update fails
                }
              }
              saveProfilePrefs({
                displayName: patch.displayName?.trim() ?? displayName,
                avatarUrl: patch.avatarUrl ?? "",
                backgroundImageUrl: patch.backgroundImageUrl ?? profilePrefs.backgroundImageUrl,
              });
              show({
                title: "프로필 저장 완료",
                description: "프로필 정보가 업데이트되었습니다.",
                variant: "success",
              });
              setProfilePanelOpen(false);
            }}
            onCancel={() => setProfilePanelOpen(false)}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );

  if (workspaceMode) {
    return (
      <>
        <header className="flex h-[56px] w-full items-center justify-between border-b border-border bg-panel px-4 text-foreground shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition-colors md:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3 text-sm">
          <button
            type="button"
            className="rounded-md p-2 text-muted transition-colors hover:bg-accent md:hidden"
            aria-label="Open navigation"
            onClick={() => {
              if (onOpenWorkspaceNav) {
                onOpenWorkspaceNav();
              } else {
                window.dispatchEvent(new Event("app:toggle-sidebar"));
              }
            }}
          >
            <Menu size={22} />
          </button>
          <button
            type="button"
            className="flex items-center gap-2"
            onClick={() => router.push("/")}
            aria-label="Go home"
          >
            <Image
              src="/logo.png"
              alt="Fourier logo"
              width={36}
              height={36}
              className="h-12 w-12 rounded-xl object-cover"
              priority
            />
            <span className="hidden text-lg font-semibold md:inline">Fourier</span>
          </button>
          <div className="hidden items-center gap-3 md:flex">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={clsx(
                  "group flex items-center gap-3 rounded-[14px] border border-border px-4 py-2 text-sm font-semibold transition",
                  activeTab === tab.id ? "bg-accent text-foreground shadow-[0_2px_8px_rgba(0,0,0,0.04)]" : "bg-panel text-muted hover:text-foreground"
                )}
              >
                <button
                  type="button"
                  className="flex items-center gap-2"
                  onClick={() => handleActivateWorkspaceTab(tab)}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-accent text-[11px] text-muted">
                    {tab.id === "home" ? <Home size={14} /> : tab.label.slice(0, 1)}
                  </span>
                  <span>{tab.label}</span>
                </button>
                {tab.closable && (
                  <button
                    type="button"
                    className="hidden rounded-full bg-accent p-1 text-muted transition hover:bg-accent/80 group-hover:flex"
                    aria-label={`Close ${tab.label}`}
                    onClick={() => handleCloseWorkspaceTab(tab.id)}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
            <div className="relative">
              <button
                type="button"
                className={clsx(
                  "flex items-center gap-2 rounded-[14px] border border-border px-4 py-2 text-sm text-muted hover:text-foreground",
                  showRecentMenu && "bg-accent text-foreground"
                )}
                aria-label="Recently closed tabs"
                onClick={() => setShowRecentMenu((prev) => !prev)}
              >
                <MoreHorizontal size={16} />
              </button>
              {showRecentMenu && (
                <div ref={menuRef} className="absolute right-0 top-full z-20 mt-2 w-60 rounded-2xl border border-border bg-panel p-3 text-sm shadow-xl">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted">Recently closed</p>
                  {recentlyClosed.length === 0 ? (
                    <p className="mt-2 text-xs text-muted">최근에 닫은 탭이 없습니다.</p>
                  ) : (
                    <div className="mt-2 space-y-1">
                      {recentlyClosed.map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-foreground hover:bg-accent"
                          onClick={() => restoreTab(tab)}
                        >
                          <span>{tab.label}</span>
                          <span className="text-[10px] uppercase tracking-[0.3em] text-muted">Restore</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          </div>

          <div className="flex items-center gap-2">
          <button
            className="hidden items-center gap-2 rounded-full border border-border px-3 py-2 text-sm uppercase tracking-[0.3em] text-muted transition hover:text-foreground md:flex"
            aria-label="Toggle theme"
            onClick={cycleTheme}
          >
            <ThemeIcon size={18} />
            <span className="capitalize" suppressHydrationWarning>
              {mounted ? theme : "system"}
            </span>
          </button>
          <div className="hidden md:block">
            <ToolbarIcon icon={RotateCcw} label="Refresh" onClick={() => window.location.reload()} />
          </div>
          <ToolbarIcon icon={MessageSquare} label="DM" onClick={() => window.dispatchEvent(new Event("dm:open"))} />
          {renderNotifications()}
          <ToolbarIcon icon={Settings} label="Settings" onClick={onWorkspaceSettings} />
            {renderUserSection()}
          </div>
        </header>
        {renderProfilePanel()}
      </>
    );
  }

  return (
    <>
      <header className="flex h-14 w-full items-center justify-between gap-3 border-b border-border bg-panel px-3 md:px-6">
        <div className="flex flex-1 items-center">
          <button
            type="button"
            className="hidden rounded-md p-2 text-muted transition-colors hover:bg-accent md:inline-flex"
            aria-label="Toggle navigation"
            onClick={() => window.dispatchEvent(new Event("app:toggle-sidebar"))}
          >
            <Menu size={24} />
          </button>

          {onToggleSidebarCollapse && (
            <button
              type="button"
              className="hidden rounded-md p-2 text-muted transition-colors hover:bg-accent md:inline-flex"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={onToggleSidebarCollapse}
            >
              <span aria-hidden="true" className="text-base leading-none">
                <Menu size={24} />
              </span>
            </button>
          )}

          <button
            type="button"
            className="flex items-center gap-2"
            onClick={() => router.push("/")}
            aria-label="Go home"
          >
            <Image
              src="/logo.png"
              alt="Fourier logo"
              width={20}
              height={20}
              className="h-7 w-7 rounded-md object-cover"
              priority
            />
            <div className="hidden flex-col leading-tight md:flex">
              <span className="text-sm font-semibold text-foreground">FOURIER</span>
            </div>
          </button>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3">
          <div className="hidden w-full max-w-sm md:block">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 text-muted" size={16} />
              <input
                className="w-full rounded-md border border-border bg-accent pl-9 pr-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-ring"
                placeholder="Search or run command (?+K)"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => show({ title: "Tip", description: "Press ?K to open the command palette." })}
              className="hidden rounded-md px-3 py-2 text-xs font-medium text-muted transition hover:bg-accent hover:text-foreground sm:inline-flex"
              aria-label="Tips"
            >
              <Info size={20} className="mr-1" />
              Help
            </button>
            <button
              className="hidden rounded-md p-2 text-muted transition hover:bg-accent md:inline-flex"
              aria-label={THEME_LABELS[theme]}
              onClick={cycleTheme}
              title={THEME_LABELS[theme]}
            >
              <ThemeIcon size={20} />
            </button>
            <div className="hidden md:block">{renderNotifications()}</div>
            <button
              className="hidden rounded-md p-2 text-muted transition hover:bg-accent md:inline-flex"
              aria-label="Settings"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings size={20} />
            </button>
            {renderUserSection()}
            <CommandPalette />
          </div>
        </div>
      </header>
      {renderProfilePanel()}
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
