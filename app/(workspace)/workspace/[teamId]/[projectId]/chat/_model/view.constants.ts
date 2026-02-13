// app/(workspace)/workspace/[teamId]/[projectId]/chat/_model/view.constants.ts

import type { SlashCommand } from "./view.types";

export const CHAT_HEADER_ICON_BUTTON_CLASS =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-muted transition hover:border-border/70 hover:bg-subtle/60 hover:text-foreground";

export const CHAT_DEFAULT_EMOJIS = [
  "👍",
  "❤️",
  "😂",
  "🎉",
  "😮",
  "😢",
  "🔥",
  "🙏",
  "👏",
  "✅",
  "❗",
  "❓",
  "😎",
  "🤔",
  "🥳",
  "👀",
  "💯",
  "🌟",
  "🧡",
  "💡",
] as const;

export const CHAT_REACTION_EMOJIS = ["👍", "❤️", "🎉", "😂", "👀", "🔥", "👏", "😮"] as const;

export const CHAT_SLASH_COMMANDS: SlashCommand[] = [
  { id: "todo", label: "/todo", desc: "체크리스트 토글", insert: "- [ ] " },
  { id: "h1", label: "/h1", desc: "제목 1", insert: "# " },
  { id: "h2", label: "/h2", desc: "제목 2", insert: "## " },
  { id: "code", label: "/code", desc: "코드 블록", insert: "```\n\n```" },
  { id: "quote", label: "/quote", desc: "인용", insert: "> " },
  { id: "image", label: "/image", desc: "이미지 업로드", insert: "" },
];
