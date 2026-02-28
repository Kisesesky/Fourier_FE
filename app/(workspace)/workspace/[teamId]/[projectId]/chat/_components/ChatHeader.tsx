// app/(workspace)/workspace/[teamId]/[projectId]/chat/_components/ChatHeader.tsx
'use client';

import {
  Bookmark,
  Hash,
  MessageSquare,
  Mic,
  Pin,
  Users,
  Video,
  Info,
  Search,
  MoreHorizontal,
} from 'lucide-react';

import { useEffect, useMemo, useRef, useState } from "react";
import type { ViewMode } from "@/workspace/chat/_model/types";
import { CHAT_HEADER_ICON_BUTTON_CLASS } from "@/workspace/chat/_model/view.constants";

type ChatHeaderProps = {
  isDM: boolean;
  channelName: string;
  channelKind?: "text" | "voice" | "video";
  dmAvatarUrl?: string;
  memberIds: string[];
  users: Record<string, { id: string; name: string; avatarUrl?: string }>;
  topic?: string;
  view: ViewMode;
  onOpenMembersPanel: () => void;
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

export function ChatHeader({
  isDM,
  channelName,
  channelKind = "text",
  dmAvatarUrl,
  memberIds,
  users,
  topic,
  view,
  onOpenMembersPanel,
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
  const menuRef = useRef<HTMLDivElement | null>(null);
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

  return (
    <div className={`border-b border-border/70 bg-panel/85 px-4 ${pad}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-3">
          <button className="inline-flex items-center gap-2 text-[15px] font-semibold leading-none text-foreground">
            {isDM ? (
              dmAvatarUrl ? (
                <span className="h-6 w-6 overflow-hidden rounded-full bg-muted/20">
                  <img src={dmAvatarUrl} alt={channelName} className="h-full w-full object-cover" />
                </span>
              ) : (
                <MessageSquare size={16} className="text-muted" />
              )
            ) : (
              channelKind === "voice" ? (
                <Mic size={16} className="text-muted" />
              ) : channelKind === "video" ? (
                <Video size={16} className="text-muted" />
              ) : (
                <Hash size={16} className="text-muted" />
              )
            )}
            <span className="truncate max-w-[240px] sm:max-w-[320px] md:max-w-[380px]">{channelName}</span>
          </button>
          {!isDM && avatarMembers.length > 0 && (
            <div className="flex items-center">
              <div className="flex items-center -space-x-2">
                {avatarMembers.slice(0, 6).map((member) => (
                  <div
                    key={member.id}
                    className="h-7 w-7 overflow-hidden rounded-full bg-muted/20 text-[10px] font-semibold text-foreground"
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
          <button className={CHAT_HEADER_ICON_BUTTON_CLASS} title="Members" onClick={onOpenMembersPanel}>
            <Users size={16} />
          </button>
          <button className={CHAT_HEADER_ICON_BUTTON_CLASS} onClick={onOpenPins} title="Pins">
            <Pin size={16} />
            {pinCount > 0 && <span className="ml-1 text-[10px] text-muted">{pinCount}</span>}
          </button>
          <button className={CHAT_HEADER_ICON_BUTTON_CLASS} onClick={onOpenSaved} title="Saved">
            <Bookmark size={16} />
            {savedCount > 0 && <span className="ml-1 text-[10px] text-muted">{savedCount}</span>}
          </button>
          <button className={CHAT_HEADER_ICON_BUTTON_CLASS} onClick={onOpenCmd} title="Search messages">
            <Search size={16} />
          </button>
          <div className="relative" ref={menuRef}>
            <button className={CHAT_HEADER_ICON_BUTTON_CLASS} title="More" onClick={() => setMenuOpen((v) => !v)}>
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-panel p-1 text-xs shadow-panel">
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
