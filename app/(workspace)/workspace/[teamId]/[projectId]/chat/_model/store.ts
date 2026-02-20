// app/(workspace)/workspace/[teamId]/[projectId]/chat/_model/store.ts
import { create } from "zustand";
import { lsGet, lsSet } from "@/lib/persist";
import { listChannels, listMessages, sendChannelMessage, sendDmMessage, getOrCreateDmRoom, sendThreadMessage, listProjectMembers, getChannelPreferences, saveChannelPreferences, getPinnedMessages, getSavedMessages, createChannel as createChannelApi } from "../_service/api";
import { getChatSocket } from "@/lib/socket";

import type {
  Msg,
  Channel,
  WorkspaceSection,
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

type HuddleState = {
  active: boolean;
  startedAt?: number;
  muted?: boolean;
  members?: string[];
};

const DEFAULT_HUDDLE_MEMBER_IDS: string[] = [];

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
  startHuddle: (channelId?: string) => void;
  stopHuddle: (channelId?: string) => void;
  toggleHuddleMute: (channelId?: string) => void;
  toggleSave: (msgId: string) => void;
  setUserStatus: (userId: string, status: PresenceState) => void;
  addUser: (name: string, status?: PresenceState) => string;

  /** 검색 */
  getThread: (rootId: string) => { root?: Msg; replies: Msg[] };
  search: (q: string, opts?: { kind?: "all"|"messages"|"files"|"links" }) => Msg[];

  /** 채널 관리 */
  createChannel: (name: string, memberIds: string[]) => Promise<string>; // returns channelId
  startGroupDM: (memberIds: string[], opts?: { name?: string }) => string | null;
  inviteToChannel: (channelId: string, memberIds: string[]) => void;

  /** 채널 토픽/설정 */
  setChannelTopic: (channelId: string, topic: string) => void;
  setChannelMuted: (channelId: string, muted: boolean) => void;

  updateChannelActivity: (channelId: string, messages?: Msg[]) => void;
  initRealtime: () => void;
};

/** ---------------- Local Keys ---------------- */
const CHANNELS_KEY = "fd.chat.channels";
const WORKSPACES_KEY = "fd.chat.workspaces";
const ACTIVE_WORKSPACE_KEY = "fd.chat.workspace:active";
const MEMBERS_KEY = "fd.chat.members";

const normalizeColor = (value?: string) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const withoutHash = trimmed.replace(/^#/, "");
  if (!withoutHash) return undefined;
  return `#${withoutHash}`;
};
const MSGS_KEY = (id: string) => `fd.chat.messages:${id}`;
const PINS_KEY = "fd.chat.pins";
const SAVED_KEY = (uid: string) => `fd.chat.saved:${uid}`;
const TOPICS_KEY = "fd.chat.topics";
const STATUS_KEY = "fd.chat.status";
const LAST_READ_KEY = "fd.chat.lastRead";
const ACTIVITY_KEY = "fd.chat.activity";
const PINNED_CHANNELS_KEY = "fd.chat.pinnedChannels";
const ARCHIVED_CHANNELS_KEY = "fd.chat.archivedChannels";
const DM_ROOM_BY_CHANNEL_KEY = "fd.chat.dmRoomByChannel";

const sortMessages = (list: Msg[]) =>
  [...list].sort((a, b) => {
    if (a.ts !== b.ts) return a.ts - b.ts;
    return a.id.localeCompare(b.id);
  });

