'use client';

import clsx from "clsx";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useEffect, useState } from "react";

import {
  BookText, CalendarDays, Folder, FolderKanban, LifeBuoy, MessageSquare, Settings, Users, Home, Plus, ChevronLeft, ChevronRight
} from "lucide-react";

import { useWorkspacePath } from "@/hooks/useWorkspacePath";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import { useChat } from "@/workspace/chat/_model/store";
import type { Channel } from "@/workspace/chat/_model/types";
import type { CalendarSource } from "@/workspace/calendar/_model/types";
import { useThreadItems } from "@/workspace/chat/_model/hooks/useThreadItems";

import { DocsTree } from "@/app/(workspace)/workspace/[teamId]/[projectId]/docs/_components/note-drive/tree";
import TreeToolbar from "@/app/(workspace)/workspace/[teamId]/[projectId]/docs/_components/note-drive/tree/TreeToolbar";

import { deleteCalendarCategory, getCalendarCategories } from "@/workspace/calendar/_service/api";
import { kanbanWorkflowNodes } from "@/workspace/issues/_model/kanbanData";
import { fetchProjectMembers } from "@/lib/projects";
import { fetchPresence } from "@/lib/members";

/* ────────────────────────────────────────────────
   NAV CONFIG
────────────────────────────────────────────────── */
type SurfaceSlug = "chat" | "issues" | "calendar" | "members" | "docs";

const NAV_LINKS = [
  { slug: "chat", icon: MessageSquare, label: "Chat" },
  { slug: "issues", icon: FolderKanban, label: "Issues" },
  { slug: "calendar", icon: CalendarDays, label: "Calendar" },
  { slug: "members", icon: Users, label: "Members" },
  { slug: "docs", icon: BookText, label: "Docs" },
] as const;

const SURFACE_LABEL: Record<SurfaceSlug, string> = {
  chat: "채널 & DM",
  issues: "워크플로",
  calendar: "캘린더",
  members: "팀 구성원",
  docs: "문서",
};


/* ────────────────────────────────────────────────
   SMALL UTILS
────────────────────────────────────────────────── */
const RailButton = ({ href, icon: Icon, label, active }: any) => (
  <Link
    href={href}
    aria-label={label}
    className={clsx(
      "flex h-12 w-12 items-center justify-center rounded-2xl text-base transition focus:outline-none focus:ring-2",
      active
        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
    )}
  >
    <Icon size={18} />
  </Link>
);


/* ────────────────────────────────────────────────
   CONTEXT PANEL RENDERERS
────────────────────────────────────────────────── */
const Section = ({ title, children }: { title: React.ReactNode; children: React.ReactNode }) => (
  <div>
    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{title}</p>
    <div className="mt-2 space-y-1">{children}</div>
  </div>
);

/* ✨ Compact Sidebar Documents Panel */
const DocsPanel = () => {
  return (
    <div className="p-1">

      {/* 상단: 문서 + 우측 toolbar */}
      <div className="flex items-center justify-between mb-4 border-b border-gray-300 pb-2">
        <div className="text-xs font-semibold uppercase tracking-[0.08em] text-muted flex items-center">
          문서
        </div>

        <TreeToolbar
          onRefresh={() => window.dispatchEvent(new Event("docs:refresh"))}
        />
      </div>

      {/* 문서 트리 타이틀 */}
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted flex items-center">
        <Folder size={16} className="mr-1 text-yellow-500" />
        문서 트리
      </div>

      <DocsTree />
    </div>
  );
};


/* Issues Panel */
const IssuesPanel = () => {
  const parents = kanbanWorkflowNodes.filter(n => !n.parentId).slice(0, 3);
  const tree = parents.map(parent => ({
    title: parent.title,
    children: kanbanWorkflowNodes
      .filter(n => n.parentId === parent.id)
      .map(n => n.title)
      .slice(0, 5),
  }));

  return (
    <div className="space-y-3">
      {tree.map(group => (
        <Section key={group.title} title={group.title}>
          {group.children.map(c => (
            <div key={c} className="rounded-lg border border-border/60 px-3 py-2 text-xs">
              {c}
            </div>
          ))}
        </Section>
      ))}
    </div>
  );
};

