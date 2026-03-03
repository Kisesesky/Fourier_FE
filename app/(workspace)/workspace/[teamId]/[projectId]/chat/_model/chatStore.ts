// app/(workspace)/workspace/[teamId]/[projectId]/chat/_model/chatStore.ts
import { create } from "zustand";
import { lsGet, lsSet } from "@/lib/persist";
import { sendChannelMessage, sendDmMessage, sendThreadMessage, getSavedMessages } from "../_service/api";
import { getChatSocket } from "@/lib/socket";
import {
  ARCHIVED_CHANNELS_KEY,
  FALLBACK_WORKSPACE_ID,
  LAST_READ_KEY,
  MSGS_KEY,
  PINNED_CHANNELS_KEY,
  PINS_KEY,
  SAVED_KEY,
} from "./chat-store/constants";
import { resolveDmRoomId } from "./chat-store/dm";
import { mapChannelMessage, sortMessages } from "./chat-store/messages";
import type { ChannelMessageResponse, HuddleState } from "./chat-store/types";
import { CHAT_BROADCAST_EVENTS, CHAT_SOCKET_EVENTS } from "./chat-store/constants/event.constants";
import { createHuddleActions } from "./chat-store/actions.huddle";
import { createThreadSearchActions } from "./chat-store/actions.thread-search";
import { createUserActions } from "./chat-store/actions.user";
import { createWorkspaceChannelActions } from "./chat-store/actions.workspace-channel";
import { createRealtimeActions } from "./chat-store/actions.realtime";

import type {
  Msg,
  Channel,
  Workspace,
  FileItem,
  ChannelActivity,
  PresenceState,
  ChatUser,
} from "./types";
export type {
  Attachment,
  ReactionMap,
  Msg,
  Channel,
  WorkspaceSectionType,
  WorkspaceSection,
  Workspace,
  FileItem,
  ChannelActivity,
  PresenceState,
  ChatUser,
} from "./types";

type State = {
  me: ChatUser;
  users: Record<string, ChatUser>;
  userStatus: Record<string, PresenceState>;

  teamId?: string;
  projectId?: string;

  workspaceId: string;
  workspaces: Workspace[];
  allChannels: Channel[];

  channelId: string;
  channels: Channel[];
  /** 채널 멤버십 (DM은 생략) */
  channelMembers: Record<string, string[]>;

  /** 채널 토픽/설정 */
  channelTopics: Record<string, { topic: string; muted?: boolean }>;
  pinnedChannelIds: string[];
  archivedChannelIds: string[];

  messages: Msg[];
  threadFor?: { rootId: string } | null;

  lastReadAt: Record<string, number>;
  channelActivity: Record<string, ChannelActivity>;
  typingUsers: Record<string, string[]>;
  pinnedByChannel: Record<string, string[]>;
  huddles: Record<string, HuddleState>;
  savedByUser: Record<string, string[]>;

  setContext: (teamId: string, projectId: string) => void;
  setMe: (user: ChatUser) => void;
  setUsers: (users: ChatUser[]) => void;
  loadChannels: () => Promise<void>;
  createWorkspace: (opts?: { name?: string; icon?: string; backgroundColor?: string; image?: string }) => Promise<void>;
  updateWorkspace: (id: string, patch: { name?: string; icon?: string; backgroundColor?: string; image?: string | null }) => void;
  deleteWorkspace: (id: string) => Promise<void>;
  setWorkspace: (id: string) => Promise<void>;
  setChannel: (id: string) => Promise<void>;
  refreshChannel: (id: string) => Promise<void>;
  toggleSectionCollapsed: (sectionId: string, value?: boolean) => void;
  toggleStar: (channelId: string) => void;
  togglePinnedChannel: (channelId: string) => void;
  toggleArchivedChannel: (channelId: string) => void;

  send: (text: string, files?: FileItem[], opts?: { parentId?: string | null; replyToId?: string | null; mentions?: string[] }) => Promise<void>;
  updateMessage: (id: string, patch: Partial<Pick<Msg, "text">>) => void;
  deleteMessage: (id: string) => { deleted?: Msg };
  restoreMessage: (msg: Msg) => void;

  toggleReaction: (id: string, emoji: string) => void;
  openThread: (rootId: string) => void;
  closeThread: () => void;

  setTyping: (typing: boolean) => void;
  markChannelRead: (id?: string, ts?: number) => void;
  markUnreadAt: (ts: number, channelId?: string) => void;
  markSeenUpTo: (ts: number, channelId?: string) => void;

  togglePin: (msgId: string) => void;
  startHuddle: (channelId?: string, mode?: 'audio' | 'video') => void;
  stopHuddle: (channelId?: string) => void;
  toggleHuddleMute: (channelId?: string) => void;
  toggleSave: (msgId: string) => void;
  setUserStatus: (userId: string, status: PresenceState) => void;
  addUser: (name: string, status?: PresenceState) => string;

  /** 검색 */
  getThread: (rootId: string) => { root?: Msg; replies: Msg[] };
  search: (q: string, opts?: { kind?: "all"|"messages"|"files"|"links" }) => Msg[];

  /** 채널 관리 */
  createChannel: (name: string, memberIds: string[], kind?: "text" | "voice" | "video") => Promise<string>; // returns channelId
  startGroupDM: (memberIds: string[], opts?: { name?: string }) => string | null;
  inviteToChannel: (channelId: string, memberIds: string[]) => void;

  /** 채널 토픽/설정 */
  setChannelTopic: (channelId: string, topic: string) => void;
  setChannelMuted: (channelId: string, muted: boolean) => void;

  updateChannelActivity: (channelId: string, messages?: Msg[]) => void;
  initRealtime: () => void;
};

