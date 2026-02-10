// app/(workspace)/workspace/[teamId]/_components/floating-dm/floating-dm.constants.ts

export const FLOATING_DM_STORAGE_KEYS = {
  recents: "friends:dm:recents",
  unread: "friends:dm:unread",
  read: "friends:dm:read",
  floatingPos: "friends:dm:floating:pos",
  floatingHidden: "friends:dm:floating:hidden",
} as const;

export const FLOATING_DM_EMOJIS = ["😀", "😂", "😍", "👍", "🎉", "🔥", "🥳", "😅", "😎", "🙏"] as const;

export const FLOATING_DM_FILE_TYPE_OPTIONS = [
  { value: "", label: "전체" },
  { value: "image", label: "이미지" },
  { value: "doc", label: "문서" },
  { value: "video", label: "비디오" },
  { value: "link", label: "링크" },
] as const;
