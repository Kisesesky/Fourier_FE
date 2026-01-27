// store/chat.ts
import { create } from "zustand";
import { lsGet, lsSet } from "@/lib/persist";
import { listChannels, listMessages, sendChannelMessage, listProjectMembers } from "../_service/api";

import type {
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
  toggleSectionCollapsed: (sectionId: string, value?: boolean) => void;
  toggleStar: (channelId: string) => void;

  send: (text: string, files?: FileItem[], opts?: { parentId?: string | null; mentions?: string[] }) => Promise<void>;
  updateMessage: (id: string, patch: Partial<Pick<Msg, "text">>) => void;
  deleteMessage: (id: string) => { deleted?: Msg };
  restoreMessage: (msg: Msg) => void;

  toggleReaction: (id: string, emoji: string) => void;
  openThread: (rootId: string) => void;
  closeThread: () => void;

  setTyping: (typing: boolean) => void;
  markChannelRead: (id?: string) => void;
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
  createChannel: (name: string, memberIds: string[]) => string; // returns channelId
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

function cloneMembers(map: Record<string, string[]>): Record<string, string[]> {
  return Object.fromEntries(Object.entries(map).map(([key, value]) => [key, [...value]]));
}

function cloneTopics(map: Record<string, { topic: string; muted?: boolean }>): Record<string, { topic: string; muted?: boolean }> {
  return Object.fromEntries(Object.entries(map).map(([key, value]) => [key, { ...value }]));
}

let bc: BroadcastChannel | null = null;

const DEFAULT_ME: ChatUser = { id: "me", name: "Me" };
const DEFAULT_STATUS_MAP: Record<string, PresenceState> = {};
const FALLBACK_WORKSPACE_ID = "workspace";

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
  createdAt: string;
  editedAt?: string;
  threadParentId?: string;
  thread?: { count: number };
};

const mapChannelMessage = (message: ChannelMessageResponse, channelId: string): Msg => ({
  id: message.id,
  author: message.sender?.name ?? "Unknown",
  authorId: message.senderId,
  text: message.content ?? "",
  ts: message.createdAt ? Date.parse(message.createdAt) : Date.now(),
  editedAt: message.editedAt ? Date.parse(message.editedAt) : undefined,
  channelId,
  parentId: message.threadParentId ?? undefined,
  threadCount: message.thread?.count ?? undefined,
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

  messages: [],
  threadFor: null,

  lastReadAt: {},
  channelActivity: {},
  typingUsers: {},
  pinnedByChannel: {},
  huddles: {},
  savedByUser: {},

  setContext: (teamId, projectId) => {
    set({ teamId, projectId });
    void get().loadChannels();
  },
  setMe: (user) => {
    set({ me: user });
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
    const [channelList, members] = await Promise.all([
      listChannels(projectId),
      teamId ? listProjectMembers(teamId, projectId) : Promise.resolve([]),
    ]);
    const workspaceId = projectId;
    const channels = channelList.map((ch) => ({ ...ch, workspaceId }));
    const workspaces = [buildWorkspace(workspaceId, channels)];
    set({ workspaces, allChannels: channels, workspaceId, channels });
    if (members.length > 0) {
      const userMap = members.reduce<Record<string, ChatUser>>((acc, member) => {
        acc[member.userId] = {
          id: member.userId,
          name: member.name,
          avatarUrl: member.avatarUrl ?? undefined,
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
        displayName = user ? `@ ${user.name}` : `@ ${target || "Direct Message"}`;
      } else {
        const names = otherIds.map(uid => users[uid]?.name || uid);
        displayName = names.join(", ");
      }

      let allChannels = get().allChannels;
      let channels = get().channels;
      let workspaces = get().workspaces;

      const existing = allChannels.find(c => c.id === id);
      if (!existing) {
        const dmChannel: Channel = { id, name: displayName, isDM: true, workspaceId };
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

      const list = lsGet<Msg[]>(MSGS_KEY(id), []);
      if (list.length === 0) {
        lsSet(MSGS_KEY(id), list);
      }
      set({ channelId: id, messages: list, threadFor: null });
      get().updateChannelActivity(id, list);
      bc?.postMessage({ type: "channel:set", id });
      return;
    }

    const list = await listMessages(id);
    const mapped = list.map((message) => mapChannelMessage(message, id));
    set({ channelId: id, messages: mapped, threadFor: null });
    get().updateChannelActivity(id, mapped);
    bc?.postMessage({ type: "channel:set", id });
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

  send: async (text, files = [], opts) => {
    const { channelId } = get();
    if (!channelId) return;
    const response = await sendChannelMessage(channelId, text, {
      replyToMessageId: opts?.parentId ?? undefined,
      threadParentId: opts?.parentId ?? undefined,
    });
    const msg = mapChannelMessage(response, channelId);
    const next = [...get().messages, msg];
    set({ messages: next });
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
      map[emoji] = Array.from(setIds);
      return { ...m, reactions: map };
    });
    set({ messages: next });
    lsSet(MSGS_KEY(channelId), next);
    bc?.postMessage({ type: "message:react", id, emoji, userId: me.id, channelId });
  },

  openThread: (rootId) => set({ threadFor: { rootId } }),
  closeThread: () => set({ threadFor: null }),

  setTyping: (typing) => {
    const { channelId, me } = get();
    bc?.postMessage({ type: "typing", channelId, user: me.name, typing });
  },

  markChannelRead: (id) => {
    const ch = id || get().channelId;
    if (!ch) return;
    const now = Date.now();
    const next = { ...get().lastReadAt, [ch]: now };
    set({ lastReadAt: next });
    lsSet(LAST_READ_KEY, next);
    get().updateChannelActivity(ch);
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
    if (list.has(msgId)) list.delete(msgId); else list.add(msgId);
    pins[channelId] = Array.from(list);
    set({ pinnedByChannel: pins });
    lsSet(PINS_KEY, pins);
    bc?.postMessage({ type: "pin:sync", channelId, pins: pins[channelId] || [] });
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
  createChannel: (name, memberIds) => {
    const workspaceId = get().workspaceId || FALLBACK_WORKSPACE_ID;
    const existing = new Set(get().allChannels.map(c => c.id));
    const base = name.replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
    let id = base || `ch-${Date.now()}`;
    if (existing.has(id)) {
      id = `ch-${Date.now()}`;
    }
    const display = name.startsWith("#") ? name : `# ${name}`;
    const channel: Channel = { id, name: display, workspaceId };

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
  startGroupDM: (memberIds, _opts) => {
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
    for (const item of list) {
      if (item.ts > since) {
        unread += 1;
        if ((item.mentions || []).includes(meId)) {
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
            const next = [...cur, msg];
            set({ messages: next });
            get().updateChannelActivity(msg.channelId, next);
          } else {
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
            map[data.emoji] = Array.from(setIds);
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
