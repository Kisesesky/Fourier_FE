// components/layout/Topbar.tsx
"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { useToast } from "@/components/ui/Toast";
import {
  Bell,
  Home,
  Info,
  LogOut,
  Menu,
  Monitor,
  Moon,
  MoreHorizontal,
  RotateCcw,
  Search,
  Settings,
  Sun,
  X,
} from "lucide-react";
import CommandPalette from "@/components/command/CommandPalette";
import SettingsModal from "@/components/settings/SettingsModal";
import { ThemeMode } from "@/lib/theme";
import { useThemeMode } from "@/hooks/useThemeMode";
import { useWorkspaceUser } from "@/hooks/useWorkspaceUser";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import { signOut } from "@/lib/auth";
import { setAuthToken } from "@/lib/api";

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
    className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-accent hover:text-foreground"
    aria-label={label}
    onClick={onClick}
  >
    <Icon size={16} />
  </button>
);

export default function Topbar({
  onToggleSidebarCollapse,
  sidebarCollapsed,
  workspaceMode = false,
  onWorkspaceSettings,
}: TopbarProps = {}) {
  const { show } = useToast();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { theme, cycleTheme } = useThemeMode();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
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

  const displayName = currentUser?.name ?? profile?.email ?? "User";
  const avatarUrl = currentUser?.avatarUrl ?? undefined;
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

  const ThemeIcon = useMemo(() => THEME_ICONS[theme], [theme]);

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
      router.replace("/login");
    }
  };
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
        <div className="absolute right-0 top-[calc(100%+8px)] w-36 rounded-md border border-border bg-panel shadow-panel">
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

  if (workspaceMode) {
    return (
      <header className="flex h-[56px] w-full items-center justify-between border-b border-border bg-panel px-4 text-foreground shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition-colors md:px-8">
        <div className="flex items-center gap-3 text-sm">
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
              className="h-9 w-9 rounded-xl object-cover"
              priority
            />
            <span className="text-lg font-semibold">Fourier</span>
          </button>
          <div className="flex items-center gap-3">
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

        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs uppercase tracking-[0.3em] text-muted transition hover:text-foreground"
            aria-label="Toggle theme"
            onClick={cycleTheme}
          >
            <ThemeIcon size={16} />
            <span className="capitalize">{theme}</span>
          </button>
          <ToolbarIcon icon={RotateCcw} label="Refresh" onClick={() => window.location.reload()} />
          <ToolbarIcon icon={Bell} label="Notifications" />
          <ToolbarIcon icon={Settings} label="Settings" onClick={onWorkspaceSettings} />
          {renderUserSection()}
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="flex h-14 w-full items-center justify-between gap-3 border-b border-border bg-panel px-3 md:px-6">
        <div className="flex flex-1 items-center">
          <button
            type="button"
            className="rounded-md p-2 text-muted transition-colors hover:bg-accent md:hidden"
            aria-label="Toggle navigation"
            onClick={() => window.dispatchEvent(new Event("app:toggle-sidebar"))}
          >
            <Menu size={20} />
          </button>

          {onToggleSidebarCollapse && (
            <button
              type="button"
              className="hidden rounded-md p-2 text-muted transition-colors hover:bg-accent md:inline-flex"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={onToggleSidebarCollapse}
            >
              <span aria-hidden="true" className="text-base leading-none">
                <Menu size={20} />
              </span>
            </button>
          )}

          <button
            type="button"
            className="hidden items-center gap-2 md:flex"
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
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-foreground">FOURIER</span>
            </div>
          </button>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3">
          <div className="w-full max-w-sm">
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
              <Info size={16} className="mr-1" />
              Help
            </button>
            <button
              className="rounded-md p-2 text-muted transition hover:bg-accent"
              aria-label={THEME_LABELS[theme]}
              onClick={cycleTheme}
              title={THEME_LABELS[theme]}
            >
              <ThemeIcon size={18} />
            </button>
            <button className="rounded-md p-2 text-muted transition hover:bg-accent" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <button
              className="rounded-md p-2 text-muted transition hover:bg-accent"
              aria-label="Settings"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings size={18} />
            </button>
            {renderUserSection()}
            <CommandPalette />
          </div>
        </div>
      </header>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
