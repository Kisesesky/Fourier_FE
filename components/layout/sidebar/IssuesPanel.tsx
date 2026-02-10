// components/layout/sidebar/IssuesPanel.tsx
'use client';

import clsx from "clsx";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ISSUE_TABS } from "./sidebar.constants";

export default function IssuesPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = (searchParams?.get("view") as typeof ISSUE_TABS[number]["key"]) || "table";

  const setView = (view: string) => {
    if (!pathname) return;
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("view", view);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-2">
      {ISSUE_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => setView(tab.key)}
            className={clsx(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition",
              isActive
                ? "border-brand/50 bg-brand/10 text-brand"
                : "border-transparent text-muted hover:border-border hover:bg-subtle/60 hover:text-foreground"
            )}
          >
            <Icon size={14} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
