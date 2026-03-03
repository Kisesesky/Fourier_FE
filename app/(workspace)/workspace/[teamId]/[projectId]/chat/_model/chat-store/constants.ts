// app/(workspace)/workspace/[teamId]/[projectId]/chat/_model/chat-store/constants.ts
import { CHAT_STORAGE_KEYS } from '../shared/constants/storage.keys';
import {
  DEFAULT_HUDDLE_MEMBER_IDS,
  FALLBACK_WORKSPACE_ID,
  buildWorkspace,
  inferChannelKind,
  normalizeColor,
  parseDmParticipantIds,
} from './constants/domain.constants';

export { buildWorkspace, DEFAULT_HUDDLE_MEMBER_IDS, FALLBACK_WORKSPACE_ID, inferChannelKind, normalizeColor, parseDmParticipantIds };

export const CHANNELS_KEY = CHAT_STORAGE_KEYS.CHANNELS;
export const WORKSPACES_KEY = CHAT_STORAGE_KEYS.WORKSPACES;
export const ACTIVE_WORKSPACE_KEY = CHAT_STORAGE_KEYS.ACTIVE_WORKSPACE;
export const MEMBERS_KEY = CHAT_STORAGE_KEYS.MEMBERS;
export const PINS_KEY = CHAT_STORAGE_KEYS.PINS;
export const TOPICS_KEY = CHAT_STORAGE_KEYS.TOPICS;
export const STATUS_KEY = CHAT_STORAGE_KEYS.STATUS;
export const LAST_READ_KEY = CHAT_STORAGE_KEYS.LAST_READ;
export const ACTIVITY_KEY = CHAT_STORAGE_KEYS.ACTIVITY;
export const PINNED_CHANNELS_KEY = CHAT_STORAGE_KEYS.PINNED_CHANNELS;
export const ARCHIVED_CHANNELS_KEY = CHAT_STORAGE_KEYS.ARCHIVED_CHANNELS;
export const DM_ROOM_BY_CHANNEL_KEY = CHAT_STORAGE_KEYS.DM_ROOM_BY_CHANNEL;

export const MSGS_KEY = (id: string) => `fd.chat.messages:${id}`;
export const SAVED_KEY = (uid: string) => `fd.chat.saved:${uid}`;
