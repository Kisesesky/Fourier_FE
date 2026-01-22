'use client';

import { useState } from "react";
import clsx from "clsx";
import { ChevronRight, X } from "lucide-react";
import { currentPlan } from "@/workspace/root-model/workspaceData";
import { useWorkspaceUser } from "@/hooks/useWorkspaceUser";

const workspaceSettingsTabs = ["Workspace", "Members", "Billing", "Notifications", "Automation", "My Account"] as const;
type WorkspaceSettingsSection = (typeof workspaceSettingsTabs)[number];

interface WorkspaceSettingsModalProps {
  onClose: () => void;
}

const WorkspaceSettingsModal = ({ onClose }: WorkspaceSettingsModalProps) => {
  const [activeSection, setActiveSection] = useState<WorkspaceSettingsSection>("Workspace");
  const { currentUser, userFallback } = useWorkspaceUser();
  const accountEmail = (currentUser as { email?: string } | undefined)?.email ?? "workspace@fourier.app";
  const accountName = currentUser?.name ?? "Fourier member";

  const workspacePanel = (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border bg-panel px-5 py-4 transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted">Workspace name</p>
            <p className="text-2xl font-semibold text-foreground">Fourier Core</p>
            <p className="text-sm text-muted">{currentPlan.renewal}</p>
          </div>
          <button
            type="button"
            className="rounded-full border border-border px-4 py-1.5 text-sm text-muted transition hover:bg-accent hover:text-foreground"
          >
            Rename
          </button>
        </div>
        <div className="mt-4 grid gap-4 text-sm text-muted sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted">Domain</p>
            <p className="mt-1 font-mono text-base text-foreground">fourier.flow.app</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted">Region</p>
            <p className="mt-1 text-base text-foreground">Seoul (ICN)</p>
          </div>
        </div>
      </div>
      <div className="rounded-3xl border border-border bg-panel px-5 py-4 text-sm text-muted transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted">Security</p>
            <p className="mt-1 text-base text-foreground">SAML SSO · Device posture checks</p>
          </div>
          <button
            type="button"
            className="rounded-full border border-border px-3 py-1 text-xs text-muted hover:bg-accent hover:text-foreground"
          >
            Configure
          </button>
        </div>
      </div>
    </div>
  );

  const accountPanel = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-border bg-panel text-xl font-semibold">
          {currentUser?.avatarUrl ? (
            <img src={currentUser.avatarUrl} alt={accountName} className="h-full w-full object-cover" />
          ) : (
            userFallback
          )}
        </div>
        <div>
          <p className="text-lg font-semibold text-foreground">{accountName}</p>
          <p className="text-sm text-muted">{accountEmail}</p>
        </div>
        <button
          type="button"
          className="ml-auto rounded-full border border-border px-4 py-1.5 text-sm text-muted hover:bg-accent hover:text-foreground"
        >
          Upload avatar
        </button>
      </div>
      <div className="grid gap-4 text-sm text-muted sm:grid-cols-2">
        <div className="rounded-3xl border border-border bg-panel px-4 py-3 transition-colors">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Timezone</p>
          <p className="mt-1 text-base text-foreground">KST (UTC+9)</p>
        </div>
        <div className="rounded-3xl border border-border bg-panel px-4 py-3 transition-colors">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Authentication</p>
          <p className="mt-1 text-base text-foreground">2FA enabled · Passkey ready</p>
        </div>
      </div>
      <div className="rounded-3xl border border-border bg-panel px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted">API token</p>
            <p className="mt-1 font-mono text-foreground">•••••••-F4UR-13R</p>
          </div>
          <button
            type="button"
            className="rounded-full border border-border px-3 py-1 text-xs text-muted hover:bg-accent hover:text-foreground"
          >
            Regenerate
          </button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (activeSection === "Workspace") return workspacePanel;
    if (activeSection === "My Account") return accountPanel;
    return (
      <div className="rounded-3xl border border-border bg-panel px-6 py-12 text-center text-sm text-muted transition-colors">
        {activeSection} section will be available soon.
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 py-8">
      <div className="relative flex w-full max-w-5xl flex-col gap-6 rounded-[36px] border border-border bg-background p-6 text-foreground md:flex-row">
        <button
          type="button"
          className="absolute right-6 top-6 rounded-full border border-border p-2 text-muted transition hover:bg-accent hover:text-foreground"
          onClick={onClose}
          aria-label="Close workspace settings"
        >
          <X size={16} />
        </button>
        <nav className="w-full space-y-2 md:w-60">
          {workspaceSettingsTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={clsx(
                "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold transition",
                activeSection === tab ? "bg-foreground text-background" : "text-muted hover:bg-accent hover:text-foreground"
              )}
              onClick={() => setActiveSection(tab)}
            >
              {tab}
              {activeSection === tab && <ChevronRight size={16} className="text-background" />}
            </button>
          ))}
        </nav>
        <div className="max-h-[70vh] flex-1 overflow-y-auto pr-2">{renderContent()}</div>
      </div>
    </div>
  );
};

export default WorkspaceSettingsModal;






