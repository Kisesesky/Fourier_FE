// components/layout/topbar/UserMenu.tsx
'use client';

import { Ban, ChevronRight, LogOut, Moon, UserCircle2 } from "lucide-react";
import type { MutableRefObject } from "react";

import type { UserPresenceStatus } from "@/lib/presence";

type UserMenuProps = {
  open: boolean;
  containerRef: MutableRefObject<HTMLDivElement | null>;
  avatarUrl?: string;
  displayName: string;
  userInitials: string;
  userFallback: string;
  userPresence: UserPresenceStatus;
  onToggle: () => void;
  onClose: () => void;
  onOpenProfile: () => void;
  onChangePresence: (next: UserPresenceStatus) => void;
  onLogout: () => Promise<void>;
};

const PRESENCE_OPTIONS: Array<{ key: UserPresenceStatus; label: string }> = [
  { key: "online", label: "온라인" },
  { key: "offline", label: "오프라인" },
  { key: "away", label: "자리비움" },
  { key: "dnd", label: "방해금지" },
];

function PresenceDot({ status }: { status: UserPresenceStatus }) {
  if (status === "online") return <span className="h-2.5 w-2.5 rounded-full bg-sky-400" aria-hidden />;
  if (status === "offline") return <span className="h-2.5 w-2.5 rounded-full bg-zinc-400" aria-hidden />;
  if (status === "away") return <Moon size={13} className="text-amber-400" aria-hidden />;
  return <Ban size={13} className="text-rose-500" aria-hidden />;
}

function PresenceLabel({ status }: { status: UserPresenceStatus }) {
  if (status === "online") return <>온라인</>;
  if (status === "offline") return <>오프라인</>;
  if (status === "away") return <>자리비움</>;
  return <>방해금지</>;
}

export default function UserMenu({
  open,
  containerRef,
  avatarUrl,
  displayName,
  userInitials,
  userFallback,
  userPresence,
  onToggle,
  onClose,
  onOpenProfile,
  onChangePresence,
  onLogout,
}: UserMenuProps) {
  return (
    <div className="relative" ref={containerRef}>
      <button
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border bg-panel text-muted transition hover:text-foreground"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={onToggle}
        aria-label="User menu"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs font-semibold">{userInitials || userFallback}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-52 rounded-md border border-border bg-panel py-1 shadow-panel">
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted transition hover:bg-accent hover:text-foreground"
            onClick={() => {
              onOpenProfile();
              onClose();
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
                <PresenceDot status={userPresence} />
                <PresenceLabel status={userPresence} />
              </span>
              <ChevronRight size={14} />
            </button>
            <div className="invisible absolute right-full top-0 z-50 mr-1 w-36 rounded-md border border-border bg-panel py-1 opacity-0 shadow-panel transition group-hover/status:visible group-hover/status:opacity-100 group-focus-within/status:visible group-focus-within/status:opacity-100">
              {PRESENCE_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted transition hover:bg-accent hover:text-foreground"
                  onClick={() => {
                    onChangePresence(option.key);
                    onClose();
                  }}
                >
                  <PresenceDot status={option.key} />
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="my-1 border-t border-border/70" />
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted transition hover:bg-accent hover:text-foreground"
            onClick={() => void onLogout()}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
