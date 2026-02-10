// components/layout/sidebar/sidebar.shared.tsx
'use client';

import clsx from "clsx";
import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Ban, Moon } from "lucide-react";

import type { UserPresenceDotStatus } from "./sidebar.types";

type RailButtonProps = {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
};

export function RailButton({ href, icon: Icon, label, active }: RailButtonProps) {
  return (
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
}

export function Section({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{title}</p>
      <div className="mt-2 space-y-1">{children}</div>
    </div>
  );
}

export function StatusIcon({ status }: { status: UserPresenceDotStatus }) {
  if (status === "online") return <span className="h-2.5 w-2.5 rounded-full bg-sky-400" aria-hidden />;
  if (status === "offline") return <span className="h-2.5 w-2.5 rounded-full bg-zinc-400" aria-hidden />;
  if (status === "away") return <Moon size={12} className="text-amber-400" aria-hidden />;
  return <Ban size={12} className="text-rose-500" aria-hidden />;
}
