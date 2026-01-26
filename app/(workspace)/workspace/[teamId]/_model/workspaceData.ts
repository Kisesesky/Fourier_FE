import { Briefcase, Clock3, Grid2x2, Star, Users } from "lucide-react";
import type {
  BillingContact,
  InvoiceRecord,
  PendingInvite,
  Project,
  RecentLink,
  ResourceDoc,
  RoleGuide,
  Shortcut,
  Team,
  WorkspaceMember,
} from "@/types/workspace";

export const initialTeams: Team[] = [
  { id: "team-asdf", name: "asdf", role: "Team Owner", members: 11, active: true },
  { id: "team-studio", name: "Product Studio", role: "Editor", members: 7 },
];

export const shortcuts: Shortcut[] = [
  { id: "favorite", label: "My Favorites", icon: Star },
  { id: "friends", label: "Friends", icon: Users },
  { id: "recent", label: "Recently Visited", icon: Clock3 },
];

export const projects: Project[] = [
  {
    id: "proj-11",
    title: "11",
    tag: "HTTP",
    owner: "Core Infra",
    updated: "Updated 2h ago",
    description: "Internal gateway for service-to-service contracts.",
  },
  {
    id: "proj-calendar",
    title: "Calendar API",
    tag: "REST",
    owner: "Platform",
    updated: "Updated yesterday",
    description: "Calendar API schema and usage examples.",
  },
];

export const recentVisited: RecentLink[] = [
  {
    id: "recent-11",
    title: "11",
    description: "Primary HTTP gateway project",
    tag: "Project",
    visited: "Visited an hour ago",
    icon: Grid2x2,
  },
  {
    id: "recent-calendar",
    title: "Calendar API",
    description: "REST contracts and tests",
    tag: "Resource",
    visited: "Visited 2 days ago",
    icon: Briefcase,
  },
  {
    id: "recent-plan",
    title: "Premium Plan",
    description: "Billing overview and seat usage",
    tag: "Plan",
    visited: "Visited 4 days ago",
    icon: Star,
  },
];

export const memberTabs = ["Members", "Pending Invites", "Roles"] as const;
export type MemberTab = (typeof memberTabs)[number];

export const workspaceMembers: WorkspaceMember[] = [
  {
    id: "mem-june",
    name: "June Park",
    email: "june@fourier.app",
    role: "Team Owner",
    status: "Active",
    lastActive: "Active now",
    location: "Seoul, KR",
    accent: "from-[#ffcf8b] to-[#f28b3c]",
  },
  {
    id: "mem-hyun",
    name: "Hyunwoo Choi",
    email: "hyunwoo@fourier.app",
    role: "Editor",
    status: "Active",
    lastActive: "Active 12m ago",
    location: "Busan, KR",
    accent: "from-[#7f8dff] to-[#4d59d3]",
  },
  {
    id: "mem-mina",
    name: "Mina K.",
    email: "mina@fourier.app",
    role: "Viewer",
    status: "Away",
    lastActive: "Yesterday",
    location: "Tokyo, JP",
    accent: "from-[#8df3ff] to-[#3ec4e2]",
  },
  {
    id: "mem-ethan",
    name: "Ethan Seo",
    email: "ethan.seo@fourier.app",
    role: "Editor",
    status: "Active",
    lastActive: "Active 1h ago",
    location: "Seoul, KR",
    accent: "from-[#ffd6f3] to-[#ef74b2]",
  },
  {
    id: "mem-hana",
    name: "Hana Im",
    email: "hana@fourier.app",
    role: "Viewer",
    status: "Invited",
    lastActive: "Invited 2d ago",
    location: "Remote",
    accent: "from-[#9cf196] to-[#3cb34a]",
  },
];

export const pendingMemberInvites: PendingInvite[] = [
  { id: "invite-1", email: "lena@fourier.app", role: "Editor", invitedBy: "June Park", invitedOn: "Nov 12", status: "Sent" },
  { id: "invite-2", email: "noah@fourier.app", role: "Viewer", invitedBy: "Hyunwoo Choi", invitedOn: "Nov 10", status: "Sent" },
  { id: "invite-3", email: "studio@fourier.app", role: "Viewer", invitedBy: "June Park", invitedOn: "Nov 08", status: "Bounced" },
];

