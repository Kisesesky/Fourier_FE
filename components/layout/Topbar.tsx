// components/layout/Topbar.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { Monitor } from "lucide-react";
import CommandPalette from "@/components/command/CommandPalette";
import SettingsModal from "@/components/settings/SettingsModal";
import { useThemeMode } from "@/hooks/useThemeMode";
import { useWorkspaceUser } from "@/hooks/useWorkspaceUser";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import { signOut, updateProfile } from "@/lib/auth";
import { setAuthToken } from "@/lib/api";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead, type NotificationItem } from "@/lib/notifications";
import { acceptTeamInvite, rejectTeamInvite } from "@/lib/team";
import { loadUserPresence, saveUserPresence, USER_PRESENCE_EVENT, type UserPresenceStatus } from "@/lib/presence";
import { loadProfilePrefs, saveProfilePrefs, USER_PROFILE_PREFS_EVENT } from "@/lib/profile-prefs";
import NotificationsMenu from "@/components/layout/topbar/NotificationsMenu";
import DefaultTopbar from "@/components/layout/topbar/DefaultTopbar";
import ProfilePanel from "@/components/layout/topbar/ProfilePanel";
import UserMenu from "@/components/layout/topbar/UserMenu";
import WorkspaceTopbar from "@/components/layout/topbar/WorkspaceTopbar";
import { THEME_ICONS, THEME_LABELS } from "@/components/layout/topbar/topbar.constants";
import type { TopbarProps, WorkspaceTab } from "@/components/layout/topbar/topbar.types";

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
      router.replace("/sign-in");
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

  const handleOpenFriendRequest = async (notification: NotificationItem) => {
    await markNotificationRead(notification.id);
    setNotifications((prev) =>
      prev.map((item) => (item.id === notification.id ? { ...item, read: true } : item))
    );
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("friends:open-requests"));
    }
  };

  const handleProfilePresenceChange = (status: UserPresenceStatus) => {
    setUserPresence(status);
    saveUserPresence(status);
  };

  const handleProfileSave = async (patch: {
    displayName?: string;
    avatarUrl?: string | null;
    backgroundImageUrl?: string | null;
    bio?: string;
  }) => {
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
  };

  const profilePanel = (
    <ProfilePanel
      open={profilePanelOpen}
      onOpenChange={setProfilePanelOpen}
      profileId={profile?.id}
      currentUserId={currentUser?.id}
      displayName={displayName}
      email={profile?.email ?? ""}
      avatarUrl={avatarUrl}
      backgroundImageUrl={profilePrefs.backgroundImageUrl || profile?.backgroundImageUrl || undefined}
      bio={profile?.bio ?? undefined}
      presence={userPresence}
      onPresenceChange={handleProfilePresenceChange}
      onProfileSave={handleProfileSave}
    />
  );

  const notificationsMenu = (
    <NotificationsMenu
      open={notificationsOpen}
      unreadCount={unreadCount}
      loading={loadingNotifications}
      notifications={notifications}
      containerRef={notificationRef}
      onToggle={() => void toggleNotifications()}
      onClose={() => setNotificationsOpen(false)}
      onMarkAllRead={async () => {
        await markAllNotificationsRead();
        setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      }}
      onInviteAction={handleInviteAction}
      onOpenFriendRequest={handleOpenFriendRequest}
    />
  );

  const userMenu = (
    <UserMenu
      open={userMenuOpen}
      containerRef={userMenuRef}
      avatarUrl={avatarUrl}
      displayName={displayName}
      userInitials={userInitials}
      userFallback={userFallback}
      userPresence={userPresence}
      onToggle={() => setUserMenuOpen((prev) => !prev)}
      onClose={() => setUserMenuOpen(false)}
      onOpenProfile={() => setProfilePanelOpen(true)}
      onChangePresence={(next) => {
        setUserPresence(next);
        saveUserPresence(next);
      }}
      onLogout={handleLogout}
    />
  );

  if (workspaceMode) {
    return (
      <>
        <WorkspaceTopbar
          onOpenWorkspaceNav={onOpenWorkspaceNav}
          onGoHome={() => router.push("/")}
          tabs={tabs}
          activeTab={activeTab}
          showRecentMenu={showRecentMenu}
          recentlyClosed={recentlyClosed}
          menuRef={menuRef}
          onToggleRecentMenu={() => setShowRecentMenu((prev) => !prev)}
          onActivateWorkspaceTab={handleActivateWorkspaceTab}
          onCloseWorkspaceTab={handleCloseWorkspaceTab}
          onRestoreTab={restoreTab}
          themeIcon={ThemeIcon}
          mounted={mounted}
          theme={theme}
          onCycleTheme={cycleTheme}
          onOpenWorkspaceSettings={onWorkspaceSettings}
          notificationsMenu={notificationsMenu}
          userMenu={userMenu}
          onOpenDm={() => window.dispatchEvent(new Event("dm:open"))}
        />
        {profilePanel}
      </>
    );
  }

  return (
    <>
      <DefaultTopbar
        onToggleSidebarCollapse={onToggleSidebarCollapse}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebarNav={() => window.dispatchEvent(new Event("app:toggle-sidebar"))}
        onGoHome={() => router.push("/")}
        onShowTip={() => show({ title: "Tip", description: "Press ?K to open the command palette." })}
        onCycleTheme={cycleTheme}
        themeIcon={ThemeIcon}
        themeLabel={THEME_LABELS[theme]}
        notificationsMenu={notificationsMenu}
        userMenu={userMenu}
        onOpenSettings={() => setSettingsOpen(true)}
        commandPalette={<CommandPalette />}
      />
      {profilePanel}
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
