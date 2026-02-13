// components/layout/sidebar/ChatPanel.tsx
'use client';

import clsx from "clsx";
import { Plus } from "lucide-react";

import type { Channel, ChatUser } from "@/workspace/chat/_model/types";
import { useThreadItems } from "@/workspace/chat/_model/hooks/useThreadItems";
import { Section } from "./sidebar.shared";

type ChatPanelProps = {
  channels: Channel[];
  activeChannelId?: string;
  onOpenChannel: (id: string) => void;
  channelActivity: Record<string, { unreadCount?: number }>;
  onCreateChannel: () => void;
  onOpenThreads: () => void;
  lastReadAt: Record<string, number>;
  meId: string;
  users: Record<string, ChatUser>;
  onOpenThreadItem: (rootId: string) => void;
};

export default function ChatPanel({
  channels,
  activeChannelId,
  onOpenChannel,
  channelActivity,
  onCreateChannel,
  onOpenThreads,
  lastReadAt,
  meId,
  users,
  onOpenThreadItem,
}: ChatPanelProps) {
  const channelList = channels.filter((c) => !(c.isDM || c.id.startsWith("dm:")));
  const dmList = channels.filter((c) => c.isDM || c.id.startsWith("dm:"));
  const threadItems = useThreadItems({ channels, lastReadAt, meId, activityKey: channelActivity });

  return (
    <div className="space-y-4">
      <Section title="Channels">
        {channelList.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 px-3 py-2 text-xs text-muted">
            채널이 없습니다.
          </div>
        ) : (
          channelList.map((channel) => {
            const unreadCount = channelActivity[channel.id]?.unreadCount ?? 0;
            const unreadLabel = unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : "";
            return (
              <button
                key={channel.id}
                type="button"
                className={clsx(
                  "group flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-xs transition",
                  channel.id === activeChannelId
                    ? "border-brand/50 bg-brand/10 text-foreground shadow-sm"
                    : "border-border/60 bg-panel/70 hover:border-border hover:bg-accent/70"
                )}
                onClick={() => onOpenChannel(channel.id)}
              >
                <span className="inline-flex rounded-md bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-violet-500">#</span>
                <span className="truncate">{channel.name?.replace(/^#\s*/, "") || channel.id}</span>
                {unreadLabel && (
                  <span className="ml-auto rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-500">
                    {unreadLabel}
                  </span>
                )}
              </button>
            );
          })
        )}
        <button
          type="button"
          className="mt-1 flex w-full items-center gap-2 rounded-xl border border-border/60 bg-panel/70 px-3 py-2 text-left text-xs transition hover:border-border hover:bg-accent/70"
          onClick={onCreateChannel}
        >
          <Plus size={12} className="text-muted" />
          <span>새 채널</span>
        </button>
      </Section>
      <Section title="DM">
        {dmList.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 px-3 py-2 text-xs text-muted">
            DM이 없습니다.
          </div>
        ) : (
          dmList.map((channel) => {
            const raw = channel.id.replace(/^dm:/, "");
            const dmIds = raw.split("+").filter(Boolean);
            const otherId = dmIds.find((id) => id !== meId) ?? dmIds[0];
            const dmUser = otherId ? users[otherId] : undefined;
            const dmName = dmUser?.name || channel.name?.replace(/^@\s*/, "") || raw || "Direct Message";
            return (
              <button
                key={channel.id}
                type="button"
                className={clsx(
                  "group flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-xs transition",
                  channel.id === activeChannelId
                    ? "border-brand/50 bg-brand/10 text-foreground shadow-sm"
                    : "border-border/60 bg-panel/70 hover:border-border hover:bg-accent/70"
                )}
                onClick={() => onOpenChannel(channel.id)}
              >
                <span className="h-6 w-6 overflow-hidden rounded-full bg-muted/20">
                  {dmUser?.avatarUrl ? (
                    <img src={dmUser.avatarUrl} alt={dmName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[9px] font-semibold text-foreground">
                      {dmName.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </span>
                <span className="inline-flex rounded-full bg-sky-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-sky-500">DM</span>
                <span className="truncate">{dmName}</span>
              </button>
            );
          })
        )}
      </Section>
      <Section
        title={
          <span className="flex items-center gap-2">
            <span>Threads</span>
            <span className="rounded-full bg-subtle/60 px-2 py-0.5 text-[10px] text-muted">
              {threadItems.length}
            </span>
          </span>
        }
      >
        {threadItems.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 px-3 py-2 text-xs text-muted">
            참여한 스레드가 없습니다.
          </div>
        ) : (
          threadItems.slice(0, 5).map((item) => {
            const unreadLabel = item.unread > 99 ? "99+" : item.unread > 0 ? String(item.unread) : "";
            return (
              <button
                key={`${item.channelId}:${item.rootId}`}
                type="button"
                className="flex w-full flex-col gap-1 rounded-xl border border-border/60 bg-panel/70 px-3 py-2.5 text-left text-xs transition hover:border-border hover:bg-accent/70"
                onClick={() => onOpenThreadItem(item.rootId)}
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex rounded-md bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-violet-500">#</span>
                  <span className="truncate font-semibold text-foreground">{item.channelName}</span>
                  {unreadLabel && (
                    <span className="ml-auto rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-500">
                      {unreadLabel}
                    </span>
                  )}
                </div>
                <span className="truncate text-[11px] text-muted">
                  {item.lastPreview || "메시지 없음"}
                </span>
              </button>
            );
          })
        )}
        {threadItems.length > 5 && (
          <button
            type="button"
            className="w-full rounded-xl border border-border/60 bg-panel/70 px-3 py-2 text-left text-xs text-muted hover:border-border hover:bg-accent/70"
            onClick={onOpenThreads}
          >
            전체 스레드 보기
          </button>
        )}
      </Section>
    </div>
  );
}
