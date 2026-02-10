// components/layout/topbar/topbar.constants.ts

import { Monitor, Moon, Sun } from "lucide-react";

import type { ThemeMode } from "@/lib/theme";

export const THEME_ICONS: Record<ThemeMode, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

export const THEME_LABELS: Record<ThemeMode, string> = {
  light: "Light mode",
  dark: "Dark mode",
  system: "System mode",
};
