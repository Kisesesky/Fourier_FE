// lib/mocks/chat.ts

import type { Channel, Workspace, Msg } from "@/workspace/chat/_model/types";
import { defaultMembers } from "@/workspace/members/_model/mocks";

export const DEFAULT_WORKSPACE_ID = "ws-default";
export const DEFAULT_WORKSPACE_NAME = "Acme";
export const DEFAULT_STARRED_SECTION_ID = "sec-starred";
export const DEFAULT_CHANNEL_SECTION_ID = "sec-channels";
export const DEFAULT_DM_SECTION_ID = "sec-dms";

const seedMembers = defaultMembers.slice(0, 3);
const seedMemberIds = seedMembers.map((member) => member.id);
const primaryAuthor = seedMembers[1] ?? seedMembers[0] ?? { id: "mem-default-a", name: "Alice" };
const secondaryAuthor = seedMembers[2] ?? seedMembers[0] ?? { id: "mem-default-b", name: "Bob" };

export const defaultChannels: Channel[] = [
  { id: "general", name: "# general", workspaceId: DEFAULT_WORKSPACE_ID },
  { id: "random", name: "# random", workspaceId: DEFAULT_WORKSPACE_ID },
];

export const defaultChannelMembers: Record<string, string[]> = {
  general: seedMemberIds,
  random: seedMemberIds,
};

export const defaultChannelTopics: Record<string, { topic: string; muted?: boolean }> = {
  general: { topic: "팀 공지 & 운영 메모" },
  random: { topic: "밈/휴식/추천" },
};

export function createDefaultMessages(baseTs: number): Record<string, Msg[]> {
  return {
    general: [
      {
        id: "1",
        channelId: "general",
        author: primaryAuthor.name,
        authorId: primaryAuthor.id,
        text: "Welcome to #general!",
        ts: baseTs,
        seenBy: [primaryAuthor.id],
      },
      {
        id: "2",
        channelId: "general",
        author: secondaryAuthor.name,
        authorId: secondaryAuthor.id,
        text: "워크시트 대시보드 초안 확인했나요? https://flowdash.dev/demo",
        ts: baseTs + 5000,
        seenBy: [secondaryAuthor.id],
      },
      {
        id: "3",
        channelId: "general",
        author: primaryAuthor.name,
        authorId: primaryAuthor.id,
        text: "```ts\nexport const add = (a:number,b:number)=>a+b\n```",
        ts: baseTs + 9000,
        seenBy: [primaryAuthor.id],
      },
    ],
    random: [],
  };
}

export function createDefaultWorkspace(channels: Channel[]): Workspace {
  const sectionChannels = channels
    .filter((channel) => !channel.isDM && channel.workspaceId === DEFAULT_WORKSPACE_ID)
    .map((channel) => channel.id);

  return {
    id: DEFAULT_WORKSPACE_ID,
    name: DEFAULT_WORKSPACE_NAME,
    sections: [
      { id: DEFAULT_STARRED_SECTION_ID, title: "Starred", type: "starred", itemIds: [], collapsed: false },
      { id: DEFAULT_CHANNEL_SECTION_ID, title: "Channels", type: "channels", itemIds: sectionChannels, collapsed: false },
      { id: DEFAULT_DM_SECTION_ID, title: "Direct Messages", type: "dms", itemIds: [], collapsed: false },
    ],
  };
}
