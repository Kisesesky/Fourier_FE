// components/layout/topbar/DefaultTopbar.tsx
'use client';

import Image from "next/image";
import { Info, Menu, Search, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type DefaultTopbarProps = {
  onToggleSidebarCollapse?: () => void;
  sidebarCollapsed?: boolean;
  onToggleSidebarNav: () => void;
  onGoHome: () => void;
  onShowTip: () => void;
  onCycleTheme: () => void;
  themeIcon: LucideIcon;
  themeLabel: string;
  notificationsMenu: ReactNode;
  userMenu: ReactNode;
  onOpenSettings: () => void;
  commandPalette: ReactNode;
};

export default function DefaultTopbar({
  onToggleSidebarCollapse,
  sidebarCollapsed,
  onToggleSidebarNav,
  onGoHome,
  onShowTip,
  onCycleTheme,
  themeIcon: ThemeIcon,
  themeLabel,
  notificationsMenu,
  userMenu,
  onOpenSettings,
  commandPalette,
}: DefaultTopbarProps) {
  return (
    <header className="flex h-14 w-full items-center justify-between gap-3 border-b border-border bg-panel px-3 md:px-6">
      <div className="flex flex-1 items-center">
        <button
          type="button"
          className="hidden rounded-md p-2 text-muted transition-colors hover:bg-accent md:inline-flex"
          aria-label="Toggle navigation"
          onClick={onToggleSidebarNav}
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
          onClick={onGoHome}
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
            onClick={onShowTip}
            className="hidden rounded-md px-3 py-2 text-xs font-medium text-muted transition hover:bg-accent hover:text-foreground sm:inline-flex"
            aria-label="Tips"
          >
            <Info size={20} className="mr-1" />
            Help
          </button>
          <button
            className="hidden rounded-md p-2 text-muted transition hover:bg-accent md:inline-flex"
            aria-label={themeLabel}
            onClick={onCycleTheme}
            title={themeLabel}
          >
            <ThemeIcon size={20} />
          </button>
          <div className="hidden md:block">{notificationsMenu}</div>
          <button
            className="hidden rounded-md p-2 text-muted transition hover:bg-accent md:inline-flex"
            aria-label="Settings"
            onClick={onOpenSettings}
          >
            <Settings size={20} />
          </button>
          {userMenu}
          {commandPalette}
        </div>
      </div>
    </header>
  );
}
