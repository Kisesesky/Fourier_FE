// components/layout/topbar/ToolbarIcon.tsx
'use client';

import type { LucideIcon } from "lucide-react";

type ToolbarIconProps = {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
};

export default function ToolbarIcon({ icon: Icon, label, onClick }: ToolbarIconProps) {
  return (
    <button
      type="button"
      className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition hover:bg-accent hover:text-foreground"
      aria-label={label}
      onClick={onClick}
    >
      <Icon size={20} />
    </button>
  );
}
