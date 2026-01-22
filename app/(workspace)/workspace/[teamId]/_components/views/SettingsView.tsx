'use client';

import { useState } from "react";
import clsx from "clsx";
import { notificationPresets, integrationApps } from "@/workspace/root-model/workspaceData";

const SettingsView = () => {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(notificationPresets.map((item) => [item.id, true]))
  );
  const togglePref = (id: string) => setPrefs((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] border border-border bg-panel p-6 text-foreground shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.4em] text-muted">Workspace</p>
            <p className="mt-2 text-3xl font-semibold">Fourier Core</p>
            <p className="text-sm text-muted">Default environment · APAC region</p>
          </div>
          <button
            type="button"
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted hover:bg-accent hover:text-foreground"
          >
            Edit workspace
          </button>
        </div>
        <div className="mt-6 grid gap-4 text-sm text-muted md:grid-cols-2">
          <div className="rounded-2xl border border-border px-4 py-3">
            <p className="text-xs uppercase tracking-[0.3em] text-muted">Workspace slug</p>
            <p className="mt-2 font-mono text-base text-foreground">fourier.flow.app</p>
          </div>
          <div className="rounded-2xl border border-border px-4 py-3">
            <p className="text-xs uppercase tracking-[0.3em] text-muted">Data residency</p>
            <p className="mt-2 text-base text-foreground">Seoul (ICN)</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-border bg-panel p-6 text-foreground shadow-[0_3px_10px_rgba(0,0,0,0.04)]">
          <p className="text-lg font-semibold">Notification preferences</p>
          <div className="mt-4 divide-y divide-border">
            {notificationPresets.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted">{item.description}</p>
                </div>
                <button
                  type="button"
                  className={clsx(
                    "flex h-7 w-12 items-center rounded-full border border-border bg-accent px-1 transition",
                    prefs[item.id] ? "justify-end bg-emerald-400/20" : "justify-start"
                  )}
                  onClick={() => togglePref(item.id)}
                  aria-pressed={prefs[item.id]}
                >
                  <span
                    className={clsx(
                      "h-5 w-5 rounded-full bg-foreground transition",
                      prefs[item.id] ? "shadow-[0_0_8px_rgba(72,255,193,0.7)]" : "opacity-70"
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-border bg-panel p-6 text-foreground shadow-[0_3px_10px_rgba(0,0,0,0.04)]">
          <p className="text-lg font-semibold">Integrations</p>
          <div className="mt-4 space-y-4">
            {integrationApps.map((app) => (
              <div key={app.id} className="flex items-start justify-between gap-3 rounded-2xl border border-border px-4 py-3">
                <div>
                  <p className="font-semibold">{app.name}</p>
                  <p className="text-sm text-muted">{app.description}</p>
                </div>
                <button
                  type="button"
                  className={clsx(
                    "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em]",
                    app.status === "Connected"
                      ? "border-emerald-400/40 text-emerald-300"
                      : "border-border text-muted hover:text-foreground"
                  )}
                >
                  {app.status}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SettingsView;


