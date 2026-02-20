// components/layout/Sidebar.tsx
'use client';

import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useEffect, useState } from "react";

import {
  ChevronRight,
  LifeBuoy,
  Settings,
  Home,
  ChevronLeft,
  MessageSquare,
  FolderKanban,
  CalendarDays,
  Users,
  BookText,
  Archive,
} from "lucide-react";

import { useWorkspacePath } from "@/hooks/useWorkspacePath";
import { fetchProjects } from "@/lib/projects";
import { useChat } from "@/workspace/chat/_model/store";
import ChatPanel from "@/components/layout/sidebar/ChatPanel";
import CalendarPanel from "@/components/layout/sidebar/CalendarPanel";
import FilePanel from "@/components/layout/sidebar/FilePanel";
import { NAV_LINKS, SURFACE_LABEL } from "@/components/layout/sidebar/sidebar.constants";
import DocsPanel from "@/components/layout/sidebar/DocsPanel";
import IssuesPanel from "@/components/layout/sidebar/IssuesPanel";
import MembersPanel from "@/components/layout/sidebar/MembersPanel";
import { RailButton } from "@/components/layout/sidebar/sidebar.shared";
import type { SurfaceSlug } from "@/components/layout/sidebar/sidebar.types";

export default function Sidebar() {
  const router = useRouter();
  const { pathname, workspace, buildHref, isActive } = useWorkspacePath();
  const { channels, channelId, setChannel, loadChannels, channelActivity, refreshChannel, lastReadAt, me, users } = useChat();
  const [panelOpen, setPanelOpen] = useState(true);
  const [projectCard, setProjectCard] = useState<{ name: string; iconValue?: string | null } | null>(null);

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

  useEffect(() => {
    const rawTeamId = workspace?.teamId;
    const rawProjectId = workspace?.projectId;
    if (!rawTeamId || !rawProjectId) {
      setProjectCard(null);
      return;
    }
    let cancelled = false;
    const decodedTeamId = (() => {
      try {
        return decodeURIComponent(rawTeamId);
      } catch {
        return rawTeamId;
      }
    })();
    const decodedProjectId = (() => {
      try {
        return decodeURIComponent(rawProjectId);
      } catch {
        return rawProjectId;
      }
    })();
    fetchProjects(decodedTeamId)
      .then((projects) => {
        if (cancelled) return;
        const found = projects.find((project: { id: string }) => project.id === decodedProjectId);
        if (!found) {
          setProjectCard({ name: decodedProjectId, iconValue: null });
          return;
        }
        setProjectCard({ name: found.name, iconValue: found.iconValue ?? null });
      })
      .catch(() => {
        if (cancelled) return;
        setProjectCard({ name: decodedProjectId, iconValue: null });
      });
    return () => {
      cancelled = true;
    };
  }, [workspace?.teamId, workspace?.projectId]);

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
            lastReadAt={lastReadAt}
            meId={me.id}
            users={users}
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
      case "file":
        return <FilePanel />;
      default:
        return (
          <div className="space-y-3">
            <div className="rounded-xl border border-border/60 bg-panel px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-muted/40 text-[10px] font-semibold text-foreground">
                  {projectCard?.iconValue ? (
                    <img src={projectCard.iconValue} alt={projectCard.name} className="h-full w-full object-cover" />
                  ) : (
                    (projectCard?.name ?? "Project").slice(0, 2).toUpperCase()
                  )}
                </span>
                <span className="truncate text-xs font-semibold text-foreground">{projectCard?.name ?? "Project"}</span>
              </div>
            </div>
            <div className="grid gap-2">
              <button
                type="button"
                className="group flex w-full items-center justify-between rounded-xl border border-border/60 bg-panel px-3 py-2 text-left text-xs font-semibold hover:bg-accent"
                onClick={() => router.push(buildHref(null))}
              >
                <span className="inline-flex items-center gap-2"><Home size={13} /> 전체보기</span>
                <span className="text-muted opacity-0 transition-opacity group-hover:opacity-100">대시보드</span>
              </button>
              <div className="ml-1 grid gap-1 border-l-2 border-border/80 pl-4">
                <button
                  type="button"
                  className="group flex w-full items-center justify-between rounded-lg border border-border/60 bg-panel/70 px-3 py-2 text-left text-[11px] hover:bg-accent"
                  onClick={() => router.push(`${buildHref(null)}?view=chat`)}
                >
                    <span className="flex items-center gap-2 text-foreground">
                      <MessageSquare size={12} />
                    채팅
                    </span>
                  <span className="text-muted opacity-0 transition-opacity group-hover:opacity-100">상세 보기</span>
                </button>
                <button
                  type="button"
                  className="group flex w-full items-center justify-between rounded-lg border border-border/60 bg-panel/70 px-3 py-2 text-left text-[11px] hover:bg-accent"
                  onClick={() => router.push(`${buildHref(null)}?view=issues`)}
                >
                  <span className="flex items-center gap-2 text-foreground">
                    <FolderKanban size={12} />
                    이슈
                  </span>
                  <span className="text-muted opacity-0 transition-opacity group-hover:opacity-100">상세 보기</span>
                </button>
                <button
                  type="button"
                  className="group flex w-full items-center justify-between rounded-lg border border-border/60 bg-panel/70 px-3 py-2 text-left text-[11px] hover:bg-accent"
                  onClick={() => router.push(`${buildHref(null)}?view=calendar`)}
                >
                  <span className="flex items-center gap-2 text-foreground">
                    <CalendarDays size={12} />
                    일정
                  </span>
                  <span className="text-muted opacity-0 transition-opacity group-hover:opacity-100">상세 보기</span>
                </button>
                <button
                  type="button"
                  className="group flex w-full items-center justify-between rounded-lg border border-border/60 bg-panel/70 px-3 py-2 text-left text-[11px] hover:bg-accent"
                  onClick={() => router.push(`${buildHref(null)}?view=members`)}
                >
                  <span className="flex items-center gap-2 text-foreground">
                    <Users size={12} />
                    멤버
                  </span>
                  <span className="text-muted opacity-0 transition-opacity group-hover:opacity-100">상세 보기</span>
                </button>
                <button
                  type="button"
                  className="group flex w-full items-center justify-between rounded-lg border border-border/60 bg-panel/70 px-3 py-2 text-left text-[11px] hover:bg-accent"
                  onClick={() => router.push(`${buildHref(null)}?view=docs`)}
                >
                  <span className="flex items-center gap-2 text-foreground">
                    <BookText size={12} />
                    문서
                  </span>
                  <span className="text-muted opacity-0 transition-opacity group-hover:opacity-100">상세 보기</span>
                </button>
                <button
                  type="button"
                  className="group flex w-full items-center justify-between rounded-lg border border-border/60 bg-panel/70 px-3 py-2 text-left text-[11px] hover:bg-accent"
                  onClick={() => router.push(`${buildHref(null)}?view=file`)}
                >
                  <span className="flex items-center gap-2 text-foreground">
                    <Archive size={12} />
                    파일
                  </span>
                  <span className="text-muted opacity-0 transition-opacity group-hover:opacity-100">상세 보기</span>
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
        <div className="group/ctx relative flex-1 flex-col bg-panel px-4 py-5 text-foreground">
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
