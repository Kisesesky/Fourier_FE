// app/(workspace)/workspace/[teamId]/[projectId]/chat/_components/ChatDashboard.tsx
'use client';

import { useMemo, useCallback, useEffect, useRef, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  Archive,
  ArchiveRestore,
  Bell,
  BellOff,
  CheckCheck,
  Hash,
  Info,
  MoreHorizontal,
  Pin,
  PinOff,
  PlusCircle,
  Search,
  Star,
  MessageSquare,
  Users,
} from "lucide-react";
import { useChat } from "@/workspace/chat/_model/store";
import { useWorkspacePath } from "@/hooks/useWorkspacePath";
import type { Channel, ChatUser, PresenceState } from "@/workspace/chat/_model/types";
import { useChatDashboardUiStore } from "@/workspace/chat/_model/store/useChatDashboardUiStore";

type FilterKey = "all" | "starred" | "unread" | "mentions" | "dm";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "unread", label: "읽지 않음" },
  { key: "mentions", label: "@멘션" },
  { key: "starred", label: "즐겨찾기" },
  { key: "dm", label: "DM" },
];

type ChannelEntry = {
  channel: Channel;
  displayName: string;
  topic?: string;
  lastPreview?: string;
  lastAuthor?: string;
  lastTs: number;
  unread: number;
  mentions: number;
  starred: boolean;
  isDM: boolean;
  avatarUrl?: string;
  presence?: PresenceState;
  muted?: boolean;
};

const relativeTime = (ts: number) => {
  if (!ts) return "최근 활동 없음";
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(ts).toLocaleDateString();
};

const presenceColors: Record<PresenceState, string> = {
  online: "bg-emerald-500",
  away: "bg-amber-400",
  busy: "bg-rose-500",
  offline: "bg-zinc-400",
};

const EmptyState = ({ label }: { label: string }) => (
  <div className="border border-dashed border-border/80 bg-background px-4 py-8 text-center">
    <p className="text-sm text-muted">{label}</p>
  </div>
);

