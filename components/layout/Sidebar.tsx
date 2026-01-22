'use client';

import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import {
  BookText, CalendarDays, Folder, FolderKanban, LifeBuoy, MessageSquare, Settings, Users, Home
} from "lucide-react";

import { useWorkspacePath } from "@/hooks/useWorkspacePath";
import { useChat } from "@/workspace/chat/_model/store";

import { DocsTree } from "@/app/(workspace)/workspace/[teamId]/[projectId]/docs/_components/note-drive/tree";
import TreeToolbar from "@/app/(workspace)/workspace/[teamId]/[projectId]/docs/_components/note-drive/tree/TreeToolbar";

import { DEFAULT_CALENDARS } from "@/workspace/calendar/_model/mocks";
import { kanbanWorkflowNodes } from "@/workspace/issues/_model/kanbanData";
import { defaultMembers } from "@/workspace/members/_model/mocks";

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
const Section = ({ title, children }: any) => (
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
const CalendarPanel = () => (
  <Section title="캘린더 목록">
    {DEFAULT_CALENDARS.map(cal => (
      <div
        key={cal.id}
        className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-xs"
      >
        <span className="flex items-center gap-2">
          <span style={{ background: cal.color }} className="h-2 w-2 rounded-full"></span>
          {cal.name}
        </span>
        <span className="text-muted">{cal.visible ? "표시" : "숨김"}</span>
      </div>
    ))}
  </Section>
);

/* Members */
const MembersPanel = () => {
  const favorites = defaultMembers.filter(m => m.isFavorite);
  const rest = defaultMembers.filter(m => !m.isFavorite).slice(0, 6);

  return (
    <div className="space-y-3">
      <Section title="Favorites">
        {favorites.map(m => (
          <div key={m.id} className="flex items-center gap-2 rounded-lg px-3 py-2 border text-xs">
            {m.name}
          </div>
        ))}
      </Section>

      <Section title="Team">
        {rest.map(m => (
          <div key={m.id} className="flex items-center gap-2 rounded-lg px-3 py-2 border text-xs">
            {m.name}
          </div>
        ))}
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
  const { channels, allChannels, channelId, setChannel } = useChat();

  const activeSurface: SurfaceSlug | null = useMemo(() => {
    return NAV_LINKS.find(item => isActive(item.slug))?.slug ?? null;
  }, [pathname, isActive]);

  const renderPanel = () => {
    switch (activeSurface) {
      case "chat":
        return <div className="p-3 text-xs">채팅 채널 목록 (생략 가능)</div>;
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
          <div className="flex flex-1 items-center justify-center text-sm text-muted">
            모듈을 선택하세요
          </div>
        );
    }
  };

  return (
    <div className="flex h-full border-r border-sidebar-border bg-sidebar text-sidebar-foreground">

      {/* Left Rail */}
      <div className="w-20 flex flex-col items-center justify-between border-r border-sidebar-border bg-sidebar px-2 py-4">
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
      </div>

      {/* Context Panel */}
      <div className="hidden flex-1 flex-col bg-panel px-4 py-5 text-foreground md:flex">
      {activeSurface !== "docs" && (
        <div className="pb-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
            {activeSurface ? SURFACE_LABEL[activeSurface] : "Workspace"}
          </div>
        </div>
      )}
        <div className="flex-1 overflow-y-auto pr-2">{renderPanel()}</div>
      </div>
    </div>
  );
}
