// app/(workspace)/workspace/[teamId]/_model/hooks/useSettingsPreferences.ts
import { useMemo, useState } from "react";
import { integrationApps, notificationPresets } from "../constants/workspace.constants";

export function useSettingsPreferences() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(notificationPresets.map((item) => [item.id, true])),
  );

  const togglePref = (id: string) => {
    setPrefs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const apps = useMemo(() => integrationApps, []);

  return {
    prefs,
    apps,
    notificationPresets,
    togglePref,
  };
}