/* Calendar */
const CalendarPanel = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [calendars, setCalendars] = useState<CalendarSource[]>([]);
  const { buildHref } = useWorkspacePath();
  const router = useRouter();

  useEffect(() => {
    if (!projectId) return;
    let mounted = true;
    const load = () => {
      getCalendarCategories(projectId)
        .then((data) => {
          if (!mounted) return;
          setCalendars(data ?? []);
        })
        .catch(() => {
          if (!mounted) return;
          setCalendars([]);
        });
    };
    load();
    const handler = () => load();
    window.addEventListener("calendar:categories:changed", handler);
    return () => {
      mounted = false;
      window.removeEventListener("calendar:categories:changed", handler);
    };
  }, [projectId]);

  const openCalendarCreate = () => {
    if (!projectId) return;
    const target = buildHref("calendar", "/calendar");
    router.push(target);
    setTimeout(() => {
      window.dispatchEvent(new Event("calendar:open-create"));
    }, 0);
  };

  const openCalendarManage = (calendar: CalendarSource) => {
    if (!projectId) return;
    const target = buildHref("calendar", "/calendar");
    router.push(target);
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("calendar:open-manage", {
          detail: { id: calendar.id, name: calendar.name, color: calendar.color },
        })
      );
    }, 0);
  };

  const handleDeleteCalendar = async (calendar: CalendarSource) => {
    if (!projectId) return;
    const ok = window.confirm(`"${calendar.name}" 캘린더를 삭제할까요?`);
    if (!ok) return;
    try {
      await deleteCalendarCategory(projectId, calendar.id);
      setCalendars((prev) => prev.filter((item) => item.id !== calendar.id));
      window.dispatchEvent(new Event("calendar:categories:changed"));
    } catch {
      return;
    }
  };

  return (
    <Section
      title={
        <div className="flex items-center justify-between">
          <span>캘린더 목록</span>
          <button
            type="button"
            onClick={openCalendarCreate}
            className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-transparent px-2 py-1 text-[11px] font-medium text-muted transition hover:border-border hover:text-foreground"
          >
            <Plus size={12} />
            추가
          </button>
        </div>
      }
    >
      <button
        type="button"
        onClick={() => router.push(buildHref("calendar", "/calendar"))}
        className="flex w-full items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-xs text-muted transition hover:border-border hover:text-foreground"
      >
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-muted-foreground/40"></span>
          전체 캘린더
        </span>
        <span className="text-[11px]">보기</span>
      </button>
      {calendars.map((cal) => (
        <div
          key={cal.id}
          className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-xs"
        >
          <button
            type="button"
            onClick={() => router.push(buildHref(["calendar", cal.id], `/calendar/${cal.id}`))}
            className="flex flex-1 items-center gap-2 text-left text-foreground/80 transition hover:text-foreground"
          >
            <span style={{ background: cal.color }} className="h-2 w-2 rounded-full"></span>
            <span className="truncate">{cal.name}</span>
          </button>
          <button
            type="button"
            onClick={() => openCalendarManage(cal)}
            className="inline-flex items-center gap-1 text-[11px] text-muted transition hover:text-foreground"
          >
            <Settings size={12} />
            관리
          </button>
          <button
            type="button"
            onClick={() => handleDeleteCalendar(cal)}
            className="inline-flex items-center gap-1 text-[11px] text-rose-500/80 transition hover:text-rose-500"
          >
            삭제
          </button>
        </div>
      ))}
      {calendars.length === 0 && (
        <div className="rounded-lg border border-dashed border-border/60 px-3 py-2 text-xs text-muted">
          캘린더가 없습니다.
        </div>
      )}
    </Section>
  );
};