export default function ChatDashboard() {
  const router = useRouter();
  const { buildHref } = useWorkspacePath();
  const {
    channels,
    channelActivity,
    channelTopics,
    workspaces,
    workspaceId,
    setChannel,
    channelId,
    users,
    me,
    userStatus,
    toggleStar,
    setChannelMuted,
    markChannelRead,
    pinnedChannelIds,
    archivedChannelIds,
    togglePinnedChannel,
    toggleArchivedChannel,
    loadChannels,
  } = useChat();
  const {
    filter,
    setFilter,
    query,
    setQuery,
    listMode,
    setListMode,
    showArchived,
    setShowArchived,
    mentionsOnly,
    setMentionsOnly,
    menuOpen,
    setMenuOpen,
    resetChatDashboardUiState,
  } = useChatDashboardUiStore();
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void loadChannels();
  }, [loadChannels]);

  useEffect(() => {
    resetChatDashboardUiState();
  }, [resetChatDashboardUiState]);

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

  const activeWorkspace = useMemo(() => workspaces.find((ws) => ws.id === workspaceId), [workspaces, workspaceId]);
  const starredSet = useMemo(() => {
    const starredSection = activeWorkspace?.sections.find((sec) => sec.type === "starred");
    return new Set(starredSection?.itemIds ?? []);
  }, [activeWorkspace]);

  const normalizedQuery = query.trim().toLowerCase();

  const entries = useMemo<ChannelEntry[]>(() => {
    return channels
      .map((channel) => {
        const isDM = !!channel.isDM || channel.id.startsWith("dm:");
        const activity = channelActivity[channel.id];
        const topic = isDM ? undefined : channelTopics[channel.id]?.topic;
        const muted = channelTopics[channel.id]?.muted ?? false;
        const starred = starredSet.has(channel.id);
        const preview = activity?.lastPreview;
        const lastTs = activity?.lastMessageTs ?? 0;
        const unread = activity?.unreadCount ?? 0;
        const mentions = activity?.mentionCount ?? 0;
        const displayName = resolveChannelName(channel, users);
        const rawDmId = channel.id.replace(/^dm:/, "");
        const dmIds = rawDmId.split("+").filter(Boolean);
        const targetUserId = isDM ? (dmIds.find((id) => id !== me.id) ?? dmIds[0]) : undefined;
        const targetUser = targetUserId ? users[targetUserId] : undefined;
        return {
          channel,
          displayName,
          topic,
          lastPreview: preview,
          lastAuthor: activity?.lastAuthor,
          lastTs,
          unread,
          mentions,
          starred,
          isDM,
          avatarUrl: targetUser?.avatarUrl,
          presence: targetUserId ? userStatus[targetUserId] : undefined,
          muted,
        };
      })
      .filter((entry) => {
        if (filter === "starred" && !entry.starred) return false;
        if (filter === "unread" && entry.unread === 0) return false;
        if (filter === "mentions" && entry.mentions === 0) return false;
        if (filter === "dm" && !entry.isDM) return false;
        if (!normalizedQuery) return true;
        const haystack = `${entry.displayName} ${entry.topic ?? ""} ${entry.lastPreview ?? ""}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .sort((a, b) => (b.lastTs || 0) - (a.lastTs || 0));
  }, [channels, channelActivity, channelTopics, filter, me.id, normalizedQuery, starredSet, userStatus, users]);

  const pinnedSet = useMemo(() => new Set(pinnedChannelIds), [pinnedChannelIds]);
  const archivedSet = useMemo(() => new Set(archivedChannelIds), [archivedChannelIds]);
  const baseEntries = useMemo(() => {
    if (listMode !== "unreads") return entries;
    const list = entries.filter((entry) => entry.unread > 0);
    return mentionsOnly ? list.filter((entry) => entry.mentions > 0) : list;
  }, [entries, listMode, mentionsOnly]);
  const visibleEntries = useMemo(
    () => baseEntries.filter((entry) => !archivedSet.has(entry.channel.id)),
    [baseEntries, archivedSet]
  );
  const archivedEntries = useMemo(
    () => (listMode === "all" ? entries.filter((entry) => archivedSet.has(entry.channel.id)) : []),
    [entries, archivedSet, listMode]
  );
  const pinnedEntries = useMemo(
    () => visibleEntries.filter((entry) => pinnedSet.has(entry.channel.id)),
    [pinnedSet, visibleEntries]
  );
  const unreadEntries = useMemo(
    () => visibleEntries.filter((entry) => entry.unread > 0),
    [visibleEntries]
  );
  const starredEntries = useMemo(
    () => visibleEntries.filter((entry) => entry.starred && !pinnedSet.has(entry.channel.id)),
    [pinnedSet, visibleEntries]
  );
  const channelEntries = useMemo(
    () =>
      visibleEntries.filter(
        (entry) => !entry.isDM && !pinnedSet.has(entry.channel.id) && !entry.starred
      ),
    [pinnedSet, visibleEntries]
  );
  const dmEntries = useMemo(
    () =>
      visibleEntries.filter(
        (entry) => entry.isDM && !pinnedSet.has(entry.channel.id) && !entry.starred
      ),
    [pinnedSet, visibleEntries]
  );
  const isUnreadsView = listMode === "unreads";

  const handleOpenChannel = useCallback(
    async (id: string) => {
      await setChannel(id);
      const href = buildHref(["chat", encodeURIComponent(id)], `/chat/${encodeURIComponent(id)}`);
      router.push(href);
    },
    [buildHref, router, setChannel],
  );

  const ensureDetailContext = useCallback(async () => {
    const target = channelId || channels[0]?.id;
    if (!target) return undefined;
    await setChannel(target);
    const href = buildHref(["chat", encodeURIComponent(target)], `/chat/${encodeURIComponent(target)}`);
    router.push(href);
    return target;
  }, [buildHref, channelId, channels, router, setChannel]);

  const handleCreateChannel = useCallback(async () => {
    const target = await ensureDetailContext();
    if (!target || typeof window === "undefined") return;
    window.setTimeout(() => {
      window.dispatchEvent(new Event("chat:open-create-channel"));
    }, 400);
  }, [ensureDetailContext]);

  const handleOpenRightPanel = useCallback(async () => {
    const target = await ensureDetailContext();
    if (!target || typeof window === "undefined") return;
    window.setTimeout(() => {
      window.dispatchEvent(new Event("chat:open-right"));
    }, 400);
  }, [ensureDetailContext]);

  const handleOpenRightPanelFor = useCallback(
    async (id: string) => {
      await setChannel(id);
      if (typeof window === "undefined") return;
      window.setTimeout(() => {
        window.dispatchEvent(new Event("chat:open-right"));
      }, 200);
    },
    [setChannel],
  );

  const handleToggleMuted = useCallback(
    (event: MouseEvent, id: string, muted: boolean) => {
      event.stopPropagation();
      setChannelMuted(id, !muted);
    },
    [setChannelMuted],
  );

  const handleTogglePinned = useCallback(
    (event: MouseEvent, id: string) => {
      event.stopPropagation();
      togglePinnedChannel(id);
    },
    [togglePinnedChannel],
  );

  const handleToggleArchived = useCallback(
    (event: MouseEvent, id: string) => {
      event.stopPropagation();
      toggleArchivedChannel(id);
    },
    [toggleArchivedChannel],
  );

  const handleMarkRead = useCallback(
    (event: MouseEvent, id: string) => {
      event.stopPropagation();
      markChannelRead(id);
    },
    [markChannelRead],
  );

  const handleToggleMenu = useCallback(() => {
    setMenuOpen((prev) => !prev);
  }, []);

  const handleToggleStar = useCallback(
    (event: MouseEvent, id: string) => {
      event.stopPropagation();
      toggleStar(id);
    },
    [toggleStar],
  );

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <h1 className="inline-flex items-center gap-2 text-xl font-semibold text-foreground sm:text-2xl">
                <MessageSquare size={20} className="text-brand" />
                채팅 허브
              </h1>
              <p className="text-xs text-muted">채널과 DM을 빠르게 탐색하고 전환합니다.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="채널 또는 DM 검색"
                  className="h-8 w-52 rounded-md border border-border bg-background pl-9 pr-3 text-xs outline-none focus:border-foreground/60"
                />
              </div>
              <button
                type="button"
                onClick={handleCreateChannel}
                className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background"
              >
                <PlusCircle size={14} />
                새 채널
              </button>
              <button
                type="button"
                onClick={handleOpenRightPanel}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground/80 hover:bg-zinc-50"
              >
                <Users size={14} />
                빠른 DM
              </button>
            </div>
          </div>
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-2 px-4 pb-4 sm:px-6">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={clsx(
                    "inline-flex items-center rounded-lg border px-2.5 py-1 text-[11px] font-semibold",
                    filter === key
                      ? "border-foreground/80 bg-foreground text-background"
                      : "border-border/70 text-muted hover:border-foreground/30 hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-lg border border-border bg-white p-1">
                <button
                  type="button"
                  onClick={() => {
                    setListMode("all");
                    setMentionsOnly(false);
                  }}
                  className={clsx(
                    "rounded-md px-2.5 py-1 text-[11px] font-semibold",
                    listMode === "all" ? "bg-foreground text-background" : "text-muted"
                  )}
                >
                  전체
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setListMode("unreads");
                    setShowArchived(false);
                  }}
                  className={clsx(
                    "rounded-md px-2.5 py-1 text-[11px] font-semibold",
                    listMode === "unreads" ? "bg-foreground text-background" : "text-muted"
                  )}
                >
                  읽지 않음
                </button>
              </div>
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={handleToggleMenu}
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-[11px] font-semibold",
                    menuOpen
                      ? "border-foreground/80 bg-foreground text-background"
                      : "border-border/70 text-muted hover:border-foreground/30 hover:text-foreground"
                  )}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                >
                  <MoreHorizontal size={14} />
                  보기 옵션
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-9 z-20 w-52 rounded-lg border border-border bg-white p-2 shadow-sm">
                    <button
                      type="button"
                      onClick={() => {
                        if (listMode !== "all") return;
                        setShowArchived((prev) => !prev);
                        setMenuOpen(false);
                      }}
                      disabled={listMode !== "all"}
                      className={clsx(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs transition",
                        listMode !== "all"
                          ? "cursor-not-allowed text-muted/60"
                          : "text-muted hover:bg-subtle/70 hover:text-foreground"
                      )}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Archive size={12} />
                        보관함 보기
                      </span>
                      <span>{showArchived && listMode === "all" ? "ON" : "OFF"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (listMode !== "unreads") return;
                        setMentionsOnly((prev) => !prev);
                        setMenuOpen(false);
                      }}
                      disabled={listMode !== "unreads"}
                      className={clsx(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs transition",
                        listMode !== "unreads"
                          ? "cursor-not-allowed text-muted/60"
                          : "text-muted hover:bg-subtle/70 hover:text-foreground"
                      )}
                    >
                      <span className="inline-flex items-center gap-2">@멘션만</span>
                      <span>{mentionsOnly && listMode === "unreads" ? "ON" : "OFF"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-4 sm:px-6">
        <section className="border-t border-border bg-background">
          {entries.length === 0 && (
            <div className="py-6">
              <EmptyState label="조건에 맞는 채널이 없습니다." />
            </div>
          )}
          <div className="space-y-5 py-2">
            {isUnreadsView ? (
              <ChannelSection
                title="Unreads"
                entries={unreadEntries}
                emptyLabel="읽지 않은 메시지가 없습니다."
                onOpen={handleOpenChannel}
                onToggleStar={handleToggleStar}
                onToggleMuted={handleToggleMuted}
                onOpenInfo={handleOpenRightPanelFor}
                onTogglePinned={handleTogglePinned}
                onToggleArchived={handleToggleArchived}
                onMarkRead={handleMarkRead}
                pinnedSet={pinnedSet}
                archivedSet={archivedSet}
              />
            ) : (
              <>
                <ChannelSection
                  title="Unreads"
                  entries={unreadEntries}
                  emptyLabel="읽지 않은 메시지가 없습니다."
                  onOpen={handleOpenChannel}
                  onToggleStar={handleToggleStar}
                  onToggleMuted={handleToggleMuted}
                  onOpenInfo={handleOpenRightPanelFor}
                  onTogglePinned={handleTogglePinned}
                  onToggleArchived={handleToggleArchived}
                  onMarkRead={handleMarkRead}
                  pinnedSet={pinnedSet}
                  archivedSet={archivedSet}
                />
                <ChannelSection
                  title="Pinned"
                  entries={pinnedEntries}
                  emptyLabel="핀된 채널이 없습니다."
                  onOpen={handleOpenChannel}
                  onToggleStar={handleToggleStar}
                  onToggleMuted={handleToggleMuted}
                  onOpenInfo={handleOpenRightPanelFor}
                  onTogglePinned={handleTogglePinned}
                  onToggleArchived={handleToggleArchived}
                  onMarkRead={handleMarkRead}
                  pinnedSet={pinnedSet}
                  archivedSet={archivedSet}
                />
                <ChannelSection
                  title="Starred"
                  entries={starredEntries}
                  emptyLabel="즐겨찾기된 채널이 없습니다."
                  onOpen={handleOpenChannel}
                  onToggleStar={handleToggleStar}
                  onToggleMuted={handleToggleMuted}
                  onOpenInfo={handleOpenRightPanelFor}
                  onTogglePinned={handleTogglePinned}
                  onToggleArchived={handleToggleArchived}
                  onMarkRead={handleMarkRead}
                  pinnedSet={pinnedSet}
                  archivedSet={archivedSet}
                />
                <ChannelSection
                  title="Channels"
                  entries={channelEntries}
                  emptyLabel="표시할 채널이 없습니다."
                  onOpen={handleOpenChannel}
                  onToggleStar={handleToggleStar}
                  onToggleMuted={handleToggleMuted}
                  onOpenInfo={handleOpenRightPanelFor}
                  onTogglePinned={handleTogglePinned}
                  onToggleArchived={handleToggleArchived}
                  onMarkRead={handleMarkRead}
                  pinnedSet={pinnedSet}
                  archivedSet={archivedSet}
                />
                <ChannelSection
                  title="Direct messages"
                  entries={dmEntries}
                  emptyLabel="DM이 없습니다."
                  onOpen={handleOpenChannel}
                  onToggleStar={handleToggleStar}
                  onToggleMuted={handleToggleMuted}
                  onOpenInfo={handleOpenRightPanelFor}
                  onTogglePinned={handleTogglePinned}
                  onToggleArchived={handleToggleArchived}
                  onMarkRead={handleMarkRead}
                  pinnedSet={pinnedSet}
                  archivedSet={archivedSet}
                />
                {showArchived && (
                  <ChannelSection
                    title="Archived"
                    entries={archivedEntries}
                    emptyLabel="보관된 채널이 없습니다."
                    onOpen={handleOpenChannel}
                    onToggleStar={handleToggleStar}
                    onToggleMuted={handleToggleMuted}
                    onOpenInfo={handleOpenRightPanelFor}
                    onTogglePinned={handleTogglePinned}
                    onToggleArchived={handleToggleArchived}
                    onMarkRead={handleMarkRead}
                    pinnedSet={pinnedSet}
                    archivedSet={archivedSet}
                  />
                )}
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function resolveChannelName(channel: Channel, users: Record<string, ChatUser>) {
  if (channel.isDM || channel.id.startsWith("dm:")) {
    const id = channel.id.replace(/^dm:/, "");
    const firstId = id.split("+").filter(Boolean)[0];
    const user = firstId ? users[firstId] : undefined;
    return user ? user.name : (channel.name?.replace(/^@\s*/, "") || "Direct Message");
  }
  return channel.name?.replace(/^#\s*/, "#") || `#${channel.id}`;
}

function getInitials(label: string) {
  const cleaned = label.replace(/^[@#]\s*/, "").trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return `${first}${second}`.toUpperCase();
}

function buildPreview(entry: ChannelEntry) {
  const base =
    entry.lastPreview ??
    entry.topic ??
    (entry.isDM ? "Direct Message" : "아직 메시지가 없습니다.");
  return entry.lastAuthor ? `${entry.lastAuthor}: ${base}` : base;
}

function ChannelSection({
  title,
  entries,
  onOpen,
  onToggleStar,
  onToggleMuted,
  onOpenInfo,
  onTogglePinned,
  onToggleArchived,
  onMarkRead,
  pinnedSet,
  archivedSet,
  emptyLabel,
}: {
  title: string;
  entries: ChannelEntry[];
  emptyLabel: string;
  onOpen: (id: string) => void;
  onToggleStar: (event: MouseEvent, id: string) => void;
  onToggleMuted: (event: MouseEvent, id: string, muted: boolean) => void;
  onOpenInfo: (id: string) => void;
  onTogglePinned: (event: MouseEvent, id: string) => void;
  onToggleArchived: (event: MouseEvent, id: string) => void;
  onMarkRead: (event: MouseEvent, id: string) => void;
  pinnedSet: Set<string>;
  archivedSet: Set<string>;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between border-b border-border/70 pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
        <span>{title}</span>
        <span className="text-[10px]">{entries.length}</span>
      </div>
      <div>
        {entries.length === 0 ? (
          <div className="border border-dashed border-border/70 px-3 py-2 text-xs text-muted">
            {emptyLabel}
          </div>
        ) : (
          entries.map((entry) => (
            <ChannelListRow
              key={entry.channel.id}
              entry={entry}
              onOpen={() => onOpen(entry.channel.id)}
              onToggleStar={(event) => onToggleStar(event, entry.channel.id)}
              onToggleMuted={(event) => onToggleMuted(event, entry.channel.id, entry.muted ?? false)}
              onOpenInfo={() => onOpenInfo(entry.channel.id)}
              onTogglePinned={(event) => onTogglePinned(event, entry.channel.id)}
              onToggleArchived={(event) => onToggleArchived(event, entry.channel.id)}
              onMarkRead={(event) => onMarkRead(event, entry.channel.id)}
              pinned={pinnedSet.has(entry.channel.id)}
              archived={archivedSet.has(entry.channel.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ChannelListRow({
  entry,
  onOpen,
  onToggleStar,
  onToggleMuted,
  onOpenInfo,
  onTogglePinned,
  onToggleArchived,
  onMarkRead,
  pinned,
  archived,
}: {
  entry: ChannelEntry;
  onOpen: () => void;
  onToggleStar: (event: MouseEvent) => void;
  onToggleMuted: (event: MouseEvent) => void;
  onOpenInfo: () => void;
  onTogglePinned: (event: MouseEvent) => void;
  onToggleArchived: (event: MouseEvent) => void;
  onMarkRead: (event: MouseEvent) => void;
  pinned: boolean;
  archived: boolean;
}) {
  const preview = buildPreview(entry);
  const presenceClass = presenceColors[entry.presence ?? "offline"] ?? presenceColors.offline;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className="group flex items-start gap-3 border-b border-border/70 px-2 py-2 transition hover:bg-subtle/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
    >
      <div className="relative mt-0.5">
        {entry.unread > 0 && (
          <span className="absolute -left-2 top-3 h-1.5 w-1.5 rounded-full bg-rose-500" />
        )}
        <div
          className={clsx(
            "relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg text-xs font-semibold",
            entry.isDM ? "bg-blue-500/15 text-blue-400" : "bg-purple-500/15 text-purple-400"
          )}
        >
          {entry.isDM ? (
            entry.avatarUrl ? (
              <img src={entry.avatarUrl} alt={entry.displayName} className="h-full w-full object-cover" />
            ) : (
              getInitials(entry.displayName)
            )
          ) : (
            <Hash size={14} />
          )}
          {entry.isDM && (
            <span
              className={clsx(
                "absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-border bg-panel",
                presenceClass
              )}
            />
          )}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              "truncate text-sm",
              entry.unread > 0 ? "font-semibold text-foreground" : "text-foreground/90"
            )}
          >
            {entry.displayName}
          </span>
          {!entry.isDM && entry.topic && (
            <span className="truncate text-xs text-muted">{entry.topic}</span>
          )}
        </div>
        <p className="truncate text-xs text-muted">{preview}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-[11px] text-muted group-hover:text-foreground/70">
          {relativeTime(entry.lastTs)}
        </span>
        <div className="flex items-center gap-1">
          {entry.mentions > 0 && (
            <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] text-amber-500">
              @{entry.mentions}
            </span>
          )}
          {entry.unread > 0 && (
            <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] text-rose-500">
              {entry.unread}
            </span>
          )}
        </div>
      </div>
      <div className="ml-1 flex items-center gap-1">
        <button
          type="button"
          onClick={onToggleStar}
          className={clsx(
            "rounded-full p-2 text-muted transition",
            entry.starred
              ? "opacity-100 text-amber-400 hover:text-amber-300"
              : "opacity-0 group-hover:opacity-100 hover:text-foreground"
          )}
          aria-label="Toggle favorite"
        >
          <Star size={14} className={entry.starred ? "fill-amber-400" : undefined} />
        </button>
        <button
          type="button"
          onClick={onTogglePinned}
          className={clsx(
            "rounded-full p-2 text-muted transition",
            pinned
              ? "opacity-100 text-indigo-400 hover:text-indigo-300"
              : "opacity-0 group-hover:opacity-100 hover:text-foreground"
          )}
          aria-label={pinned ? "핀 해제" : "핀 고정"}
        >
          {pinned ? <PinOff size={14} /> : <Pin size={14} />}
        </button>
        <button
          type="button"
          onClick={onMarkRead}
          className={clsx(
            "rounded-full p-2 text-muted transition",
            entry.unread > 0 ? "opacity-0 group-hover:opacity-100 hover:text-foreground" : "opacity-0"
          )}
          aria-label="읽음 표시"
        >
          <CheckCheck size={14} />
        </button>
        <button
          type="button"
          onClick={onToggleMuted}
          className="rounded-full p-2 text-muted opacity-0 transition group-hover:opacity-100 hover:text-foreground"
          aria-label={entry.muted ? "알림 켜기" : "알림 끄기"}
        >
          {entry.muted ? <BellOff size={14} /> : <Bell size={14} />}
        </button>
        <button
          type="button"
          onClick={onToggleArchived}
          className={clsx(
            "rounded-full p-2 text-muted transition",
            archived
              ? "opacity-100 text-sky-400 hover:text-sky-300"
              : "opacity-0 group-hover:opacity-100 hover:text-foreground"
          )}
          aria-label={archived ? "보관 해제" : "보관"}
        >
          {archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpenInfo();
          }}
          className="rounded-full p-2 text-muted opacity-0 transition group-hover:opacity-100 hover:text-foreground"
          aria-label="채널 정보 열기"
        >
          <Info size={14} />
        </button>
      </div>
    </div>
  );
}
