'use client';

import {
  Bookmark,
  Hash,
  MessageSquare,
  Pin,
  Users,
  Info,
  ChevronDown,
  Search,
  MoreHorizontal,
} from 'lucide-react';

import { useEffect, useMemo, useRef, useState } from "react";
import type { ViewMode } from "@/workspace/chat/_model/types";

type ChatHeaderProps = {
  isDM: boolean;
  channelName: string;
  dmAvatarUrl?: string;
  memberNames: string[];
  memberIds: string[];
  users: Record<string, { id: string; name: string; avatarUrl?: string }>;
  topic?: string;
  view: ViewMode;
  onOpenInvite: () => void;
  onOpenCmd: () => void;
  onOpenPins: () => void;
  onOpenSaved: () => void;
  onLeaveChannel: () => void;
  onKickMember: () => void;
  onBlockMember: () => void;
  onOpenNotifications: () => void;
  pinCount?: number;
  savedCount?: number;
};

const ghostActionClass =
  'inline-flex items-center gap-1 text-[12px] font-medium text-muted transition-colors duration-150 ease-out hover:text-foreground';

const iconButtonClass =
  'inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition hover:bg-subtle/60 hover:text-foreground';

export function ChatHeader({
  isDM,
  channelName,
  dmAvatarUrl,
  memberNames,
  memberIds,
  users,
  topic,
  view,
  onOpenInvite,
  onOpenCmd,
  onOpenPins,
  onOpenSaved,
  onLeaveChannel,
  onKickMember,
  onBlockMember,
  onOpenNotifications,
  pinCount = 0,
  savedCount = 0,
}: ChatHeaderProps) {
  const pad = view === 'compact' ? 'py-2' : 'py-2.5';
  const [menuOpen, setMenuOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const membersRef = useRef<HTMLDivElement | null>(null);
  const avatarMembers = useMemo(
    () =>
      memberIds
        .map((id) => users[id])
        .filter(Boolean)
        .map((u) => ({ id: u.id, name: u.name, avatarUrl: u.avatarUrl })),
    [memberIds, users],
  );

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler as unknown as EventListener);
    return () => document.removeEventListener("mousedown", handler as unknown as EventListener);
  }, [menuOpen]);

  useEffect(() => {
    if (!membersOpen) return;
    const handler = (event: MouseEvent) => {
      if (!membersRef.current) return;
      if (!membersRef.current.contains(event.target as Node)) {
        setMembersOpen(false);
      }
    };
    document.addEventListener("mousedown", handler as unknown as EventListener);
    return () => document.removeEventListener("mousedown", handler as unknown as EventListener);
  }, [membersOpen]);

  return (
    <div className={`px-4 border-b border-border bg-panel/80 ${pad}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-3">
          <button className="inline-flex items-center gap-2 text-[15px] font-semibold leading-none text-foreground">
            {isDM ? (
              dmAvatarUrl ? (
                <span className="h-6 w-6 overflow-hidden rounded-full border border-border/60 bg-muted/20">
                  <img src={dmAvatarUrl} alt={channelName} className="h-full w-full object-cover" />
                </span>
              ) : (
                <MessageSquare size={16} className="text-muted" />
              )
            ) : (
              <Hash size={16} className="text-muted" />
            )}
            <span className="truncate max-w-[240px] sm:max-w-[320px] md:max-w-[380px]">{channelName}</span>
          </button>
          {!isDM && avatarMembers.length > 0 && (
            <div className="flex items-center">
              <div className="flex items-center -space-x-2">
                {avatarMembers.slice(0, 6).map((member) => (
                  <div
                    key={member.id}
                    className="h-7 w-7 overflow-hidden rounded-full border border-border bg-muted/20 text-[10px] font-semibold text-foreground"
                    title={member.name}
                  >
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        {member.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                ))}
                {avatarMembers.length > 6 && (
                  <div className="ml-2 text-[10px] font-semibold text-muted">
                    +{avatarMembers.length - 6}
                  </div>
                )}
              </div>
            </div>
          )}
          {!isDM && topic && (
            <span className="hidden md:inline-flex items-center gap-1 text-[12px] text-muted truncate max-w-[280px]">
              <Info size={12} className="opacity-70" />
              {topic}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <div className="relative inline-flex items-center" ref={membersRef}>
            <button className={iconButtonClass} title="Members" onClick={() => setMembersOpen((v) => !v)}>
              <Users size={16} />
            </button>
            {membersOpen && (
              <div className="absolute left-0 top-9 z-20 min-w-[220px] rounded-md border border-border bg-panel p-2 text-xs text-muted shadow-panel">
                <div className="mb-2 text-[11px] font-semibold text-foreground">Members</div>
                <div className="max-h-40 space-y-1 overflow-auto">
                  {memberNames.length === 0 ? (
                    <div className="text-muted">멤버 없음</div>
                  ) : (
                    memberNames.map((name) => (
                      <div key={name} className="truncate rounded px-1.5 py-0.5 hover:bg-subtle/60">
                        {name}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <button className={iconButtonClass} onClick={onOpenPins} title="Pins">
            <Pin size={16} />
            {pinCount > 0 && <span className="ml-1 text-[10px] text-muted">{pinCount}</span>}
          </button>
          <button className={iconButtonClass} onClick={onOpenSaved} title="Saved">
            <Bookmark size={16} />
            {savedCount > 0 && <span className="ml-1 text-[10px] text-muted">{savedCount}</span>}
          </button>
          <button className={iconButtonClass} onClick={onOpenCmd} title="Search messages">
            <Search size={16} />
          </button>
          <div className="relative" ref={menuRef}>
            <button className={iconButtonClass} title="More" onClick={() => setMenuOpen((v) => !v)}>
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md border border-border bg-panel p-1 text-xs shadow-panel">
                <button className="w-full rounded px-2 py-1 text-left hover:bg-subtle/60" onClick={onLeaveChannel}>채팅방 나가기</button>
                <button className="w-full rounded px-2 py-1 text-left hover:bg-subtle/60" onClick={onKickMember}>특정 멤버 강퇴</button>
                <button className="w-full rounded px-2 py-1 text-left hover:bg-subtle/60" onClick={onBlockMember}>차단하기</button>
                <button className="w-full rounded px-2 py-1 text-left hover:bg-subtle/60" onClick={onOpenNotifications}>알람 설정</button>
                <button className="w-full rounded px-2 py-1 text-left hover:bg-subtle/60" onClick={onOpenInvite}>채팅 초대</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
