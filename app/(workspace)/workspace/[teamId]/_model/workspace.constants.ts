// app/(workspace)/workspace/[teamId]/_model/workspace.constants.ts
import { Clock3, Star, Users } from "lucide-react";
import type { Shortcut } from "@/types/workspace";

export const shortcuts: Shortcut[] = [
  { id: "favorite", label: "My Favorites", icon: Star },
  { id: "friends", label: "Friends", icon: Users },
  { id: "recent", label: "Recently Visited", icon: Clock3 },
];

export const currentPlan = {
  name: "Fourier Premium",
  price: "$29",
  billing: "per member / month",
  seats: 32,
  renewal: "Renews on Dec 01, 2025",
};

export const notificationPresets = [
  { id: "mentions", label: "Mentions & replies", description: "Slack + email" },
  { id: "launches", label: "Launch updates", description: "Product launch + roadmap" },
  { id: "security", label: "Security alerts", description: "Sign-in + workspace security" },
];

export const integrationApps = [
  { id: "slack", name: "Slack", description: "Send workspace updates to #integrations", status: "Connected" },
  { id: "pagerduty", name: "PagerDuty", description: "Page on-call for failing monitors", status: "Connected" },
  { id: "webhook", name: "Custom Webhook", description: "POST JSON payload to automation endpoint", status: "Not configured" },
];
