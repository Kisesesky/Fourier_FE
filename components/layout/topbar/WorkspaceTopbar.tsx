// components/layout/topbar/WorkspaceTopbar.tsx
'use client';

import Image from "next/image";
import clsx from "clsx";
import { Home, Menu, MessageSquare, MoreHorizontal, RotateCcw, Settings, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MutableRefObject, ReactNode } from "react";

import ToolbarIcon from "./ToolbarIcon";
import type { WorkspaceTab } from "./topbar.types";

type WorkspaceTopbarProps = {
  onOpenWorkspaceNav?: () => void;
  onGoHome: () => void;
  tabs: WorkspaceTab[];
  activeTab: string;
  showRecentMenu: boolean;
  recentlyClosed: WorkspaceTab[];
  menuRef: MutableRefObject<HTMLDivElement | null>;
  onToggleRecentMenu: () => void;
  onActivateWorkspaceTab: (tab: WorkspaceTab) => void;
  onCloseWorkspaceTab: (tabId: string) => void;
  onRestoreTab: (tab: WorkspaceTab) => void;
  themeIcon: LucideIcon;
  mounted: boolean;
  theme: string;
  onCycleTheme: () => void;
  onOpenWorkspaceSettings?: () => void;
  notificationsMenu: ReactNode;
  userMenu: ReactNode;
  onOpenDm: () => void;
};

export default function WorkspaceTopbar({
  onOpenWorkspaceNav,
  onGoHome,
  tabs,
  activeTab,
  showRecentMenu,
  recentlyClosed,
  menuRef,
  onToggleRecentMenu,
  onActivateWorkspaceTab,
  onCloseWorkspaceTab,
  onRestoreTab,
  themeIcon: ThemeIcon,
  mounted,
  theme,
  onCycleTheme,
  onOpenWorkspaceSettings,
  notificationsMenu,
  userMenu,
  onOpenDm,
}: WorkspaceTopbarProps) {
  return (
    <header className="flex h-[56px] w-full items-center justify-between border-b border-border bg-panel px-4 text-foreground shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition-colors md:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3 text-sm">
        <button
          type="button"
          className="rounded-md p-2 text-muted transition-colors hover:bg-accent md:hidden"
          aria-label="Open navigation"
          onClick={() => {
            if (onOpenWorkspaceNav) onOpenWorkspaceNav();
            else window.dispatchEvent(new Event("app:toggle-sidebar"));
          }}
        >
          <Menu size={22} />
        </button>
        <button
          type="button"
          className="flex items-center gap-2"
          onClick={onGoHome}
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
                onClick={() => onActivateWorkspaceTab(tab)}
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
                  onClick={() => onCloseWorkspaceTab(tab.id)}
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
              onClick={onToggleRecentMenu}
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
                        onClick={() => onRestoreTab(tab)}
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
          onClick={onCycleTheme}
        >
          <ThemeIcon size={18} />
          <span className="capitalize" suppressHydrationWarning>
            {mounted ? theme : "system"}
          </span>
        </button>
        <div className="hidden md:block">
          <ToolbarIcon icon={RotateCcw} label="Refresh" onClick={() => window.location.reload()} />
        </div>
        <ToolbarIcon icon={MessageSquare} label="DM" onClick={onOpenDm} />
        {notificationsMenu}
        <ToolbarIcon icon={Settings} label="Settings" onClick={onOpenWorkspaceSettings} />
        {userMenu}
      </div>
    </header>
  );
}
