// lib/dashboardBackground.ts
export type DashboardBackgroundSetting = {
  type: "color" | "image" | "iframe";
  value: string;
};

export const DASHBOARD_VIDEO_EMBED =
  "https://assets.pinterest.com/ext/embed.html?id=835628905898799155";

export const DEFAULT_DASHBOARD_BACKGROUND: DashboardBackgroundSetting = {
  type: "color",
  value: "#f5f6fc",
};

function isDashboardBackgroundSetting(value: unknown): value is DashboardBackgroundSetting {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<DashboardBackgroundSetting>;
  return (
    candidate.type === "color" ||
    candidate.type === "image" ||
    candidate.type === "iframe"
  ) && typeof candidate.value === "string";
}

export function serializeDashboardBackground(setting: DashboardBackgroundSetting): string {
  return JSON.stringify(setting);
}

export function parseDashboardBackground(raw?: string | null): DashboardBackgroundSetting | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (isDashboardBackgroundSetting(parsed)) {
      return parsed;
    }
  } catch {
    // fall through to legacy parsing
  }

  if (raw.startsWith("iframe::")) {
    return { type: "iframe", value: raw.slice("iframe::".length) };
  }
  if (raw.startsWith("#")) {
    return { type: "color", value: raw };
  }
  return { type: "image", value: raw };
}
