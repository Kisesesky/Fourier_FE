// app/(workspace)/workspace/[teamId]/[projectId]/chat/_components/call-room/_components/CallSidePanel.tsx
'use client';

import { MessageSquare, MicOff, Monitor, UserX, Users, X } from "lucide-react";
import type { Msg, ChatUser, FileItem } from "@/workspace/chat/_model/types";
import type { RefObject } from "react";
import Composer from "../../Composer";
import MarkdownText from "../../MarkdownText";

type HostAction = {
  type: "force-mute" | "kick";
  targetUserId: string;
  name: string;
};

type CallSidePanelProps = {
  open: boolean;
  panelTab: "chat" | "participants";
  participantIds: string[];
  users: Record<string, ChatUser>;
  meId: string;
  callMessages: Msg[];
  mediaStateByUser: Record<string, { audio: boolean; video: boolean; screen: boolean }>;
  formatCallMessageTime: (ts: number) => string;
  panelRef?: RefObject<HTMLDivElement>;
  onClose: () => void;
  onSendMessage: (text: string, files?: FileItem[], extra?: { mentions?: string[]; parentId?: string | null }) => void | Promise<void>;
  onRequestHostAction: (action: HostAction) => void;
  hostControlsEnabled: boolean;
};

export function CallSidePanel({
  open,
  panelTab,
  participantIds,
  users,
  meId,
  callMessages,
  mediaStateByUser,
  formatCallMessageTime,
  panelRef,
  onClose,
  onSendMessage,
  onRequestHostAction,
  hostControlsEnabled,
}: CallSidePanelProps) {
  if (!open) return null;

  return (
    <aside className="pointer-events-none absolute right-3 top-14 z-20">
      <div ref={panelRef} className="pointer-events-auto flex h-[min(72vh,680px)] w-[320px] max-w-[calc(100vw-1rem)] min-w-[280px] flex-col overflow-hidden rounded-2xl border border-border bg-panel shadow-2xl">
      <div className="flex h-12 items-center justify-between border-b border-border px-3">
        <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
          {panelTab === "chat" ? <MessageSquare size={14} /> : <Users size={14} />}
          <span>{panelTab === "chat" ? "채팅" : `참여자 (${participantIds.length})`}</span>
        </div>
        <button
          type="button"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-subtle hover:text-foreground"
          onClick={onClose}
          title="패널 닫기"
        >
          <X size={14} />
        </button>
      </div>
      {panelTab === "chat" ? (
        <div className="flex min-h-0 flex-1 flex-col bg-background">
          <div className="flex-1 space-y-2 overflow-y-auto px-2.5 py-2">
            {callMessages.length === 0 ? (
              <div className="text-xs text-muted">아직 메시지가 없습니다.</div>
            ) : (
              callMessages.map((message) => {
                const author = users[message.authorId]?.displayName || users[message.authorId]?.name || message.author;
                const avatar = users[message.authorId]?.avatarUrl;
                return (
                  <div key={message.id} className="rounded-md bg-background px-2 py-2">
                    <div className="flex items-start gap-2">
                      <div className="h-7 w-7 overflow-hidden rounded-full bg-subtle/50">
                        {avatar ? (
                          <img src={avatar} alt={author} className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-foreground">
                            {author.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-xs font-semibold text-foreground">{author}</span>
                          <span className="text-[11px] text-muted">{formatCallMessageTime(message.ts)}</span>
                        </div>
                        <div className="mt-0.5 text-xs text-foreground">
                          <MarkdownText text={message.text} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="border-t border-border/60 p-2">
            <Composer
              variant="merged"
              placeholder="메시지 보내기..."
              onSend={async (text, files, extra) => {
                await onSendMessage(text, files, extra);
              }}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto bg-background p-2">
          {participantIds.map((uid) => {
            const user = users[uid];
            const displayName = user?.displayName || user?.name || "사용자";
            const canHostControl = hostControlsEnabled && uid !== meId;
            return (
              <div key={uid} className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-subtle/50">
                <div className="h-8 w-8 overflow-hidden rounded-full bg-subtle/40">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-foreground">
                      {displayName.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 items-center gap-1">
                  <span className="truncate text-sm text-foreground">{displayName}</span>
                  {!(mediaStateByUser[uid]?.audio ?? true) && <MicOff size={12} className="text-rose-500" />}
                  {(mediaStateByUser[uid]?.screen ?? false) && <Monitor size={12} className="text-indigo-500" />}
                </div>
                {canHostControl && (
                  <div className="ml-auto flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-amber-500 text-white hover:bg-amber-600"
                      title="강제 음소거"
                      onClick={() => onRequestHostAction({ type: "force-mute", targetUserId: uid, name: displayName })}
                    >
                      <MicOff size={13} />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-rose-600 text-white hover:bg-rose-700"
                      title="통화에서 내보내기"
                      onClick={() => onRequestHostAction({ type: "kick", targetUserId: uid, name: displayName })}
                    >
                      <UserX size={13} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      </div>
    </aside>
  );
}