/* Members */
const MembersPanel = () => {
  const { teamId, projectId } = useParams<{ teamId: string; projectId: string }>();
  const { profile } = useAuthProfile();
  const [members, setMembers] = useState<Array<{ id: string; name: string; avatarUrl?: string | null; email?: string | null; status?: "online" | "offline" | "away" | "dnd" }>>([]);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const [statusMap, setStatusMap] = useState<Record<string, "online" | "offline" | "away" | "dnd">>({});

  useEffect(() => {
    if (!teamId || !projectId) return;
    let mounted = true;
    fetchProjectMembers(teamId, projectId)
      .then((data) => {
        if (!mounted) return;
        const mapped = (data ?? []).map((member: { userId: string; name: string; avatarUrl?: string | null; email?: string | null }) => ({
          id: member.userId,
          name: member.name,
          avatarUrl: member.avatarUrl ?? null,
          email: member.email ?? null,
          status: "offline",
        }));
        setMembers(mapped);
      })
      .catch(() => {
        if (!mounted) return;
        setMembers([]);
      });
    return () => {
      mounted = false;
    };
  }, [teamId, projectId]);

  useEffect(() => {
    let mounted = true;
    const loadPresence = async () => {
      try {
        const payload = await fetchPresence();
        if (!mounted) return;
        setOnlineIds(new Set(payload.onlineUserIds || []));
        setStatusMap((payload.statuses || {}) as Record<string, "online" | "offline" | "away" | "dnd">);
      } catch {
        if (!mounted) return;
        setOnlineIds(new Set());
        setStatusMap({});
      }
    };
    void loadPresence();
    const interval = window.setInterval(loadPresence, 20000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const meId = profile?.id;
  const rest = members.filter((m) => m.id !== meId).slice(0, 8);
  const meStatus = meId ? statusMap[meId] ?? (onlineIds.has(meId) ? "online" : "offline") : "offline";

  return (
    <div className="space-y-3">
        {profile ? (
          <div className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2">
            <div className="h-10 w-10 overflow-hidden rounded-full border border-border bg-muted/30">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.displayName ?? profile.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-foreground">
                  {(profile.displayName ?? profile.name ?? profile.email ?? "?").slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-foreground">
                {profile.displayName ?? profile.name ?? profile.email ?? "Me"}
              </div>
              <div className="truncate text-[11px] text-muted">
                {meStatus === "online" && "온라인"}
                {meStatus === "offline" && "오프라인"}
                {meStatus === "away" && "자리비움"}
                {meStatus === "dnd" && "방해금지"}
              </div>
            </div>
            <span
              className={clsx(
                "h-2.5 w-2.5 rounded-full",
                meStatus === "online" && "bg-sky-400",
                meStatus === "away" && "bg-amber-400",
                meStatus === "dnd" && "bg-rose-500",
                meStatus === "offline" && "bg-zinc-400",
              )}
              aria-hidden
            />
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border/60 px-3 py-2 text-xs text-muted">
            내 정보를 불러오는 중입니다.
          </div>
        )}

      <Section title="Members">
        {rest.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 px-3 py-2 text-xs text-muted">
            멤버가 없습니다.
          </div>
        ) : (
          rest.map(m => {
            const status = statusMap[m.id] ?? (onlineIds.has(m.id) ? "online" : "offline");
            return (
            <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2">
              <div className="h-10 w-10 overflow-hidden rounded-full border border-border bg-muted/30">
                {m.avatarUrl ? (
                  <img src={m.avatarUrl} alt={m.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-foreground">
                    {m.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-foreground">{m.name}</div>
                <div className="truncate text-[11px] text-muted">
                  {status === "online" && "온라인"}
                  {status === "offline" && "오프라인"}
                  {status === "away" && "자리비움"}
                  {status === "dnd" && "방해금지"}
                </div>
              </div>
              <span
                className={clsx(
                  "h-2.5 w-2.5 rounded-full",
                  status === "online" && "bg-sky-400",
                  status === "away" && "bg-amber-400",
                  status === "dnd" && "bg-rose-500",
                  status === "offline" && "bg-zinc-400",
                )}
                aria-hidden
              />
            </div>
            );
          })
        )}
      </Section>
    </div>
  );
};

/* Chat */
const ChatPanel = ({
  channels,
  activeChannelId,
  onOpenChannel,
  channelActivity,
  onCreateChannel,
  onOpenThreads,
  threadsActive,
  lastReadAt,
  meId,
  onOpenThreadItem,
}: {
  channels: Channel[];
  activeChannelId?: string;
  onOpenChannel: (id: string) => void;
  channelActivity: Record<string, { unreadCount?: number }>;
  onCreateChannel: () => void;
  onOpenThreads: () => void;
  threadsActive: boolean;
  lastReadAt: Record<string, number>;
  meId: string;
  onOpenThreadItem: (rootId: string) => void;
}) => {
  const channelList = channels.filter((c) => !(c.isDM || c.id.startsWith("dm:")));
  const dmList = channels.filter((c) => c.isDM || c.id.startsWith("dm:"));
  const threadItems = useThreadItems({ channels, lastReadAt, meId, activityKey: channelActivity });

  return (
    <div className="space-y-4">
      <Section title="Channels">
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg border border-border/60 bg-panel px-3 py-2 text-left text-xs transition hover:bg-accent"
          onClick={onCreateChannel}
        >
          <Plus size={12} className="text-muted" />
          <span>새 채널</span>
        </button>
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
                  "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition",
                  channel.id === activeChannelId
                    ? "border-border bg-accent text-foreground"
                    : "border-border/60 bg-panel hover:bg-accent"
                )}
                onClick={() => onOpenChannel(channel.id)}
              >
                <span className="text-muted">#</span>
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
      </Section>
      <Section title="DM">
        {dmList.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 px-3 py-2 text-xs text-muted">
            DM이 없습니다.
          </div>
        ) : (
          dmList.map((channel) => (
            <button
              key={channel.id}
              type="button"
              className={clsx(
                "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition",
                channel.id === activeChannelId
                  ? "border-border bg-accent text-foreground"
                  : "border-border/60 bg-panel hover:bg-accent"
              )}
              onClick={() => onOpenChannel(channel.id)}
            >
              <span className="text-muted">@</span>
              <span className="truncate">{channel.name || channel.id}</span>
            </button>
          ))
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
                className="flex w-full flex-col gap-1 rounded-lg border border-border/60 bg-panel px-3 py-2 text-left text-xs transition hover:bg-accent"
                onClick={() => onOpenThreadItem(item.rootId)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted">#</span>
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
            className="w-full rounded-lg border border-border/60 bg-panel px-3 py-2 text-left text-xs text-muted hover:bg-accent"
            onClick={onOpenThreads}
          >
            전체 스레드 보기
          </button>
        )}
      </Section>
    </div>
  );
};


/* ────────────────────────────────────────────────
   MAIN SIDEBAR
────────────────────────────────────────────────── */
export default function Sidebar() {
  const router = useRouter();
  const { pathname, buildHref, isActive } = useWorkspacePath();
  const { channels, channelId, setChannel, loadChannels, channelActivity, refreshChannel, lastReadAt, me } = useChat();
  const threadsActive = Boolean(pathname?.includes("/chat/threads"));
  const [panelOpen, setPanelOpen] = useState(true);

  const activeSurface: SurfaceSlug | null = useMemo(() => {
    return NAV_LINKS.find(item => isActive(item.slug))?.slug ?? null;
  }, [pathname, isActive]);

  useEffect(() => {
    if (activeSurface === "chat") {
      void loadChannels();
    }
  }, [activeSurface, loadChannels]);

  useEffect(() => {
    if (activeSurface !== "chat") return;
    channels
      .filter((c) => !(c.isDM || c.id.startsWith("dm:")))
      .forEach((c) => {
        void refreshChannel(c.id);
      });
  }, [activeSurface, channels, refreshChannel]);


  useEffect(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("sidebar:context", { detail: { open: panelOpen } }));
  }, [panelOpen]);

  const renderPanel = () => {
    switch (activeSurface) {
      case "chat":
        return (
          <ChatPanel
            channels={channels}
            activeChannelId={channelId}
            onOpenChannel={(id) => {
              void setChannel(id);
              const href = buildHref(["chat", encodeURIComponent(id)], `/chat/${encodeURIComponent(id)}`);
              router.push(href);
            }}
            channelActivity={channelActivity}
            onCreateChannel={() => window.dispatchEvent(new Event("chat:open-create-channel"))}
            onOpenThreads={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("chat:close-right"));
              }
              const href = buildHref(["chat", "threads"], `/chat/threads`);
              router.push(href);
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("threads:select", { detail: { id: null } }));
              }
            }}
            threadsActive={threadsActive}
            lastReadAt={lastReadAt}
            meId={me.id}
            onOpenThreadItem={(rootId) => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("chat:close-right"));
              }
              const href = buildHref(["chat", "threads"], `/chat/threads`);
              router.push(`${href}#thread-${rootId}`);
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("threads:select", { detail: { id: rootId } }));
              }
            }}
          />
        );
      case "issues":
        return <IssuesPanel />;
      case "calendar":
        return <CalendarPanel />;
      case "members":
        return <MembersPanel />;
      case "docs":
        return <DocsPanel />;
      default:
        return (
          <div className="space-y-3">
            <div className="rounded-xl border border-border/60 bg-panel px-3 py-2 text-xs text-muted">
              프로젝트 대시보드 상세 항목을 선택하세요.
            </div>
            <div className="grid gap-2">
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-xl border border-border/60 bg-panel px-3 py-2 text-left text-xs font-semibold hover:bg-accent"
                onClick={() => router.push(buildHref(null))}
              >
                <span>전체보기</span>
                <span className="text-muted">요약 대시보드</span>
              </button>
              <div className="ml-1 grid gap-1 border-l-2 border-border/80 pl-4">
                <button
                  type="button"
                  className="group flex w-full items-center justify-between rounded-lg border border-border/60 bg-panel/70 px-3 py-2 text-left text-[11px] hover:bg-accent"
                  onClick={() => router.push(`${buildHref(null)}?view=chat`)}
                >
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted group-hover:bg-foreground" />
                    채널
                  </span>
                  <span className="text-muted">상세 보기</span>
                </button>
                <button
                  type="button"
                  className="group flex w-full items-center justify-between rounded-lg border border-border/60 bg-panel/70 px-3 py-2 text-left text-[11px] hover:bg-accent"
                  onClick={() => router.push(`${buildHref(null)}?view=issues`)}
                >
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted group-hover:bg-foreground" />
                    이슈
                  </span>
                  <span className="text-muted">상세 보기</span>
                </button>
                <button
                  type="button"
                  className="group flex w-full items-center justify-between rounded-lg border border-border/60 bg-panel/70 px-3 py-2 text-left text-[11px] hover:bg-accent"
                  onClick={() => router.push(`${buildHref(null)}?view=members`)}
                >
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted group-hover:bg-foreground" />
                    멤버
                  </span>
                  <span className="text-muted">상세 보기</span>
                </button>
                <button
                  type="button"
                  className="group flex w-full items-center justify-between rounded-lg border border-border/60 bg-panel/70 px-3 py-2 text-left text-[11px] hover:bg-accent"
                  onClick={() => router.push(`${buildHref(null)}?view=docs`)}
                >
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted group-hover:bg-foreground" />
                    Docs
                  </span>
                  <span className="text-muted">상세 보기</span>
                </button>
                <button
                  type="button"
                  className="group flex w-full items-center justify-between rounded-lg border border-border/60 bg-panel/70 px-3 py-2 text-left text-[11px] hover:bg-accent"
                  onClick={() => router.push(`${buildHref(null)}?view=calendar`)}
                >
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted group-hover:bg-foreground" />
                    일정
                  </span>
                  <span className="text-muted">상세 보기</span>
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="relative flex h-full overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground">

      {/* Left Rail */}
      <div className={clsx(
        "group/rail relative flex flex-col items-center justify-between border-r border-sidebar-border bg-sidebar px-2 py-4",
        panelOpen ? "w-20" : "w-[72px]"
      )}>
        <div className="flex flex-col items-center gap-4">
          <Link
            href={buildHref(null)}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground text-lg font-bold shadow-lg"
          >
            <Home size={18} />
          </Link>

          <nav className="flex flex-col items-center gap-3">
            {NAV_LINKS.map(item => (
              <RailButton
                key={item.slug}
                href={buildHref(item.slug)}
                icon={item.icon}
                label={item.label}
                active={isActive(item.slug)}
              />
            ))}
          </nav>
        </div>

        <div className="flex flex-col items-center gap-3">
          <button className="h-12 w-12 flex items-center justify-center rounded-2xl border">
            <Settings size={18} />
          </button>
          <a
            href="mailto:support@fourier.app"
            className="h-12 w-12 flex items-center justify-center rounded-2xl border"
          >
            <LifeBuoy size={18} />
          </a>
        </div>
        {!panelOpen && (
          <button
            type="button"
            className="absolute -right-1 top-1/2 inline-flex h-20 w-4 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-panel text-muted opacity-0 shadow-sm transition group-hover/rail:opacity-100 hover:text-foreground"
            onClick={() => setPanelOpen(true)}
            aria-label="패널 열기"
          >
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      {/* Context Panel */}
      {panelOpen ? (
        <div className="group/ctx relative hidden flex-1 flex-col bg-panel px-4 py-5 text-foreground md:flex">
          {activeSurface !== "docs" && (
            <div className="pb-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                {activeSurface ? SURFACE_LABEL[activeSurface] : "Workspace"}
              </div>
            </div>
          )}
          <button
            type="button"
            className="absolute -right-1 top-1/2 inline-flex h-20 w-4 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-panel text-muted opacity-0 shadow-sm transition group-hover/ctx:opacity-100 hover:text-foreground"
            onClick={() => setPanelOpen(false)}
            aria-label="패널 접기"
          >
            <ChevronLeft size={14} />
          </button>
          <div className="flex-1 overflow-y-auto pr-2">{renderPanel()}</div>
        </div>
      ) : (
        <div className="hidden w-0 md:block" />
      )}
    </div>
  );
}
