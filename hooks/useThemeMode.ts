// src/hooks/useThemeMode.ts
import { useCallback, useEffect, useState } from "react";
import {
  ThemeMode,
  applyTheme,
  getStoredTheme,
  nextThemeMode,
  persistTheme,
  THEME_STORAGE_KEY,
} from "@/lib/theme";

export function useThemeMode() {
  const [theme, setTheme] = useState<ThemeMode>(() =>
    typeof window === "undefined" ? "system" : getStoredTheme()
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = getStoredTheme();
    setTheme(stored);
    applyTheme(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    persistTheme(theme);
    applyTheme(theme);
  }, [theme, hydrated]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage) return;
      if (event.key !== THEME_STORAGE_KEY) return;
      const next =
        event.newValue === "light" || event.newValue === "dark"
          ? (event.newValue as ThemeMode)
          : "system";
      setTheme(next);
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const cycleTheme = useCallback(() => {
    setTheme((prev) => nextThemeMode(prev));
  }, []);

  return { theme, setTheme, cycleTheme, hydrated };
}

export function useThemeIcon<T>(icons: Record<ThemeMode, T>) {
  const { theme, cycleTheme } = useThemeMode();
  return { theme, Icon: icons[theme], cycleTheme };
}
