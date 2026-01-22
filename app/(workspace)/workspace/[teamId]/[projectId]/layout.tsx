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

export default function WorkspaceProjectLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showWorkspaceSettings, setShowWorkspaceSettings] = useState(false);
  const pathname = usePathname();

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
    </ToastProvider>
  );
}