export const roleGuides: RoleGuide[] = [
  {
    id: "role-owner",
    name: "Team Owner",
    description: "Full control over billing, roles, and workspace security.",
    permissions: ["Invite or remove members", "Manage billing + plans", "Create & archive projects", "Access audit logs"],
    badge: "Default",
  },
  {
    id: "role-editor",
    name: "Editor",
    description: "Collaborate on every project with edit access.",
    permissions: ["Create + edit projects", "Manage collections", "Comment + mention teammates"],
  },
  {
    id: "role-viewer",
    name: "Viewer",
    description: "Read-only visibility with ability to comment.",
    permissions: ["Browse resources", "Leave comments", "View activity + analytics"],
  },
];

export const inviteRoleOptions = ["Team Owner", "Editor", "Viewer"];

export const currentPlan = {
  name: "Fourier Premium",
  price: "$29",
  billing: "per member / month",
  seats: 32,
  renewal: "Renews on Dec 01, 2025",
};

export const planFeatureList = [
  "Unlimited projects, resources, and uploads",
  "Advanced permissions + audit logging",
  "Priority API capacity with sandbox",
  "Slack + PagerDuty alerts",
];

export const creditUsage = {
  label: "Request credits",
  used: 128000,
  total: 160000,
  reset: "Resets December 01 at 09:00 KST",
};

export const billingManagers: BillingContact[] = [
  { id: "bill-june", name: "June Park", email: "june@fourier.app", role: "Team Owner", accent: "from-[#ffa58b] to-[#f56539]" },
  { id: "bill-hyun", name: "Hyunwoo Choi", email: "hyunwoo@fourier.app", role: "Billing Admin", accent: "from-[#7ea2ff] to-[#4d6fd3]" },
];

export const billingHistory: InvoiceRecord[] = [
  { id: "INV-4821", period: "Nov 2025", amount: "$928", status: "Paid", date: "Nov 01", method: "Visa •••• 1129" },
  { id: "INV-4710", period: "Oct 2025", amount: "$902", status: "Paid", date: "Oct 01", method: "Visa •••• 1129" },
  { id: "INV-4631", period: "Sep 2025", amount: "$902", status: "Paid", date: "Sep 01", method: "Visa •••• 1129" },
  { id: "INV-4550", period: "Aug 2025", amount: "$886", status: "Paid", date: "Aug 01", method: "Visa •••• 1129" },
];

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

export const resources: ResourceDoc[] = [
  {
    id: "res-core",
    title: "Core HTTP schema",
    category: "HTTP",
    badge: "Live",
    summary: "Auto-generated schema synced nightly from production gateway.",
    updated: "Updated 4h ago",
    owner: "Core Infra",
    accent: "from-[#7ae1ff] via-[#5aa6ff] to-[#4c6fff]",
  },
  {
    id: "res-analytics",
    title: "Analytics workbook",
    category: "Workbook",
    badge: "Beta",
    summary: "Experiment analysis with Looker blocks + Amplitude dashboards.",
    updated: "Updated yesterday",
    owner: "Product Intelligence",
    accent: "from-[#ffd88c] via-[#ffac6f] to-[#ff7a4b]",
  },
  {
    id: "res-auth",
    title: "Authbff collection",
    category: "Collection",
    badge: "Archived",
    summary: "Legacy auth flows still referenced by billing micro frontends.",
    updated: "Updated 2 days ago",
    owner: "Identity Platform",
    accent: "from-[#c8b6ff] via-[#9b8dff] to-[#5d4baf]",
  },
  {
    id: "res-guide",
    title: "Client onboarding guide",
    category: "Runbook",
    badge: "Internal",
    summary: "Checklist for launching a partner workspace on Fourier Cloud.",
    updated: "Updated 1 week ago",
    owner: "Solutions",
    accent: "from-[#9fffcd] via-[#63f7b8] to-[#25c38c]",
  },
];

export const resourceFilters = ["All", "Collections", "Schemas", "Runbooks", "Workbooks"];
