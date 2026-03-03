// app/(workspace)/workspace/[teamId]/[projectId]/chat/_model/shared/constants/storage.keys.ts
export const CHAT_STORAGE_KEYS = {
  CHANNELS: 'fd.chat.channels',
  WORKSPACES: 'fd.chat.workspaces',
  ACTIVE_WORKSPACE: 'fd.chat.workspace:active',
  MEMBERS: 'fd.chat.members',
  PINS: 'fd.chat.pins',
  TOPICS: 'fd.chat.topics',
  STATUS: 'fd.chat.status',
  LAST_READ: 'fd.chat.lastRead',
  ACTIVITY: 'fd.chat.activity',
  PINNED_CHANNELS: 'fd.chat.pinnedChannels',
  ARCHIVED_CHANNELS: 'fd.chat.archivedChannels',
  DM_ROOM_BY_CHANNEL: 'fd.chat.dmRoomByChannel',
} as const;
