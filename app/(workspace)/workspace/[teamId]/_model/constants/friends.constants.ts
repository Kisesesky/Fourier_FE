// app/(workspace)/workspace/[teamId]/_model/constants/friends.constants.ts
import type { FriendsTab } from "../types/view.types";

export const FRIEND_VIEW_TABS: Array<{ id: FriendsTab; label: string }> = [
  { id: "friends", label: "친구목록" },
  { id: "requests", label: "친구요청" },
  { id: "manage", label: "친구관리" },
];

export const FRIEND_SORT_OPTIONS = [
  { id: "recent", label: "최근 추가" },
  { id: "name", label: "이름순" },
] as const;
