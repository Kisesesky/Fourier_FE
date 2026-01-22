import type { LucideIcon } from "lucide-react";

export type ActivityEntry = {
  id: string;
  memberId: string;
  time: string;
  action: string;
  target?: string;
  detail?: string;
  badge?: string;
  icon?: LucideIcon;
};

export type ActivityDay = {
  id: string;
  dateLabel: string;
  dayLabel: string;
  entries: ActivityEntry[];
};

export const activityTimeline: ActivityDay[] = [
  {
    id: "2025-11-17",
    dateLabel: "11.17",
    dayLabel: "MON",
    entries: [
      {
        id: "act-release",
        memberId: "mem-you",
        time: "09:12",
        action: "published Calendar API schema",
        target: "v4.2",
        detail: "Blueprint + test suite shipped to workspace.",
        badge: "New release",
      },
      {
        id: "act-invite",
        memberId: "mem-alice",
        time: "10:40",
        action: "invited",
        target: "hailey@fourier.app",
        detail: "Viewer access to Projects workspace.",
      },
      {
        id: "act-upgrade",
        memberId: "mem-bob",
        time: "14:05",
        action: "deployed docs search re-rank",
        detail: "Activity feed now fully server-driven.",
      },
    ],
  },
  {
    id: "2025-11-16",
    dateLabel: "11.16",
    dayLabel: "SUN",
    entries: [
      {
        id: "act-plan",
        memberId: "mem-erin",
        time: "11:20",
        action: "updated workspace plan",
        target: "Premium · +5 seats",
        detail: "Billing synced with RevOps.",
      },
      {
        id: "act-cleanup",
        memberId: "mem-jay",
        time: "16:45",
        action: "archived legacy billing collection",
        detail: "Removed by advisor for GTM stream.",
      },
    ],
  },
  {
    id: "2025-11-15",
    dateLabel: "11.15",
    dayLabel: "SAT",
    entries: [
      {
        id: "act-handoff",
        memberId: "mem-pil",
        time: "08:10",
        action: "shared runbook",
        target: "Client onboarding guide",
        detail: "Notified #integrations with Slack webhook.",
      },
    ],
  },
];
