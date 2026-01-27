// app/(workspace)/workspcae/[teamId]/[projectId]/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import WorkspaceSettingsModal from "@/workspace/root/WorkspaceSettingsModal";
import MobileNavHeader from "@/components/layout/MobileNavHeader";
import { ToastProvider } from "@/components/ui/Toast";
import Drawer from "@/components/ui/Drawer";
import FloatingDm from "../_components/FloatingDm";

export default function WorkspaceProjectLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showWorkspaceSettings, setShowWorkspaceSettings] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!pathname) return;
    const segments = pathname.split("/").filter(Boolean);
    if (segments[0] !== "workspace" || segments.length < 3) return;
    const teamId = decodeURIComponent(segments[1] ?? "");
    const projectId = decodeURIComponent(segments[2] ?? "");
    const section = segments[3] ?? "overview";
    const detail = segments[4];

    const labelMap: Record<string, { tag: string; iconKey: string; description: string }> = {
      overview: { tag: "Project", iconKey: "project", description: "프로젝트 개요" },
      docs: { tag: "Docs", iconKey: "docs", description: "문서" },
      chat: { tag: "Chat", iconKey: "chat", description: "대화" },
      calendar: { tag: "Calendar", iconKey: "calendar", description: "일정" },
      issues: { tag: "Issues", iconKey: "issues", description: "이슈" },
      worksheet: { tag: "Worksheet", iconKey: "worksheet", description: "워크시트" },
      members: { tag: "Members", iconKey: "members", description: "멤버" },
    };

    const label = labelMap[section] ?? labelMap.overview;
    const detailLabel = detail ? ` · ${decodeURIComponent(detail)}` : "";
    const description = `${label.description}${detailLabel}`;
    let projectTitle = projectId || "Project";
    let projectIconValue = "";
    let projectDescription = label.description;
    try {
      const recentRaw = localStorage.getItem("recentProjects");
      const recentParsed = recentRaw
        ? (JSON.parse(recentRaw) as Array<{ id?: string; label?: string; iconValue?: string; description?: string }>)
        : [];
      const matched = recentParsed.find((item) => item.id === projectId);
      if (matched?.label) projectTitle = matched.label;
      if (matched?.iconValue) projectIconValue = matched.iconValue;
      if (matched?.description) projectDescription = matched.description;
    } catch {
      // ignore parse errors
    }

    const entry = {
      id: `${teamId}-${projectId}-${section}-${detail ?? "root"}`,
      title: projectTitle,
      description: projectDescription || description,
      tag: label.tag,
      visitedAt: Date.now(),
      iconKey: label.iconKey,
      iconValue: projectIconValue,
      path: pathname,
    };

    const STORAGE_KEY = "recently-visited";
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as typeof entry[]) : [];
      const next = [entry, ...parsed.filter((item) => item.path !== entry.path)];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(0, 8)));
      window.dispatchEvent(new CustomEvent("recently-visited:update"));
    } catch (err) {
      console.error("Failed to update recent visited", err);
    }
  }, [pathname]);

  useEffect(() => {
    const handleOpen = () => setSidebarOpen(true);
    const handleClose = () => setSidebarOpen(false);
    const handleToggle = () => setSidebarOpen((prev) => !prev);

    window.addEventListener("app:open-sidebar", handleOpen);
    window.addEventListener("app:close-sidebar", handleClose);
    window.addEventListener("app:toggle-sidebar", handleToggle);
    return () => {
      window.removeEventListener("app:open-sidebar", handleOpen);
      window.removeEventListener("app:close-sidebar", handleClose);
      window.removeEventListener("app:toggle-sidebar", handleToggle);
    };
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handler = () => setShowWorkspaceSettings(true);
    if (typeof window === "undefined") return;
    window.addEventListener("workspace:open-settings", handler as EventListener);
    return () => {
      window.removeEventListener("workspace:open-settings", handler as EventListener);
    };
  }, []);

  return (
    <ToastProvider>
      <AppShell
        header={<Topbar workspaceMode onWorkspaceSettings={() => setShowWorkspaceSettings(true)} />}
        sidebar={<Sidebar />}
        sidebarWidth={360}
      >
        {children}
      </AppShell>

      <Drawer
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        title="Navigation"
        width={320}
        side="left"
        headerContent={(close) => <MobileNavHeader onClose={close} />}
      >
        <Sidebar />
      </Drawer>

      {showWorkspaceSettings && <WorkspaceSettingsModal onClose={() => setShowWorkspaceSettings(false)} />}
      <FloatingDm />
    </ToastProvider>
  );
}