let socketBound = false;
const localEchoIds = new Set<string>();

let bc: BroadcastChannel | null = null;

const DEFAULT_ME: ChatUser = { id: "me", name: "Me" };

/** ---------------- Store ---------------- */
export const useChat = create<State>((set, get) => ({
  me: DEFAULT_ME,
  users: {},
  userStatus: {},

  teamId: undefined,
  projectId: undefined,

  workspaceId: FALLBACK_WORKSPACE_ID,
  workspaces: [],
  allChannels: [],

  channelId: "",
  channels: [],
  channelMembers: {},

  channelTopics: {},
  pinnedChannelIds: lsGet<string[]>(PINNED_CHANNELS_KEY, []),
  archivedChannelIds: lsGet<string[]>(ARCHIVED_CHANNELS_KEY, []),

  messages: [],
  threadFor: null,

  lastReadAt: {},
  channelActivity: {},
  typingUsers: {},
  pinnedByChannel: lsGet<Record<string, string[]>>(PINS_KEY, {}),
  huddles: {},
  savedByUser: {},

  setContext: (teamId, projectId) => {
    set({ teamId, projectId });
    void get().loadChannels();
  },
  setMe: (user) => {
    const saved = lsGet<Record<string, string[]>>(SAVED_KEY(user.id), {});
    const pins = lsGet<Record<string, string[]>>(PINS_KEY, {});
    set({ me: user, savedByUser: saved, pinnedByChannel: pins });
    getSavedMessages()
      .then((ids) => {
        const next = { ...saved, [user.id]: ids };
        set({ savedByUser: next });
        lsSet(SAVED_KEY(user.id), next);
      })
      .catch(() => {});
  },
  setUsers: (users) => {
    const map = users.reduce<Record<string, ChatUser>>((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});
    set({ users: map });
  },
  ...createWorkspaceChannelActions({
    set: (partial) => set(partial as never),
    get: () => get(),
    getBroadcast: () => bc,
  }),

  send: async (text, files = [], opts) => {
    const { channelId } = get();
    if (!channelId) return;
    void files;
    let response: ChannelMessageResponse;
    try {
      response = opts?.parentId
        ? await sendThreadMessage(
            opts.parentId,
            text,
          )
        : channelId.startsWith("dm:")
          ? await (async () => {
              const roomId = await resolveDmRoomId(channelId, get().channelMembers, get().me.id);
              if (!roomId) {
                throw new Error("Failed to resolve DM room");
              }
              return sendDmMessage(roomId, text, {
                replyToMessageId: opts?.replyToId ?? undefined,
                fileIds: [],
              });
            })()
          : await sendChannelMessage(channelId, text, {
              replyToMessageId: opts?.replyToId ?? undefined,
              threadParentId: undefined,
            });
    } catch (error) {
      console.error("send message failed:", error);
      return;
    }
    const msg = mapChannelMessage(response, channelId, get().me.id);
    localEchoIds.add(msg.id);
    setTimeout(() => localEchoIds.delete(msg.id), 3000);
    const currentList = get().messages;
    if (currentList.some((m) => m.id === msg.id)) {
      get().updateChannelActivity(channelId, currentList);
      return;
    }
    let next = sortMessages([...currentList, msg]);
    if (opts?.parentId) {
      const rootId = opts.parentId;
      next = next.map((m) =>
        m.id === rootId
          ? { ...m, threadCount: (m.threadCount ?? 0) + 1 }
          : m
      );
    }
    set({ messages: next });
    lsSet(MSGS_KEY(channelId), next);
    get().updateChannelActivity(channelId, next);
    bc?.postMessage({ type: CHAT_BROADCAST_EVENTS.MESSAGE_NEW, msg, channelId });
  },

  updateMessage: (id, patch) => {
    const { channelId, messages, me } = get();
    const target = messages.find(m => m.id === id);
    if (!target || target.authorId !== me.id) return;
    const next = messages.map(m => m.id === id ? { ...m, ...patch, editedAt: Date.now() } : m);
    set({ messages: next });
    lsSet(MSGS_KEY(channelId), next);
    get().updateChannelActivity(channelId, next);
    bc?.postMessage({ type: CHAT_BROADCAST_EVENTS.MESSAGE_UPDATE, id, patch: { ...patch, editedAt: Date.now() }, channelId });
  },

  deleteMessage: (id) => {
    const { channelId, messages, me, pinnedByChannel } = get();
    const idx = messages.findIndex(m => m.id === id);
    if (idx < 0) return {};
    if (messages[idx].authorId !== me.id) return {};
    const deleted = messages[idx];
    let next = messages.filter(m => m.id !== id);

    if (deleted.parentId) {
      const rootIdx = next.findIndex(m => m.id === deleted.parentId);
      if (rootIdx >= 0) {
        const root = next[rootIdx];
        const n = Math.max(0, (root.threadCount || 1) - 1);
        next[rootIdx] = { ...root, threadCount: n };
      }
    }

    const pins = { ...(pinnedByChannel || {}) };
    if (pins[channelId]) pins[channelId] = pins[channelId].filter(mid => mid !== id);
    lsSet(PINS_KEY, pins);
    set({ messages: next, pinnedByChannel: pins });

    lsSet(MSGS_KEY(channelId), next);
    get().updateChannelActivity(channelId, next);
    bc?.postMessage({ type: CHAT_BROADCAST_EVENTS.MESSAGE_DELETE, id, channelId, deleted });
    bc?.postMessage({ type: CHAT_BROADCAST_EVENTS.PIN_SYNC, channelId, pins: pins[channelId] || [] });
    return { deleted };
  },

  restoreMessage: (msg) => {
    const { channelId, messages } = get();
    if (msg.channelId !== channelId) return;
    const next = [...messages, msg].sort((a,b)=> a.ts - b.ts);
    set({ messages: next });
    lsSet(MSGS_KEY(channelId), next);
    get().updateChannelActivity(channelId, next);
    bc?.postMessage({ type: CHAT_BROADCAST_EVENTS.MESSAGE_RESTORE, msg, channelId });
  },

  toggleReaction: (id, emoji) => {
    const { messages, channelId, me } = get();
    const next = messages.map(m => {
      if (m.id !== id) return m;
      const map = { ...(m.reactions || {}) };
      const setIds = new Set(map[emoji] || []);
      if (setIds.has(me.id)) setIds.delete(me.id); else setIds.add(me.id);
      if (setIds.size === 0) {
        delete map[emoji];
      } else {
        map[emoji] = Array.from(setIds);
      }
      return { ...m, reactions: map };
    });
    set({ messages: next });
    lsSet(MSGS_KEY(channelId), next);
    get().updateChannelActivity(channelId, next);
    bc?.postMessage({ type: CHAT_BROADCAST_EVENTS.MESSAGE_REACT, id, emoji, userId: me.id, channelId });
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const socket = getChatSocket(token);
    socket?.emit(CHAT_SOCKET_EVENTS.TOGGLE_REACTION, { messageId: id, emoji });
  },
  ...createThreadSearchActions({
    set: (partial) => set(partial as never),
    get: () => get(),
    broadcast: bc,
  }),

  markChannelRead: (id, ts) => {
    const ch = id || get().channelId;
    if (!ch) return;
    const now = Date.now();
    let nextTs = ts ?? 0;
    if (!nextTs) {
      const list = lsGet<Msg[]>(MSGS_KEY(ch), []);
      nextTs = list[list.length - 1]?.ts || 0;
    }
    nextTs = Math.max(now, nextTs);
    const next = { ...get().lastReadAt, [ch]: nextTs };
    set({ lastReadAt: next });
    lsSet(LAST_READ_KEY, next);
    get().updateChannelActivity(ch);
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const socket = getChatSocket(token);
    socket?.emit(CHAT_SOCKET_EVENTS.CHANNEL_READ, { channelId: ch });
  },

  markUnreadAt: (ts, ch) => {
    const channelId = ch || get().channelId;
    if (!channelId) return;
    const next = { ...get().lastReadAt, [channelId]: Math.max(0, ts - 1) };
    set({ lastReadAt: next });
    lsSet(LAST_READ_KEY, next);
    get().updateChannelActivity(channelId);
  },

  markSeenUpTo: (ts, ch) => {
    const { me } = get();
    const channelId = ch || get().channelId;
    if (!channelId) return;
    const list = lsGet<Msg[]>(MSGS_KEY(channelId), []);
    const next = list.map(m => {
      if (m.ts <= ts) {
        const seen = new Set(m.seenBy || []);
        seen.add(me.id);
        return { ...m, seenBy: Array.from(seen) };
      }
      return m;
    });
    lsSet(MSGS_KEY(channelId), next);
    set({ messages: next });
    get().updateChannelActivity(channelId, next);
    bc?.postMessage({ type: CHAT_BROADCAST_EVENTS.SEEN_UPDATE, channelId, userId: me.id, upTo: ts });
  },

  togglePin: (msgId) => {
    const { pinnedByChannel, channelId } = get();
    const pins = { ...(pinnedByChannel || {}) };
    const list = new Set(pins[channelId] || []);
    const wasPinned = list.has(msgId);
    if (wasPinned) list.delete(msgId); else list.add(msgId);
    pins[channelId] = Array.from(list);
    set({ pinnedByChannel: pins });
    lsSet(PINS_KEY, pins);
    bc?.postMessage({ type: CHAT_BROADCAST_EVENTS.PIN_SYNC, channelId, pins: pins[channelId] || [] });
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const socket = getChatSocket(token);
    if (socket && !channelId.startsWith("dm:")) {
      socket.emit(wasPinned ? CHAT_SOCKET_EVENTS.UNPIN_MESSAGE : CHAT_SOCKET_EVENTS.PIN_MESSAGE, { messageId: msgId });
    }
  },

  ...createHuddleActions({
    set: (partial) => set(partial as never),
    get: () => get(),
    broadcast: bc,
  }),

  toggleSave: (msgId) => {
    const { me } = get();
    const saved = { ...(get().savedByUser || {}) };
    const list = new Set(saved[me.id] || []);
    if (list.has(msgId)) list.delete(msgId); else list.add(msgId);
    saved[me.id] = Array.from(list);
    set({ savedByUser: saved });
    lsSet(SAVED_KEY(me.id), saved);
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const socket = getChatSocket(token);
    socket?.emit(CHAT_SOCKET_EVENTS.TOGGLE_SAVE_MESSAGE, { messageId: msgId });
  },
  ...createUserActions({
    set: (partial) => set(partial as never),
    get: () => get(),
  }),

  ...createRealtimeActions({
    set: (partial) => set(partial as never),
    get: () => get(),
    getSocketBound: () => socketBound,
    setSocketBound: (value) => { socketBound = value; },
    getBroadcast: () => bc,
    setBroadcast: (value) => { bc = value; },
    localEchoIds,
  }),
}));
