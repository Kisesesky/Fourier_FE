import type { LucideIcon } from "lucide-react";

export type Team = { id: string; name: string; role: string; members: number; active?: boolean };
export type Workspace = { id: string; name: string; createdAt: string };
export type Shortcut = { id: string; label: string; hint?: string; icon: LucideIcon };
export type Project = { id: string; title: string; tag: string; owner: string; updated: string; description: string };
export type ProjectViewMode = "grid" | "list";
export type WorkspaceMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Invited" | "Away";
  lastActive: string;
  location: string;
  accent: string;
};
export type PendingInvite = {
  id: string;
  email: string;
  role: string;
  invitedBy: string;
  invitedOn: string;
  status: "Sent" | "Bounced";
};
export type RoleGuide = { id: string; name: string; description: string; permissions: string[]; badge?: string };
export type BillingContact = { id: string; name: string; email: string; role: string; accent: string };
export type InvoiceRecord = { id: string; period: string; amount: string; status: "Paid" | "Upcoming"; date: string; method: string };
export type ResourceDoc = {
  id: string;
  title: string;
  category: string;
  badge: string;
  summary: string;
  updated: string;
  owner: string;
  accent: string;
};
export type ActivityEvent = {
  id: string;
  title: string;
  description: string;
  actor: string;
  actorRole: string;
  time: string;
  icon: LucideIcon;
  accent: string;
};
export type RecentLink = {
  id: string;
  title: string;
  description: string;
  tag: string;
  visited: string;
  icon: LucideIcon;
};

export type SurfaceTab = "Resources" | "Activities" | "Members" | "Settings" | "Docs" | "Invite" | "Plans";