const decodeHtmlEntities = (input?: string | null) => {
  let next = input ?? "";
  for (let i = 0; i < 5; i += 1) {
    const decoded = next
      .replace(/&(amp);?/gi, "&")
      .replace(/&(quot|quote);?/gi, '"')
      .replace(/&(apos);?/gi, "'")
      .replace(/&#x27;?/gi, "'")
      .replace(/&#39;?/gi, "'")
      .replace(/&(lt);?/gi, "<")
      .replace(/&(gt);?/gi, ">");
    if (decoded === next) break;
    next = decoded;
  }
  return next;
};

const normalizeMsgEntities = (msg: Msg): Msg => ({
  ...msg,
  text: decodeHtmlEntities(msg.text),
  reply: msg.reply
    ? {
        ...msg.reply,
        content: decodeHtmlEntities(msg.reply.content),
      }
    : undefined,
});

const normalizeMsgListEntities = (list: Msg[]) => list.map(normalizeMsgEntities);

let socketBound = false;
const localEchoIds = new Set<string>();

let bc: BroadcastChannel | null = null;

const DEFAULT_ME: ChatUser = { id: "me", name: "Me" };
const FALLBACK_WORKSPACE_ID = "workspace";

const parseDmParticipantIds = (channelId: string): string[] => {
  const raw = channelId.startsWith("dm:") ? channelId.slice(3) : channelId;
  if (!raw) return [];
  return raw.split("+").map((item) => item.trim()).filter(Boolean);
};

const resolveDmRoomId = async (
  channelId: string,
  channelMembers: Record<string, string[]>,
  meId: string,
): Promise<string | null> => {
  if (!channelId.startsWith("dm:")) return null;
  const raw = channelId.slice(3).trim();
  if (!raw) return null;

  const cached = lsGet<Record<string, string>>(DM_ROOM_BY_CHANNEL_KEY, {});
  const cachedRoomId = cached[channelId];
  if (cachedRoomId) return cachedRoomId;

  const fromMembers = (channelMembers[channelId] || []).filter((id) => id && id !== meId);
  const fromChannelId = parseDmParticipantIds(channelId).filter((id) => id !== meId);
  const participantIds = Array.from(new Set([...(fromMembers.length > 0 ? fromMembers : fromChannelId)]));

  if (participantIds.length > 0) {
    try {
      const room = await getOrCreateDmRoom(participantIds);
      if (!room?.id) return null;
      lsSet(DM_ROOM_BY_CHANNEL_KEY, { ...cached, [channelId]: room.id });
      return room.id;
    } catch {
      // fallback below
    }
  }

  return raw;
};

const buildWorkspace = (id: string, channels: Channel[]): Workspace => ({
  id,
  name: "Project Chat",
  sections: [
    { id: `${id}:starred`, title: "Starred", type: "starred", itemIds: [], collapsed: false },
    { id: `${id}:channels`, title: "Channels", type: "channels", itemIds: channels.map((ch) => ch.id), collapsed: false },
    { id: `${id}:dms`, title: "Direct Messages", type: "dms", itemIds: [], collapsed: false },
  ],
});

/** ---------------- Helpers ---------------- */
function hasLink(text: string) {
  return /(https?:\/\/[^\s]+)/i.test(text || "");
}

function summarizeMessage(msg?: Msg) {
  if (!msg) return "";
  if (msg.text && msg.text.trim().length > 0) {
    return msg.text.replace(/\s+/g, " ").trim().slice(0, 80);
  }
  if (msg.attachments && msg.attachments.length > 0) {
    const count = msg.attachments.length;
    return count === 1 ? "1 attachment" : String(count) + " attachments";
  }
  return "";
}

type ChannelMessageResponse = {
  id: string;
  content?: string;
  senderId: string;
  sender?: { id: string; name: string; avatar?: string };
  reply?: { id: string; content?: string; sender: { id: string; name: string; avatar?: string }; isDeleted: boolean };
  createdAt: string;
  editedAt?: string;
  threadParentId?: string;
  thread?: { count: number };
  reactions?: Array<{ emoji: string; count: number; reactedByMe?: boolean }>;
  mentions?: string[];
};

const mapReactions = (
  reactions: Array<{ emoji: string; count: number; reactedByMe?: boolean }> | undefined,
  meId: string,
) => {
  if (!reactions || reactions.length === 0) return undefined;
  const out: Record<string, string[]> = {};
  reactions.forEach((r) => {
    const count = Math.max(0, r.count || 0);
    if (count === 0) return;
    const ids: string[] = [];
    if (r.reactedByMe) ids.push(meId);
    const fill = count - (r.reactedByMe ? 1 : 0);
    for (let i = 0; i < fill; i += 1) {
      ids.push(`anon-${r.emoji}-${i}`);
    }
    out[r.emoji] = ids;
  });
  return Object.keys(out).length > 0 ? out : undefined;
};

const mapChannelMessage = (message: ChannelMessageResponse, channelId: string, meId: string): Msg => ({
  id: message.id,
  author: message.sender?.name ?? "Unknown",
  authorId: message.senderId,
  text: decodeHtmlEntities(message.content),
  ts: message.createdAt ? Date.parse(message.createdAt) : Date.now(),
  editedAt: message.editedAt ? Date.parse(message.editedAt) : undefined,
  channelId,
  reply: message.reply
    ? {
        id: message.reply.id,
        content: decodeHtmlEntities(message.reply.content),
        sender: {
          id: message.reply.sender?.id,
          name: message.reply.sender?.name ?? "Unknown",
          avatar: message.reply.sender?.avatar,
        },
        isDeleted: message.reply.isDeleted,
      }
    : undefined,
  parentId: message.threadParentId ?? undefined,
  threadCount: message.thread?.count ?? undefined,
  reactions: mapReactions(message.reactions, meId),
  mentions: message.mentions ?? undefined,
});

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
  loadChannels: async () => {
    const { projectId, teamId } = get();
    if (!projectId) return;
    let channelList: Channel[] = [];
    let members: Array<{
      userId: string;
      name: string;
      displayName?: string;
      role?: "owner" | "manager" | "member" | "guest";
      avatarUrl?: string | null;
      backgroundImageUrl?: string | null;
    }> = [];
    let preferences: { pinnedChannelIds: string[]; archivedChannelIds: string[] } = {
      pinnedChannelIds: [],
      archivedChannelIds: [],
    };
    try {
      [channelList, members, preferences] = await Promise.all([
        listChannels(projectId),
        teamId ? listProjectMembers(teamId, projectId).catch(() => []) : Promise.resolve([]),
        getChannelPreferences(projectId).catch(() => ({ pinnedChannelIds: [], archivedChannelIds: [] })),
      ]);
    } catch {
      channelList = [];
      members = [];
      preferences = { pinnedChannelIds: [], archivedChannelIds: [] };
    }
    const workspaceId = projectId;
    const serverChannels = channelList.map((ch) => ({ ...ch, workspaceId }));
    const persistedChannels = lsGet<Channel[]>(CHANNELS_KEY, []);
    const persistedDmChannels = persistedChannels
      .filter((ch) => (ch.isDM || ch.id.startsWith("dm:")) && ch.workspaceId === workspaceId)
      .map((ch) => ({ ...ch, isDM: true, workspaceId }));
    const channelsById = new Map<string, Channel>();
    serverChannels.forEach((channel) => channelsById.set(channel.id, channel));
    persistedDmChannels.forEach((channel) => {
      if (!channelsById.has(channel.id)) channelsById.set(channel.id, channel);
    });
    const channels = Array.from(channelsById.values());
    const dmIds = channels.filter((ch) => ch.isDM || ch.id.startsWith("dm:")).map((ch) => ch.id);
    const workspaces = [buildWorkspace(workspaceId, serverChannels)];
    workspaces[0].sections = workspaces[0].sections.map((section) =>
      section.type === "dms" ? { ...section, itemIds: dmIds } : section
    );
    const persistedMembers = lsGet<Record<string, string[]>>(MEMBERS_KEY, {});
    const mergedMembers: Record<string, string[]> = {
      ...persistedMembers,
      ...get().channelMembers,
    };
    set({
      workspaces,
      allChannels: channels,
      workspaceId,
      channels,
      channelMembers: mergedMembers,
      pinnedChannelIds: preferences.pinnedChannelIds ?? [],
      archivedChannelIds: preferences.archivedChannelIds ?? [],
    });
    lsSet(CHANNELS_KEY, channels);
    lsSet(MEMBERS_KEY, mergedMembers);
    if (members.length > 0) {
      const userMap = members.reduce<Record<string, ChatUser>>((acc, member) => {
        acc[member.userId] = {
          id: member.userId,
          name: member.name,
          displayName: member.displayName ?? member.name,
          role: member.role,
          avatarUrl: member.avatarUrl ?? undefined,
          backgroundImageUrl: member.backgroundImageUrl ?? undefined,
        };
        return acc;
      }, {});
      set({ users: userMap });
    }
    channels.forEach((ch) => get().updateChannelActivity(ch.id));
    if (channels.length === 0) {
      set({ channelId: "", messages: [], threadFor: null });
      return;
    }
    const current = get().channelId;
    const exists = channels.some((c) => c.id === current);
    if (!exists) {
      await get().setChannel(channels[0].id);
    } else {
      await get().setChannel(current);
    }
  },

  createWorkspace: async (opts) => {
    const { name, icon, backgroundColor, image } = opts || {};
    const state = get();
    const id = `ws-${Math.random().toString(36).slice(2, 8)}`;
    const label =
      name?.trim() && name.trim().length > 0
        ? name.trim()
        : `Server ${state.workspaces.length + 1}`;
    const parsedIcon = icon?.trim()
      ? Array.from(icon.trim()).slice(0, 2).join("")
      : undefined;
    const parsedColor = normalizeColor(backgroundColor);
    const parsedImage = image?.trim() ? image.trim() : undefined;
    const generalChannelId = `general-${id}`;
    const newWorkspace: Workspace = {
      id,
      name: label,
      icon: parsedIcon,
      backgroundColor: parsedColor,
      image: parsedImage,
      sections: [
        { id: `sec-${id}-starred`, title: "Starred", type: "starred", itemIds: [], collapsed: false },
        { id: `sec-${id}-channels`, title: "Channels", type: "channels", itemIds: [generalChannelId], collapsed: false },
        { id: `sec-${id}-dms`, title: "Direct Messages", type: "dms", itemIds: [], collapsed: false },
      ],
    };
    const generalChannel: Channel = {
      id: generalChannelId,
      name: "# general",
      workspaceId: id,
      createdAt: new Date().toISOString(),
    };
    const workspaces = [...state.workspaces, newWorkspace];
    const allChannels = [...state.allChannels, generalChannel];
    const channelMembers = { ...state.channelMembers, [generalChannelId]: [] };

    lsSet(WORKSPACES_KEY, workspaces);
    lsSet(CHANNELS_KEY, allChannels);
    lsSet(ACTIVE_WORKSPACE_KEY, id);

    set({ workspaces, allChannels, channelMembers });
    lsSet(MEMBERS_KEY, channelMembers);
    await get().setWorkspace(id);
  },
  updateWorkspace: (id, patch) => {
    const state = get();
    const target = state.workspaces.find(ws => ws.id === id);
    if (!target) return;
    const updated: Workspace = {
      ...target,
      ...(patch.name !== undefined ? { name: patch.name.trim() || target.name } : {}),
      ...(patch.icon !== undefined ? { icon: patch.icon?.trim() || undefined } : {}),
      ...(patch.backgroundColor !== undefined ? { backgroundColor: normalizeColor(patch.backgroundColor) } : {}),
      ...(patch.image !== undefined ? { image: patch.image || undefined } : {}),
    };
    const workspaces = state.workspaces.map(ws => ws.id === id ? updated : ws);
    lsSet(WORKSPACES_KEY, workspaces);
    set({ workspaces });
  },
  deleteWorkspace: async (id) => {
    const state = get();
    if (state.workspaces.length === 0) return;
    const exists = state.workspaces.some(ws => ws.id === id);
    if (!exists) return;
    const channelsToRemove = new Set(state.allChannels.filter(ch => ch.workspaceId === id).map(ch => ch.id));
    let workspaces = state.workspaces.filter(ws => ws.id !== id);
    let allChannels = state.allChannels.filter(ch => ch.workspaceId !== id);
    let channelMembers = { ...state.channelMembers };
    let channelTopics = { ...state.channelTopics };
    let channelActivity = { ...state.channelActivity };
    let typingUsers = { ...state.typingUsers };
    let pinnedByChannel = { ...state.pinnedByChannel };
    channelsToRemove.forEach((channelId) => {
      delete channelMembers[channelId];
      delete channelTopics[channelId];
      delete channelActivity[channelId];
      delete typingUsers[channelId];
      delete pinnedByChannel[channelId];
      lsSet(MSGS_KEY(channelId), []);
    });
    lsSet(MEMBERS_KEY, channelMembers);
    lsSet(TOPICS_KEY, channelTopics);
    lsSet(CHANNELS_KEY, allChannels);
    let nextWorkspaceId = state.workspaceId;
    if (state.workspaceId === id) {
      nextWorkspaceId = workspaces[0]?.id ?? "";
    }
    if (workspaces.length === 0) {
      set({
        workspaces: [],
        allChannels: [],
        workspaceId: FALLBACK_WORKSPACE_ID,
        channels: [],
        channelMembers,
        channelTopics,
        channelActivity,
        typingUsers,
        pinnedByChannel,
      });
      return;
    }
    lsSet(WORKSPACES_KEY, workspaces);
    set({
      workspaces,
      allChannels,
      channelMembers,
      channelTopics,
      channelActivity,
      typingUsers,
      pinnedByChannel,
    });
    if (state.workspaceId === id) {
      await get().setWorkspace(nextWorkspaceId);
    } else {
      const currentChannels = allChannels.filter((ch) => ch.workspaceId === state.workspaceId);
      set({ channels: currentChannels });
    }
  },

  setWorkspace: async (id) => {
    const wsList = get().workspaces;
    const target = wsList.find(ws => ws.id === id);
    if (!target) return;

    const workspaces = lsGet<Workspace[]>(WORKSPACES_KEY, wsList);
    const allChannels = lsGet<Channel[]>(CHANNELS_KEY, []);
    const channels = allChannels.filter(c => c.workspaceId === id);
    lsSet(ACTIVE_WORKSPACE_KEY, id);
    set({ workspaceId: id, channels, allChannels, workspaces });
    channels.forEach(ch => get().updateChannelActivity(ch.id));

    if (channels.length === 0) {
      set({ channelId: "", messages: [], threadFor: null });
      return;
    }

    const current = get().channelId;
    const exists = channels.some(c => c.id === current);
    if (!exists) {
      await get().setChannel(channels[0].id);
    } else {
      const list = lsGet<Msg[]>(MSGS_KEY(current), []);
      set({ messages: list });
      get().updateChannelActivity(current, list);
    }
  },

  setChannel: async (id) => {
    // DM
    if (id.startsWith("dm:")) {
      const raw = id.slice(3);
      const meId = get().me.id;
      const users = get().users;
      const otherIds = raw ? raw.split("+").filter(Boolean) : [];
      const participants = Array.from(new Set([meId, ...otherIds]));
      const workspaceId = get().workspaceId || FALLBACK_WORKSPACE_ID;

      let displayName: string;
      if (otherIds.length <= 1) {
        const target = otherIds[0] ?? raw;
        const user = users[target];
        displayName = user ? user.name : target || "Direct Message";
      } else {
        const names = otherIds.map(uid => users[uid]?.name || uid);
        displayName = names.join(", ");
      }

      let allChannels = get().allChannels;
      let channels = get().channels;
      let workspaces = get().workspaces;

      const existing = allChannels.find(c => c.id === id);
      if (!existing) {
        const dmChannel: Channel = { id, name: displayName, isDM: true, workspaceId, createdAt: new Date().toISOString() };
        allChannels = [...allChannels, dmChannel];
        if (!channels.some(c => c.id === id) && workspaceId === dmChannel.workspaceId) {
          channels = [...channels, dmChannel];
        }
      } else if (existing.name !== displayName || !existing.isDM) {
        allChannels = allChannels.map(c => c.id === id ? { ...c, name: displayName, isDM: true } : c);
        channels = channels.map(c => c.id === id ? { ...c, name: displayName, isDM: true } : c);
      }
      lsSet(CHANNELS_KEY, allChannels);

      const memberMap = { ...get().channelMembers, [id]: participants };
      lsSet(MEMBERS_KEY, memberMap);

      let workspacesChanged = false;
      workspaces = workspaces.map(ws => {
        if (ws.id !== workspaceId) return ws;
        let changed = false;
        const sections = ws.sections.map(sec => {
          if (sec.type !== "dms") return sec;
          if (sec.itemIds.includes(id)) return sec;
          changed = true;
          return { ...sec, itemIds: [...sec.itemIds, id] };
        });
        if (changed) {
          workspacesChanged = true;
          return { ...ws, sections };
        }
        return ws;
      });
      if (workspacesChanged) {
        lsSet(WORKSPACES_KEY, workspaces);
      }

      set({ allChannels, channels, workspaces, channelMembers: memberMap });

      const list = normalizeMsgListEntities(lsGet<Msg[]>(MSGS_KEY(id), []));
      if (list.length === 0) {
        lsSet(MSGS_KEY(id), list);
      }
      set({ channelId: id, messages: list, threadFor: null });
      get().updateChannelActivity(id, list);
      bc?.postMessage({ type: "channel:set", id });
      return;
    }

    let mapped: Msg[] = [];
    try {
      const list = await listMessages(id);
      mapped = sortMessages(list.map((message) => mapChannelMessage(message, id, get().me.id)));
    } catch {
      mapped = [];
    }
    getPinnedMessages(id)
      .then((ids) => {
        const pins = { ...(get().pinnedByChannel || {}) };
        pins[id] = ids;
        set({ pinnedByChannel: pins });
        lsSet(PINS_KEY, pins);
      })
      .catch(() => {});
    set({ channelId: id, messages: mapped, threadFor: null });
    lsSet(MSGS_KEY(id), mapped);
    get().updateChannelActivity(id, mapped);
    bc?.postMessage({ type: "channel:set", id });
  },

  refreshChannel: async (id) => {
    if (!id || id.startsWith("dm:")) return;
    let mapped: Msg[] = [];
    try {
      const list = await listMessages(id);
      mapped = sortMessages(list.map((message) => mapChannelMessage(message, id, get().me.id)));
    } catch {
      mapped = [];
    }
    const currentId = get().channelId;
    if (currentId === id) {
      const cur = get().messages;
      const curLast = cur[cur.length - 1]?.id;
      const nextLast = mapped[mapped.length - 1]?.id;
      if (curLast !== nextLast || cur.length !== mapped.length) {
        set({ messages: mapped });
      }
      lsSet(MSGS_KEY(id), mapped);
      get().updateChannelActivity(id, mapped);
    } else {
      lsSet(MSGS_KEY(id), mapped);
      get().updateChannelActivity(id, mapped);
    }
  },

  toggleSectionCollapsed: (sectionId, value) => {
    const workspaceId = get().workspaceId;
    let workspaces = get().workspaces;
    let dirty = false;

    workspaces = workspaces.map(ws => {
      if (ws.id !== workspaceId) return ws;
      const sections = ws.sections.map(sec => {
        if (sec.id !== sectionId) return sec;
        dirty = true;
        const next = value === undefined ? !sec.collapsed : value;
        return { ...sec, collapsed: next };
      });
      return dirty ? { ...ws, sections } : ws;
    });

    if (!dirty) return;
    set({ workspaces });
    lsSet(WORKSPACES_KEY, workspaces);
  },

  toggleStar: (channelId) => {
    const workspaceId = get().workspaceId;
    if (!workspaceId) return;
    let workspaces = get().workspaces;
    let changed = false;

    workspaces = workspaces.map(ws => {
      if (ws.id !== workspaceId) return ws;
      let sections = ws.sections;
      let starredIndex = sections.findIndex(sec => sec.type === "starred");
      if (starredIndex < 0) {
        const newSection: WorkspaceSection = {
          id: `sec-starred-${workspaceId}`,
          title: "Starred",
          type: "starred",
          itemIds: [],
          collapsed: false,
        };
        sections = [newSection, ...sections];
        starredIndex = 0;
      }
      const starred = sections[starredIndex];
      const has = starred.itemIds.includes(channelId);
      const itemIds = has
        ? starred.itemIds.filter(id => id !== channelId)
        : [...starred.itemIds, channelId];
      sections = sections.map((sec, idx) => (idx === starredIndex ? { ...sec, itemIds } : sec));
      changed = true;
      return { ...ws, sections };
    });

    if (!changed) return;
    set({ workspaces });
    lsSet(WORKSPACES_KEY, workspaces);
  },

  togglePinnedChannel: (channelId) => {
    const pinned = new Set(get().pinnedChannelIds);
    const archived = new Set(get().archivedChannelIds);
    if (pinned.has(channelId)) {
      pinned.delete(channelId);
    } else {
      pinned.add(channelId);
      archived.delete(channelId);
    }
    const pinnedList = Array.from(pinned);
    const archivedList = Array.from(archived);
    set({ pinnedChannelIds: pinnedList, archivedChannelIds: archivedList });
    lsSet(PINNED_CHANNELS_KEY, pinnedList);
    lsSet(ARCHIVED_CHANNELS_KEY, archivedList);
    const projectId = get().projectId;
    if (projectId) {
      saveChannelPreferences(projectId, { pinnedChannelIds: pinnedList, archivedChannelIds: archivedList }).catch(() => {});
    }
  },

  toggleArchivedChannel: (channelId) => {
    const archived = new Set(get().archivedChannelIds);
    const pinned = new Set(get().pinnedChannelIds);
    if (archived.has(channelId)) {
      archived.delete(channelId);
    } else {
      archived.add(channelId);
      pinned.delete(channelId);
    }
    const archivedList = Array.from(archived);
    const pinnedList = Array.from(pinned);
    set({ archivedChannelIds: archivedList, pinnedChannelIds: pinnedList });
    lsSet(ARCHIVED_CHANNELS_KEY, archivedList);
    lsSet(PINNED_CHANNELS_KEY, pinnedList);
    const projectId = get().projectId;
    if (projectId) {
      saveChannelPreferences(projectId, { pinnedChannelIds: pinnedList, archivedChannelIds: archivedList }).catch(() => {});
    }
  },

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
    bc?.postMessage({ type: "message:new", msg, channelId });
  },

  updateMessage: (id, patch) => {
    const { channelId, messages, me } = get();
    const target = messages.find(m => m.id === id);
    if (!target || target.authorId !== me.id) return;
    const next = messages.map(m => m.id === id ? { ...m, ...patch, editedAt: Date.now() } : m);
    set({ messages: next });
    lsSet(MSGS_KEY(channelId), next);
    get().updateChannelActivity(channelId, next);
    bc?.postMessage({ type: "message:update", id, patch: { ...patch, editedAt: Date.now() }, channelId });
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
    bc?.postMessage({ type: "message:delete", id, channelId, deleted });
    bc?.postMessage({ type: "pin:sync", channelId, pins: pins[channelId] || [] });
    return { deleted };
  },

  restoreMessage: (msg) => {
    const { channelId, messages } = get();
    if (msg.channelId !== channelId) return;
    const next = [...messages, msg].sort((a,b)=> a.ts - b.ts);
    set({ messages: next });
    lsSet(MSGS_KEY(channelId), next);
    get().updateChannelActivity(channelId, next);
    bc?.postMessage({ type: "message:restore", msg, channelId });
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
    bc?.postMessage({ type: "message:react", id, emoji, userId: me.id, channelId });
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const socket = getChatSocket(token);
    socket?.emit("toggle-reaction", { messageId: id, emoji });
  },

  openThread: (rootId) => set({ threadFor: { rootId } }),
  closeThread: () => set({ threadFor: null }),

  setTyping: (typing) => {
    const { channelId, me } = get();
    bc?.postMessage({ type: "typing", channelId, user: me.name, typing });
  },

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
    socket?.emit("channel.read", { channelId: ch });
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
    bc?.postMessage({ type: "seen:update", channelId, userId: me.id, upTo: ts });
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
    bc?.postMessage({ type: "pin:sync", channelId, pins: pins[channelId] || [] });
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const socket = getChatSocket(token);
    if (socket && !channelId.startsWith("dm:")) {
      socket.emit(wasPinned ? "unpin-message" : "pin-message", { messageId: msgId });
    }
  },

  startHuddle: (ch) => {
    const channelId = ch || get().channelId;
    const curr = get().huddles;
    const { me } = get();
    const fallbackMembers =
      DEFAULT_HUDDLE_MEMBER_IDS.length > 0 ? DEFAULT_HUDDLE_MEMBER_IDS : [me.id];
    const hs: Record<string,HuddleState> = {
      ...curr,
      [channelId]: { active: true, startedAt: Date.now(), muted: false, members: fallbackMembers },
    };
    set({ huddles: hs });
    bc?.postMessage({ type: "huddle:state", channelId, state: hs[channelId] });
  },

  stopHuddle: (ch) => {
    const channelId = ch || get().channelId;
    const curr = get().huddles;
    const hs: Record<string,HuddleState> = { ...curr, [channelId]: { active: false } };
    set({ huddles: hs });
    bc?.postMessage({ type: "huddle:state", channelId, state: hs[channelId] });
  },

  toggleHuddleMute: (ch) => {
    const channelId = ch || get().channelId;
    const curr = get().huddles[channelId] || { active: false };
    const next = { ...curr, muted: !curr.muted };
    const hs: Record<string,HuddleState> = { ...get().huddles, [channelId]: next };
    set({ huddles: hs });
    bc?.postMessage({ type: "huddle:state", channelId, state: next });
  },

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
    socket?.emit("toggle-save-message", { messageId: msgId });
  },
  setUserStatus: (userId, status) => {
    const next = { ...get().userStatus, [userId]: status };
    set({ userStatus: next });
    lsSet(STATUS_KEY, next);
  },
  addUser: (name, status = "offline") => {
    const trimmed = name.trim();
    const base = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const idRoot = base || `mem-${Date.now()}`;
    let candidate = idRoot;
    let counter = 1;
    const currentUsers = get().users;
    while (currentUsers[candidate]) {
      candidate = `${idRoot}-${counter++}`;
    }
    const label = trimmed || candidate;
    const users = { ...currentUsers, [candidate]: { id: candidate, name: label } };
    const statusMap = { ...get().userStatus, [candidate]: status };
    set({ users, userStatus: statusMap });
    lsSet(STATUS_KEY, statusMap);
    return candidate;
  },

  getThread: (rootId) => {
    const all = get().messages;
    const root = all.find(m => m.id === rootId);
    const replies = all.filter(m => m.parentId === rootId).sort((a,b)=> a.ts - b.ts);
    return { root, replies };
  },

  search: (q, opts) => {
    const kind = opts?.kind || "all";
    const text = (q || "").toLowerCase().trim();
    const list = get().messages;
    return list.filter(m => {
      const hasFile = (m.attachments || []).length > 0;
      const link = hasLink(m.text || "");
      const textHit = text ? (m.text || "").toLowerCase().includes(text) : true;
      if (!textHit) return false;
      if (kind === "messages") return !hasFile && !link;
      if (kind === "files") return hasFile;
      if (kind === "links") return link;
      return true;
    });
  },

  /** 채널 생성 */
  createChannel: async (name, memberIds) => {
    const projectId = get().projectId;
    if (projectId) {
      const uniqueMembers = Array.from(new Set(memberIds || []));
      const created = await createChannelApi(projectId, name, uniqueMembers);
      const workspaceId = created.projectId ?? projectId;
      const id = created.id;
      const channel: Channel = { id, name: created.name, workspaceId, createdAt: (created as any).createdAt ?? new Date().toISOString() };

      let allChannels = [...get().allChannels, channel];
      lsSet(CHANNELS_KEY, allChannels);

      let channels = get().channels;
      if (workspaceId === get().workspaceId) {
        channels = [...channels, channel];
      }

      let workspaces = get().workspaces;
      let workspaceChanged = false;
      workspaces = workspaces.map(ws => {
        if (ws.id !== workspaceId) return ws;
        let changed = false;
        const sections = ws.sections.map(sec => {
          if (sec.type !== "channels") return sec;
          if (sec.itemIds.includes(id)) return sec;
          changed = true;
          return { ...sec, itemIds: [...sec.itemIds, id] };
        });
        if (changed) {
          workspaceChanged = true;
          return { ...ws, sections };
        }
        return ws;
      });
      if (!workspaceChanged) {
        workspaces = workspaces.map(ws => {
          if (ws.id !== workspaceId) return ws;
          if (ws.sections.some(sec => sec.type === "channels")) return ws;
          workspaceChanged = true;
          return {
            ...ws,
            sections: [
              ...ws.sections,
              { id: `${ws.id}-channels`, title: "Channels", type: "channels", itemIds: [id], collapsed: false },
            ],
          };
        });
      }
      if (workspaceChanged) {
        lsSet(WORKSPACES_KEY, workspaces);
      }

      const members = {
        ...get().channelMembers,
        [id]: created.memberIds && created.memberIds.length ? created.memberIds : Array.from(new Set([get().me.id, ...uniqueMembers])),
      };
      lsSet(MEMBERS_KEY, members);
      const topics = { ...get().channelTopics, [id]: { topic: "" } };
      lsSet(TOPICS_KEY, topics);
      lsSet(MSGS_KEY(id), []);

      set({
        allChannels,
        channels,
        workspaces,
        channelMembers: members,
        channelTopics: topics,
      });
      bc?.postMessage({ type: "channel:create", channel: { ...channel }, members: members[id] });
      return id;
    }

    const workspaceId = get().workspaceId || FALLBACK_WORKSPACE_ID;
    const existing = new Set(get().allChannels.map(c => c.id));
    const base = name.replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
    let id = base || `ch-${Date.now()}`;
    if (existing.has(id)) {
      id = `ch-${Date.now()}`;
    }
    const display = name.startsWith("#") ? name : `# ${name}`;
    const channel: Channel = { id, name: display, workspaceId, createdAt: new Date().toISOString() };

    let allChannels = [...get().allChannels, channel];
    lsSet(CHANNELS_KEY, allChannels);

    let channels = get().channels;
    if (workspaceId === get().workspaceId) {
      channels = [...channels, channel];
    }

    let workspaces = get().workspaces;
    let workspaceChanged = false;
    workspaces = workspaces.map(ws => {
      if (ws.id !== workspaceId) return ws;
      let changed = false;
      const sections = ws.sections.map(sec => {
        if (sec.type !== "channels") return sec;
        if (sec.itemIds.includes(id)) return sec;
        changed = true;
        return { ...sec, itemIds: [...sec.itemIds, id] };
      });
      if (changed) {
        workspaceChanged = true;
        return { ...ws, sections };
      }
      return ws;
    });
    if (!workspaceChanged) {
      workspaces = workspaces.map(ws => {
        if (ws.id !== workspaceId) return ws;
        if (ws.sections.some(sec => sec.type === "channels")) return ws;
        workspaceChanged = true;
        return {
          ...ws,
          sections: [
            ...ws.sections,
            { id: `${ws.id}-channels`, title: "Channels", type: "channels", itemIds: [id], collapsed: false },
          ],
        };
      });
    }
    if (workspaceChanged) {
      lsSet(WORKSPACES_KEY, workspaces);
    }

    const members = { ...get().channelMembers, [id]: Array.from(new Set(memberIds)) };
    lsSet(MEMBERS_KEY, members);
    const topics = { ...get().channelTopics, [id]: { topic: "" } };
    lsSet(TOPICS_KEY, topics);
    lsSet(MSGS_KEY(id), []);

    set({
      allChannels,
      channels,
      workspaces,
      channelMembers: members,
      channelTopics: topics,
    });
    bc?.postMessage({ type: "channel:create", channel: { ...channel }, members: members[id] });
    return id;
  },

  /** 채널 초대 */
  inviteToChannel: (channelId, memberIds) => {
    const members = new Set(get().channelMembers[channelId] || []);
    memberIds.forEach(m => members.add(m));
    const obj = { ...get().channelMembers, [channelId]: Array.from(members) };
    set({ channelMembers: obj });
    lsSet(MEMBERS_KEY, obj);
    bc?.postMessage({ type: "channel:invite", channelId, members: obj[channelId] });
  },
  startGroupDM: (memberIds, opts) => {
    void opts;
    const { me } = get();
    const unique = Array.from(new Set(memberIds || [])).filter(Boolean);
    const others = unique.filter(id => id !== me.id);
    if (others.length === 0) return null;
    others.sort();
    const channelId = `dm:${others.join("+")}`;
    void get().setChannel(channelId);
    return channelId;
  },

  /** 채널 토픽/설정 */
  setChannelTopic: (channelId, topic) => {
    const obj = { ...get().channelTopics, [channelId]: { ...(get().channelTopics[channelId] || {}), topic } };
    set({ channelTopics: obj });
    lsSet(TOPICS_KEY, obj);
    bc?.postMessage({ type: "channel:topic", channelId, topic });
  },
  setChannelMuted: (channelId, muted) => {
    const obj = { ...get().channelTopics, [channelId]: { ...(get().channelTopics[channelId] || {}), muted } };
    set({ channelTopics: obj });
    lsSet(TOPICS_KEY, obj);
    bc?.postMessage({ type: "channel:muted", channelId, muted });
  },

  updateChannelActivity: (channelId, messages) => {
    if (!channelId) return;
    const list = messages ?? lsGet<Msg[]>(MSGS_KEY(channelId), []);
    const meId = get().me.id;
    const since = get().lastReadAt[channelId] || 0;
    let unread = 0;
    let mention = 0;
    const normalize = (value: string) => value.trim().toLowerCase();
    const meNames = [get().me.name, get().me.displayName].filter(Boolean).map((v) => normalize(v as string));
    const extractMentionTokens = (text: string) =>
      Array.from(text.matchAll(/@([^\s@]+)/g))
        .map((m) => normalize(m[1] || ""))
        .filter(Boolean);
    for (const item of list) {
      if (item.ts > since) {
        unread += 1;
        const mentionMeta = (item.mentions || []).map((x) => normalize(x));
        const mentionByMeta = mentionMeta.some((meta) => {
          if (meta === `id:${normalize(meId)}` || meta === normalize(meId)) return true;
          return meNames.some((name) => meta === `name:${name}` || meta === name);
        });
        const mentionByText = meNames.some((name) => extractMentionTokens(item.text || "").includes(name));
        if (mentionByMeta || mentionByText) {
          mention += 1;
        }
      }
    }
    const last = list[list.length - 1];
    const previewText = summarizeMessage(last);
    const activity: ChannelActivity = {
      lastMessageTs: last?.ts || 0,
      lastAuthor: last?.author || undefined,
      lastPreview: previewText || undefined,
      unreadCount: unread,
      mentionCount: mention,
    };
    const current = get().channelActivity;
    const next = { ...current, [channelId]: activity };
    set({ channelActivity: next });
    lsSet(ACTIVITY_KEY, next);
  },

  initRealtime: () => {
    if (typeof window === "undefined") return;
    if (!socketBound) {
      socketBound = true;
      const token = localStorage.getItem("accessToken");
      const socket = getChatSocket(token);
      if (socket) {
        socket.on("message.pinned", (data: { messageId: string }) => {
          const channelId = get().channelId;
          const pins = { ...(get().pinnedByChannel || {}) };
          const list = new Set(pins[channelId] || []);
          list.add(data.messageId);
          pins[channelId] = Array.from(list);
          set({ pinnedByChannel: pins });
          lsSet(PINS_KEY, pins);
        });
        socket.on("message.unpinned", (data: { messageId: string }) => {
          const channelId = get().channelId;
          const pins = { ...(get().pinnedByChannel || {}) };
          const list = new Set(pins[channelId] || []);
          list.delete(data.messageId);
          pins[channelId] = Array.from(list);
          set({ pinnedByChannel: pins });
          lsSet(PINS_KEY, pins);
        });
        socket.on("message.saved", (data: { messageId: string }) => {
          const meId = get().me.id;
          const saved = { ...(get().savedByUser || {}) };
          const list = new Set(saved[meId] || []);
          list.add(data.messageId);
          saved[meId] = Array.from(list);
          set({ savedByUser: saved });
          lsSet(SAVED_KEY(meId), saved);
        });
        socket.on("message.unsaved", (data: { messageId: string }) => {
          const meId = get().me.id;
          const saved = { ...(get().savedByUser || {}) };
          const list = new Set(saved[meId] || []);
          list.delete(data.messageId);
          saved[meId] = Array.from(list);
          set({ savedByUser: saved });
          lsSet(SAVED_KEY(meId), saved);
        });
        socket.on("message.event", (event: { type: string; roomId?: string; payload?: any }) => {
          if (!event?.roomId || !event.roomId.startsWith("channel:")) return;
          const channelId = event.roomId.replace("channel:", "");
          const currentId = get().channelId;
          const list = normalizeMsgListEntities(
            channelId === currentId ? get().messages : lsGet<Msg[]>(MSGS_KEY(channelId), []),
          );

          if (event.type === "created" && event.payload) {
            const msg = mapChannelMessage(event.payload as ChannelMessageResponse, channelId, get().me.id);
            if (localEchoIds.has(msg.id)) return;
            if (list.some((m) => m.id === msg.id)) {
              return;
            }
            const next = sortMessages([...list, msg]);
            if (channelId === currentId) {
              set({ messages: next });
            }
            lsSet(MSGS_KEY(channelId), next);
            get().updateChannelActivity(channelId, next);
          }

          if (event.type === "updated" && event.payload) {
            const updated = mapChannelMessage(event.payload as ChannelMessageResponse, channelId, get().me.id);
            const next = list.map((m) => (m.id === updated.id ? { ...m, ...updated } : m));
            if (channelId === currentId) {
              set({ messages: next });
            }
            lsSet(MSGS_KEY(channelId), next);
            get().updateChannelActivity(channelId, next);
          }

          if (event.type === "deleted" && event.payload) {
            const messageId = (event.payload as { messageId: string }).messageId;
            if (!messageId) return;
            const next = list.filter((m) => m.id !== messageId);
            if (channelId === currentId) {
              set({ messages: next });
            }
            lsSet(MSGS_KEY(channelId), next);
            get().updateChannelActivity(channelId, next);
          }

          if (event.type === "reaction" && event.payload) {
            const { messageId, emoji, userId, action } = event.payload as {
              messageId: string;
              emoji: string;
              userId: string;
              action: "added" | "removed";
            };
            const next = list.map((m) => {
              if (m.id !== messageId) return m;
              const map = { ...(m.reactions || {}) };
              const setIds = new Set(map[emoji] || []);
              if (action === "removed") {
                setIds.delete(userId);
              } else {
                setIds.add(userId);
              }
              if (setIds.size === 0) {
                delete map[emoji];
              } else {
                map[emoji] = Array.from(setIds);
              }
              return { ...m, reactions: map };
            });
            if (channelId === currentId) {
              set({ messages: next });
            }
            lsSet(MSGS_KEY(channelId), next);
          }

          if (event.type === "thread_created" && event.payload) {
            const replyPayload = (event.payload as { message?: ChannelMessageResponse }).message;
            if (!replyPayload) return;
            const replyMsg = mapChannelMessage(replyPayload, channelId, get().me.id);
            if (localEchoIds.has(replyMsg.id)) return;
            if (list.some((m) => m.id === replyMsg.id)) return;
            const next = sortMessages([...list, replyMsg]);
            if (channelId === currentId) {
              set({ messages: next });
            }
            lsSet(MSGS_KEY(channelId), next);
            get().updateChannelActivity(channelId, next);
          }

          if (event.type === "thread_meta" && event.payload) {
            const { parentMessageId, thread } = event.payload as {
              parentMessageId: string;
              thread?: { replyCount?: number };
            };
            if (!parentMessageId) return;
            const next = list.map((m) =>
              m.id === parentMessageId ? { ...m, threadCount: thread?.replyCount ?? m.threadCount } : m
            );
            if (channelId === currentId) {
              set({ messages: next });
            }
            lsSet(MSGS_KEY(channelId), next);
          }
        });
      }
    }
    if (!bc) {
      bc = new BroadcastChannel("flowdash-chat");
      bc.onmessage = (e) => {
        const data = e.data || {};
        if (!data.type) return;

        const curCh = get().channelId;

        if (data.type === "channel:create") {
          const newChannel = data.channel as Channel;
          const currentWorkspace = get().workspaceId;
          const allChannels = [...get().allChannels, newChannel];
          lsSet(CHANNELS_KEY, allChannels);

          let channels = get().channels;
          if (newChannel.workspaceId === currentWorkspace) {
            channels = [...channels, newChannel];
          }

          let workspaces = get().workspaces;
          let wsChanged = false;
          workspaces = workspaces.map(ws => {
            if (ws.id !== newChannel.workspaceId) return ws;
            let changed = false;
            const sections = ws.sections.map(sec => {
              if (sec.type !== "channels") return sec;
              if (sec.itemIds.includes(newChannel.id)) return sec;
              changed = true;
              return { ...sec, itemIds: [...sec.itemIds, newChannel.id] };
            });
            if (changed) {
              wsChanged = true;
              return { ...ws, sections };
            }
            return ws;
          });
          if (wsChanged) {
            lsSet(WORKSPACES_KEY, workspaces);
          }

          const members = { ...get().channelMembers, [newChannel.id]: data.members as string[] };
          set({ allChannels, channels, workspaces, channelMembers: members });
          lsSet(MEMBERS_KEY, members);
          get().updateChannelActivity(newChannel.id);
        }
        if (data.type === "channel:invite") {
          const members = { ...get().channelMembers, [data.channelId]: data.members as string[] };
          set({ channelMembers: members });
          lsSet(MEMBERS_KEY, members);
        }
        if (data.type === "channel:topic") {
          const obj = { ...get().channelTopics, [data.channelId]: { ...(get().channelTopics[data.channelId] || {}), topic: data.topic } };
          set({ channelTopics: obj });
          lsSet(TOPICS_KEY, obj);
        }
        if (data.type === "channel:muted") {
          const obj = { ...get().channelTopics, [data.channelId]: { ...(get().channelTopics[data.channelId] || {}), muted: data.muted } };
          set({ channelTopics: obj });
          lsSet(TOPICS_KEY, obj);
        }

        if (data.type === "message:new") {
          const msg = data.msg as Msg | undefined;
          if (!msg) return;
          if (msg.channelId === curCh) {
            const cur = get().messages;
            if (cur.some((m) => m.id === msg.id)) return;
            const next = sortMessages([...cur, msg]);
            set({ messages: next });
            lsSet(MSGS_KEY(msg.channelId), next);
            get().updateChannelActivity(msg.channelId, next);
          } else {
            const list = lsGet<Msg[]>(MSGS_KEY(msg.channelId), []);
            if (list.some((m) => m.id === msg.id)) return;
            const next = sortMessages([...list, msg]);
            lsSet(MSGS_KEY(msg.channelId), next);
            get().updateChannelActivity(msg.channelId);
          }
        }
        if (data.type === "message:update") {
          const cur = get().messages;
          const next = cur.map(m => m.id === data.id ? { ...m, ...data.patch } : m);
          if (data.channelId === curCh) {
            set({ messages: next });
          }
          get().updateChannelActivity(data.channelId || curCh, data.channelId === curCh ? next : undefined);
        }
        if (data.type === "message:delete") {
          const cur = get().messages;
          const next = cur.filter(m => m.id !== data.id);
          if (data.channelId === curCh) {
            set({ messages: next });
          }
          get().updateChannelActivity(data.channelId || curCh, data.channelId === curCh ? next : undefined);
        }
        if (data.type === "message:restore") {
          const cur = get().messages;
          const msg = data.msg as Msg | undefined;
          if (!msg) return;
          const next = [...cur, msg].sort((a,b)=> a.ts - b.ts);
          if (msg.channelId === curCh) {
            set({ messages: next });
            get().updateChannelActivity(msg.channelId, next);
          } else {
            get().updateChannelActivity(msg.channelId);
          }
        }
        if (data.type === "message:react") {
          const cur = get().messages;
          const next = cur.map(m => {
            if (m.id !== data.id) return m;
            const map = { ...(m.reactions || {}) };
            const setIds = new Set(map[data.emoji] || []);
            if (setIds.has(data.userId)) setIds.delete(data.userId); else setIds.add(data.userId);
            if (setIds.size === 0) {
              delete map[data.emoji];
            } else {
              map[data.emoji] = Array.from(setIds);
            }
            return { ...m, reactions: map };
          });
          set({ messages: next });
        }
        if (data.type === "typing") {
          if (data.channelId !== curCh) return;
          const { typingUsers } = get();
          const list = new Set(typingUsers[curCh] || []);
          if (data.typing) list.add(data.user); else list.delete(data.user);
          set({ typingUsers: { ...typingUsers, [curCh]: Array.from(list) } });
          if (data.typing) {
            setTimeout(() => {
              const curr = get().typingUsers[curCh] || [];
              const again = new Set(curr);
              again.delete(data.user);
              const tu = { ...get().typingUsers, [curCh]: Array.from(again) };
              set({ typingUsers: tu });
            }, 3000);
          }
        }
        if (data.type === "pin:sync") {
          const pins = { ...(get().pinnedByChannel || {}) };
          pins[data.channelId] = data.pins || [];
          set({ pinnedByChannel: pins });
          lsSet(PINS_KEY, pins);
        }
        if (data.type === "huddle:state") {
          const hs = { ...get().huddles, [data.channelId]: data.state as HuddleState };
          set({ huddles: hs });
        }
        if (data.type === "seen:update") {
          if (data.channelId !== curCh) return;
          const cur = get().messages;
          const next = cur.map(m => {
            if (m.ts <= data.upTo) {
              const setIds = new Set(m.seenBy || []);
              setIds.add(data.userId);
              return { ...m, seenBy: Array.from(setIds) };
            }
            return m;
          });
          set({ messages: next });
          lsSet(MSGS_KEY(curCh), next);
        }
      };
    }
  },
}));
