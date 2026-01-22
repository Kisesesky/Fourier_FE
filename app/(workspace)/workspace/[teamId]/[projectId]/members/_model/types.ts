export type MemberRole = "owner" | "admin" | "member" | "guest";

export type PresenceStatus = "online" | "away" | "offline" | "dnd";

export interface Member {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  title?: string;
  avatarUrl?: string;
  location?: string;
  timezone?: string;
  description?: string;
  joinedAt: number;
  lastActiveAt: number;
  isFavorite?: boolean;
  statusMessage?: string;
  tags?: string[];
}

export type InviteStatus = "pending" | "accepted" | "expired" | "revoked";

export interface MemberInvite {
  id: string;
  email: string;
  role: MemberRole;
  invitedBy: string;
  invitedByName: string;
  invitedAt: number;
  status: InviteStatus;
  message?: string;
  name?: string;
  avatarUrl?: string;
}

export interface MemberPresence {
  memberId: string;
  status: PresenceStatus;
  lastSeenAt: number;
}

export interface MemberSummary {
  total: number;
  online: number;
  favorites: number;
}
