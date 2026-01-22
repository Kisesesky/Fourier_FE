'use client';

import { useMemo, useState, useCallback, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  BellDot,
  ChevronRight,
  Clock3,
  Filter,
  Hash,
  MessageSquare,
  PlusCircle,
  Search,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { useChat } from "@/workspace/chat/_model/store";
import { useWorkspacePath } from "@/hooks/useWorkspacePath";
import type { Channel, ChatUser } from "@/workspace/chat/_model/types";

type FilterKey = "all" | "starred" | "unread" | "mentions" | "dm";

const FILTERS: { key: FilterKey; label: string; hint: string }[] = [
  { key: "all", label: "전체", hint: "워크스페이스의 모든 채널" },
  { key: "starred", label: "즐겨찾기", hint: "Starred 섹션에 고정된 채널" },
  { key: "unread", label: "읽지 않음", hint: "읽지 않은 메시지가 남은 채널" },
  { key: "mentions", label: "@멘션", hint: "나를 멘션한 알림이 있는 채널" },
  { key: "dm", label: "DM", hint: "Direct Message" },
];

const VIEW_OPTIONS = [
  { key: "grid", label: "카드" },
  { key: "list", label: "리스트" },
] as const satisfies ReadonlyArray<{ key: "grid" | "list"; label: string }>;

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

const EmptyState = ({ label }: { label: string }) => (
  <div className="rounded-2xl border border-dashed border-border/80 bg-panel/50 px-6 py-12 text-center">
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
    toggleStar,
  } = useChat();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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
        const starred = starredSet.has(channel.id);
        const preview = activity?.lastPreview;
        const lastTs = activity?.lastMessageTs ?? 0;
        const unread = activity?.unreadCount ?? 0;
        const mentions = activity?.mentionCount ?? 0;
        const displayName = resolveChannelName(channel, users);
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
  }, [channels, channelActivity, channelTopics, filter, normalizedQuery, starredSet, users]);

  const unreadTotal = useMemo(() => entries.reduce((sum, entry) => sum + entry.unread, 0), [entries]);
  const mentionTotal = useMemo(() => entries.reduce((sum, entry) => sum + entry.mentions, 0), [entries]);
  const dmCount = useMemo(() => entries.filter((entry) => entry.isDM).length, [entries]);

  const recentMentions = useMemo(
    () => entries.filter((entry) => entry.mentions > 0).slice(0, 5),
    [entries],
  );

  const handleOpenChannel = useCallback(
    async (id: string) => {
      await setChannel(id);
      const href = buildHref(["chat", encodeURIComponent(id)], `/chat/${encodeURIComponent(id)}`);
      router.push(href);
    },
    [router, setChannel],
  );

  const ensureDetailContext = useCallback(async () => {
    const target = channelId || channels[0]?.id;
    if (!target) return undefined;
    await setChannel(target);
    const href = buildHref(["chat", encodeURIComponent(target)], `/chat/${encodeURIComponent(target)}`);
    router.push(href);
    return target;
  }, [channelId, channels, router, setChannel]);

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

  const handleToggleStar = useCallback(
    (event: MouseEvent, id: string) => {
      event.stopPropagation();
      toggleStar(id);
    },
    [toggleStar],
  );

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-subtle">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-border bg-panel/80 p-6 sm:p-8 shadow-panel">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Workspace Chat</p>
              <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">채팅 허브</h1>
              <p className="text-sm text-muted">
                팀 채널과 DM을 한곳에서 확인하세요. 중요한 대화만 골라보고, 새 채널/DM을 빠르게 만들 수 있습니다.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleCreateChannel}
                  className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background shadow"
                >
                  <PlusCircle size={14} />
                  새 채널 만들기
                </button>
                <button
                  type="button"
                  onClick={handleOpenRightPanel}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-foreground/80 hover:bg-panel"
                >
                  <Users size={14} />
                  빠른 DM
                </button>
              </div>
            </div>
            <div className="grid w-full grid-cols-2 gap-4 text-sm sm:grid-cols-3 lg:w-auto">
              <StatCard label="전체 채널" value={channels.filter((ch) => !ch.isDM).length} icon={Hash} />
              <StatCard label="읽지 않은 메시지" value={unreadTotal} icon={BellDot} emphasize />
              <StatCard label="DM" value={dmCount} icon={MessageSquare} />
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,2.5fr)_minmax(240px,1fr)]">
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-panel/70 p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-2">
                {FILTERS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilter(key)}
                    className={clsx(
                      "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm",
                      filter === key
                        ? "border-foreground/80 bg-foreground text-background"
                        : "border-border/70 text-muted hover:border-foreground/30 hover:text-foreground"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="채널 검색"
                    className="h-9 w-48 rounded-full border border-border bg-transparent pl-9 pr-3 text-sm outline-none focus:border-foreground/60"
                  />
                </div>
                <div className="rounded-full border border-border bg-panel/60 px-1 py-1">
                  {VIEW_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setViewMode(option.key)}
                      className={clsx(
                        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
                        viewMode === option.key ? "bg-foreground text-background" : "text-muted"
                      )}
                    >
                      <Filter size={12} />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {entries.length === 0 ? (
              <EmptyState label="조건에 맞는 채널이 없습니다." />
            ) : viewMode === "grid" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {entries.map((entry) => (
                  <ChannelCard
                    key={entry.channel.id}
                    entry={entry}
                    onOpen={() => handleOpenChannel(entry.channel.id)}
                    onToggleStar={(event) => handleToggleStar(event, entry.channel.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="divide-y divide-border rounded-xl border border-border/70">
                {entries.map((entry) => (
                  <ChannelRow
                    key={entry.channel.id}
                    entry={entry}
                    onOpen={() => handleOpenChannel(entry.channel.id)}
                    onToggleStar={(event) => handleToggleStar(event, entry.channel.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <aside className="flex flex-col gap-4 rounded-2xl border border-border bg-panel/80 p-4 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Mentions</p>
              <div className="mt-2 space-y-2">
                {recentMentions.length === 0 ? (
                  <EmptyBadge label="새 멘션이 없습니다." icon={Sparkles} />
                ) : (
                  recentMentions.map((entry) => (
                    <button
                      key={`mention-${entry.channel.id}`}
                      type="button"
                      onClick={() => handleOpenChannel(entry.channel.id)}
                      className="w-full rounded-xl border border-border/70 bg-subtle/60 px-3 py-2 text-left text-sm transition hover:border-foreground/50"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs text-muted">
                        <span>{entry.displayName}</span>
                        <span>{relativeTime(entry.lastTs)}</span>
                      </div>
                      <p className="mt-1 text-sm text-foreground/90">{entry.lastPreview ?? "새 메시지"}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">요약</p>
              <div className="mt-2 space-y-2 text-sm">
                <SummaryRow icon={BellDot} label="읽지 않은 메시지" value={unreadTotal} />
                <SummaryRow icon={Users} label="멘션" value={mentionTotal} />
                <SummaryRow icon={Clock3} label="최근 활동" value={entries[0]?.displayName ?? "없음"} />
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}

function resolveChannelName(channel: Channel, users: Record<string, ChatUser>) {
  if (channel.isDM || channel.id.startsWith("dm:")) {
    const id = channel.id.replace(/^dm:/, "");
    const user = users[id];
    return user ? `@ ${user.name}` : channel.name || "Direct Message";
  }
  return channel.name?.replace(/^#\s*/, "#") || `#${channel.id}`;
}

function StatCard({
  label,
  value,
  icon: Icon,
  emphasize = false,
}: {
  label: string;
  value: number | string;
  icon: typeof Hash;
  emphasize?: boolean;
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl border px-4 py-3 text-sm shadow-sm",
        emphasize ? "border-foreground/60 bg-foreground text-background" : "border-border bg-panel/60 text-foreground"
      )}
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted">
        <Icon size={14} />
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function ChannelCard({
  entry,
  onOpen,
  onToggleStar,
}: {
  entry: ChannelEntry;
  onOpen: () => void;
  onToggleStar: (event: MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex flex-col rounded-2xl border border-border/70 bg-panel/60 p-4 text-left transition hover:border-foreground/40 hover:shadow-lg"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {entry.isDM ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
              <MessageSquare size={16} />
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/15 text-purple-500">
              <Hash size={16} />
            </div>
          )}
          <div>
            <p className="font-medium text-foreground">{entry.displayName}</p>
            <p className="text-xs text-muted">{entry.topic ?? (entry.isDM ? "Direct Message" : "채널")}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleStar}
          className={clsx(
            "rounded-full p-2 transition",
            entry.starred ? "text-amber-400 hover:text-amber-300" : "text-muted hover:text-foreground"
          )}
          aria-label="Toggle favorite"
        >
          <Star size={16} className={entry.starred ? "fill-amber-400" : undefined} />
        </button>
      </div>
      <p className="mt-3 text-sm text-foreground/90">
        {entry.lastPreview ? entry.lastPreview : "아직 메시지가 없습니다."}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>{relativeTime(entry.lastTs)}</span>
        {entry.unread > 0 && (
          <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-rose-500">{entry.unread} unread</span>
        )}
        {entry.mentions > 0 && (
          <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-amber-500">@ {entry.mentions}</span>
        )}
      </div>
    </button>
  );
}

function ChannelRow({
  entry,
  onOpen,
  onToggleStar,
}: {
  entry: ChannelEntry;
  onOpen: () => void;
  onToggleStar: (event: MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-subtle/70"
    >
      <span className="text-muted">{entry.isDM ? <MessageSquare size={16} /> : <Hash size={16} />}</span>
      <div className="flex flex-1 flex-col">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground">{entry.displayName}</p>
          {entry.unread > 0 && <Badge label={`${entry.unread} unread`} tone="rose" />}
          {entry.mentions > 0 && <Badge label={`@${entry.mentions}`} tone="amber" />}
        </div>
        <p className="text-xs text-muted">{entry.lastPreview ?? entry.topic ?? "정보 없음"}</p>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted">
        <span>{relativeTime(entry.lastTs)}</span>
        <button
          type="button"
          onClick={onToggleStar}
          className={clsx("rounded-full p-2", entry.starred ? "text-amber-400" : "text-muted hover:text-foreground")}
          aria-label="Toggle favorite"
        >
          <Star size={14} className={entry.starred ? "fill-amber-400" : undefined} />
        </button>
        <ChevronRight size={14} className="text-muted" />
      </div>
    </button>
  );
}

function Badge({ label, tone }: { label: string; tone: "rose" | "amber" }) {
  const toneClass = tone === "rose" ? "bg-rose-500/15 text-rose-500" : "bg-amber-400/20 text-amber-600";
  return <span className={clsx("rounded-full px-2 py-0.5 text-xs font-medium", toneClass)}>{label}</span>;
}

function SummaryRow({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2 text-sm">
      <div className="flex items-center gap-2 text-muted">
        <Icon size={14} />
        <span>{label}</span>
      </div>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

function EmptyBadge({ label, icon: Icon }: { label: string; icon: typeof Sparkles }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-dashed border-border/70 px-3 py-2 text-xs text-muted">
      <Icon size={14} />
      <span>{label}</span>
    </div>
  );
}
