// lib/mocks/members.ts

import type { Member, MemberInvite, MemberPresence } from "@/workspace/members/_model/types";

const now = Date.now();

export const defaultMembers: Member[] = [
  {
    id: "mem-you",
    name: "You",
    email: "you@flowdash.dev",
    role: "owner",
    title: "Head of Product",
    location: "Seoul, KR",
    timezone: "KST",
    description: "Building Flowdash, orchestrating docs + chat + work.",
    joinedAt: now - 1000 * 60 * 60 * 24 * 180,
    lastActiveAt: now - 1000 * 60 * 2,
    isFavorite: true,
    statusMessage: "Reviewing roadmap ✔",
    tags: ["Founding team", "Strategy"],
    avatarUrl: "https://i.pinimg.com/736x/73/8f/bc/738fbce0702b9d2ce0cc4d963f322221.jpg",
  },
  {
    id: "mem-alice",
    name: "카리나",
    email: "alice@flowdash.dev",
    role: "manager",
    title: "Design Lead",
    location: "Seoul, KR",
    timezone: "KST",
    description: "Leading system design and docs UX.",
    joinedAt: now - 1000 * 60 * 60 * 24 * 120,
    lastActiveAt: now - 1000 * 60 * 5,
    isFavorite: true,
    statusMessage: "Sketching Docs outline ✍️",
    tags: ["Design", "Docs"],
    avatarUrl: "https://newsimg.sedaily.com/2024/04/24/2D81DZ01NJ_1.jpg",
  },
  {
    id: "mem-bob",
    name: "장원영",
    email: "bob@flowdash.dev",
    role: "member",
    title: "Frontend Engineer",
    location: "Seoul, KR",
    timezone: "KST",
    description: "Chat infra + realtime plumbing.",
    joinedAt: now - 1000 * 60 * 60 * 24 * 90,
    lastActiveAt: now - 1000 * 60 * 30,
    statusMessage: "Pairing on presence API",
    tags: ["Chat", "Realtime"],
    avatarUrl: "https://images.khan.co.kr/article/2025/05/22/news-p.v1.20250522.7f979f162c0a439c8c8b3bf60b9740e9_P1.jpg",
  },
  {
    id: "mem-erin",
    name: "설윤",
    email: "erin@flowdash.dev",
    role: "member",
    title: "Product Operations",
    location: "Busan, KR",
    timezone: "KST",
    description: "Keeps all sprint data tidy.",
    joinedAt: now - 1000 * 60 * 60 * 24 * 60,
    lastActiveAt: now - 1000 * 60 * 90,
    tags: ["Operations"],
    avatarUrl: "https://cdn.tvj.co.kr/news/photo/202510/114072_255129_316.jpg",
  },
  {
    id: "mem-jay",
    name: "차은우",
    email: "jay@flowdash.dev",
    role: "guest",
    title: "Advisor",
    location: "San Francisco, US",
    timezone: "PST",
    description: "Helps with GTM experiments.",
    joinedAt: now - 1000 * 60 * 60 * 24 * 30,
    lastActiveAt: now - 1000 * 60 * 60 * 8,
    statusMessage: "Offline",
    avatarUrl: "https://pds.joongang.co.kr/news/component/htmlphoto_mmdata/202510/31/e5dbbe69-0e66-431e-b48b-5da76d324337.jpg",
  },
  {
    id: "mem-pil",
    name: "필릭스",
    email: "jay@flowdash.dev",
    role: "guest",
    title: "Advisor",
    location: "San Francisco, US",
    timezone: "PST",
    description: "Helps with GTM experiments.",
    joinedAt: now - 1000 * 60 * 60 * 24 * 30,
    lastActiveAt: now - 1000 * 60 * 60 * 8,
    statusMessage: "Offline",
    avatarUrl: "https://img2.daumcdn.net/thumb/R658x0.q70/?fname=https://t1.daumcdn.net/news/202508/20/segye/20250820130713723qdtn.jpg",
  },
];

export const defaultInvites: MemberInvite[] = [
  {
    id: "inv-hailey",
    email: "hailey@flowdash.dev",
    name: "손흥민",
    role: "member",
    invitedBy: "mem-you",
    invitedByName: "You",
    invitedAt: now - 1000 * 60 * 60 * 24,
    status: "pending",
    message: "Join to help on Issues board revamp!",
    avatarUrl: "https://img6.yna.co.kr/photo/etc/gt/2025/09/18/PGT20250918104001009_P4.jpg",
  },
  {
    id: "inv-toby",
    email: "toby@flowdash.dev",
    name: "뷔",
    role: "guest",
    invitedBy: "mem-alice",
    invitedByName: "Alice Kim",
    invitedAt: now - 1000 * 60 * 60 * 12,
    status: "pending",
    avatarUrl: "https://talkimg.imbc.com/TVianUpload/tvian/TViews/image/2025/09/11/4ef77d65-7e3d-48be-bc32-90e4bb851fe4.jpg",
  },
];

export const defaultPresence: MemberPresence[] = defaultMembers.map((member) => ({
  memberId: member.id,
  status: member.lastActiveAt > now - 1000 * 60 * 10 ? "online" : "away",
  lastSeenAt: member.lastActiveAt,
}));

export function createMemberMap(list: Member[]): Record<string, Member> {
  return list.reduce<Record<string, Member>>((acc, member) => {
    acc[member.id] = member;
    return acc;
  }, {});
}

export function createPresenceMap(list: MemberPresence[]): Record<string, MemberPresence> {
  return list.reduce<Record<string, MemberPresence>>((acc, presence) => {
    acc[presence.memberId] = presence;
    return acc;
  }, {});
}
