// app/(workspace)/workspace/[teamId]/[projectId]/chat/_model/chat-store/actions.workspace-channel.ts
import { lsGet, lsSet } from '@/lib/persist';
import {
  createChannel as createChannelApi,
  getChannelPreferences,
  getPinnedMessages,
  listChannels,
  listMessages,
  listProjectMembers,
  saveChannelPreferences,
} from '../../_service/api';
import type { Channel, ChannelActivity, ChatUser, Msg, Workspace, WorkspaceSection } from '../types';
import {
  ACTIVE_WORKSPACE_KEY,
  ARCHIVED_CHANNELS_KEY,
  CHANNELS_KEY,
  FALLBACK_WORKSPACE_ID,
  MEMBERS_KEY,
  MSGS_KEY,
  PINNED_CHANNELS_KEY,
  PINS_KEY,
  TOPICS_KEY,
  WORKSPACES_KEY,
  ACTIVITY_KEY,
  buildWorkspace,
  inferChannelKind,
  normalizeColor,
} from './constants';
import { CHAT_BROADCAST_EVENTS } from './constants/event.constants';
import { mapChannelMessage, normalizeMsgListEntities, sortMessages, summarizeMessage } from './messages';

type StoreLike = {
  me: ChatUser;
  users: Record<string, ChatUser>;
  teamId?: string;
  projectId?: string;
  workspaceId: string;
  workspaces: Workspace[];
  allChannels: Channel[];
  channelId: string;
  channels: Channel[];
  channelMembers: Record<string, string[]>;
  channelTopics: Record<string, { topic: string; muted?: boolean }>;
  pinnedChannelIds: string[];
  archivedChannelIds: string[];
  messages: Msg[];
  lastReadAt: Record<string, number>;
  channelActivity: Record<string, ChannelActivity>;
  typingUsers: Record<string, string[]>;
  pinnedByChannel: Record<string, string[]>;
  threadFor?: { rootId: string } | null;
  setWorkspace: (id: string) => Promise<void>;
  setChannel: (id: string) => Promise<void>;
  updateChannelActivity: (channelId: string, messages?: Msg[]) => void;
};

type WorkspaceChannelDeps = {
  set: (partial: Partial<StoreLike>) => void;
  get: () => StoreLike;
  getBroadcast: () => BroadcastChannel | null;
};

export const createWorkspaceChannelActions = ({ set, get, getBroadcast }: WorkspaceChannelDeps) => ({
  loadChannels: async () => {
    const { projectId, teamId } = get();
    if (!projectId) return;
    let channelList: Channel[] = [];
    let members: Array<{
      userId: string;
      name: string;
      displayName?: string;
      role?: 'owner' | 'manager' | 'member' | 'guest';
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
    const persistedChannels = lsGet<Channel[]>(CHANNELS_KEY, []);
    const persistedChannelMap = new Map(persistedChannels.map((ch) => [ch.id, ch]));
    const serverChannels = channelList.map((ch) => {
      const persisted = persistedChannelMap.get(ch.id);
      return {
        ...ch,
        workspaceId,
        kind: ch.kind || persisted?.kind || inferChannelKind({ id: ch.id, name: ch.name, isDM: ch.isDM }),
      };
    });
    const persistedDmChannels = persistedChannels
      .filter((ch) => (ch.isDM || ch.id.startsWith('dm:')) && ch.workspaceId === workspaceId)
      .map((ch) => ({ ...ch, isDM: true, workspaceId, kind: 'text' as const }));
    const channelsById = new Map<string, Channel>();
    serverChannels.forEach((channel) => channelsById.set(channel.id, channel));
    persistedDmChannels.forEach((channel) => {
      if (!channelsById.has(channel.id)) channelsById.set(channel.id, channel);
    });
    const channels = Array.from(channelsById.values());
    const dmIds = channels.filter((ch) => ch.isDM || ch.id.startsWith('dm:')).map((ch) => ch.id);
    const workspaces = [buildWorkspace(workspaceId, serverChannels)];
    workspaces[0].sections = workspaces[0].sections.map((section) =>
      section.type === 'dms' ? { ...section, itemIds: dmIds } : section,
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
      set({ channelId: '', messages: [], threadFor: null });
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

  createWorkspace: async (opts?: { name?: string; icon?: string; backgroundColor?: string; image?: string }) => {
    const { name, icon, backgroundColor, image } = opts || {};
    const state = get();
    const id = `ws-${Math.random().toString(36).slice(2, 8)}`;
    const label = name?.trim() && name.trim().length > 0 ? name.trim() : `Server ${state.workspaces.length + 1}`;
    const parsedIcon = icon?.trim() ? Array.from(icon.trim()).slice(0, 2).join('') : undefined;
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
        { id: `sec-${id}-starred`, title: 'Starred', type: 'starred', itemIds: [], collapsed: false },
        { id: `sec-${id}-channels`, title: 'Channels', type: 'channels', itemIds: [generalChannelId], collapsed: false },
        { id: `sec-${id}-dms`, title: 'Direct Messages', type: 'dms', itemIds: [], collapsed: false },
      ],
    };
    const generalChannel: Channel = {
      id: generalChannelId,
      name: '# general',
      workspaceId: id,
      kind: 'text',
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

  updateWorkspace: (id: string, patch: { name?: string; icon?: string; backgroundColor?: string; image?: string | null }) => {
    const state = get();
    const target = state.workspaces.find((ws) => ws.id === id);
    if (!target) return;
    const updated: Workspace = {
      ...target,
      ...(patch.name !== undefined ? { name: patch.name.trim() || target.name } : {}),
      ...(patch.icon !== undefined ? { icon: patch.icon?.trim() || undefined } : {}),
      ...(patch.backgroundColor !== undefined ? { backgroundColor: normalizeColor(patch.backgroundColor) } : {}),
      ...(patch.image !== undefined ? { image: patch.image || undefined } : {}),
    };
    const workspaces = state.workspaces.map((ws) => (ws.id === id ? updated : ws));
    lsSet(WORKSPACES_KEY, workspaces);
    set({ workspaces });
  },

  deleteWorkspace: async (id: string) => {
    const state = get();
    if (state.workspaces.length === 0) return;
    const exists = state.workspaces.some((ws) => ws.id === id);
    if (!exists) return;
    const channelsToRemove = new Set(state.allChannels.filter((ch) => ch.workspaceId === id).map((ch) => ch.id));
    const workspaces = state.workspaces.filter((ws) => ws.id !== id);
    const allChannels = state.allChannels.filter((ch) => ch.workspaceId !== id);
    const channelMembers = { ...state.channelMembers };
    const channelTopics = { ...state.channelTopics };
    const channelActivity = { ...state.channelActivity };
    const typingUsers = { ...state.typingUsers };
    const pinnedByChannel = { ...state.pinnedByChannel };
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
    if (state.workspaceId === id) nextWorkspaceId = workspaces[0]?.id ?? '';

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

  setWorkspace: async (id: string) => {
    const wsList = get().workspaces;
    const target = wsList.find((ws) => ws.id === id);
    if (!target) return;

    const workspaces = lsGet<Workspace[]>(WORKSPACES_KEY, wsList);
    const allChannels = lsGet<Channel[]>(CHANNELS_KEY, []);
    const channels = allChannels.filter((c) => c.workspaceId === id);
    lsSet(ACTIVE_WORKSPACE_KEY, id);
    set({ workspaceId: id, channels, allChannels, workspaces });
    channels.forEach((ch) => get().updateChannelActivity(ch.id));

    if (channels.length === 0) {
      set({ channelId: '', messages: [], threadFor: null });
      return;
    }

    const current = get().channelId;
    const exists = channels.some((c) => c.id === current);
    if (!exists) {
      await get().setChannel(channels[0].id);
    } else {
      const list = lsGet<Msg[]>(MSGS_KEY(current), []);
      set({ messages: list });
      get().updateChannelActivity(current, list);
    }
  },

  setChannel: async (id: string) => {
    if (id.startsWith('dm:')) {
      const raw = id.slice(3);
      const meId = get().me.id;
      const users = get().users;
      const otherIds = raw ? raw.split('+').filter(Boolean) : [];
      const participants = Array.from(new Set([meId, ...otherIds]));
      const workspaceId = get().workspaceId || FALLBACK_WORKSPACE_ID;

      let displayName: string;
      if (otherIds.length <= 1) {
        const target = otherIds[0] ?? raw;
        const user = users[target];
        displayName = user ? user.name : target || 'Direct Message';
      } else {
        const names = otherIds.map((uid) => users[uid]?.name || uid);
        displayName = names.join(', ');
      }

      let allChannels = get().allChannels;
      let channels = get().channels;
      let workspaces = get().workspaces;

      const existing = allChannels.find((c) => c.id === id);
      if (!existing) {
        const dmChannel: Channel = { id, name: displayName, isDM: true, workspaceId, kind: 'text', createdAt: new Date().toISOString() };
        allChannels = [...allChannels, dmChannel];
        if (!channels.some((c) => c.id === id) && workspaceId === dmChannel.workspaceId) channels = [...channels, dmChannel];
      } else if (existing.name !== displayName || !existing.isDM) {
        allChannels = allChannels.map((c) => (c.id === id ? { ...c, name: displayName, isDM: true, kind: 'text' } : c));
        channels = channels.map((c) => (c.id === id ? { ...c, name: displayName, isDM: true, kind: 'text' } : c));
      }
      lsSet(CHANNELS_KEY, allChannels);

      const memberMap = { ...get().channelMembers, [id]: participants };
      lsSet(MEMBERS_KEY, memberMap);

      let workspacesChanged = false;
      workspaces = workspaces.map((ws) => {
        if (ws.id !== workspaceId) return ws;
        let changed = false;
        const sections = ws.sections.map((sec) => {
          if (sec.type !== 'dms') return sec;
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
      if (workspacesChanged) lsSet(WORKSPACES_KEY, workspaces);

      set({ allChannels, channels, workspaces, channelMembers: memberMap });

      const list = normalizeMsgListEntities(lsGet<Msg[]>(MSGS_KEY(id), []));
      if (list.length === 0) lsSet(MSGS_KEY(id), list);
      set({ channelId: id, messages: list, threadFor: null });
      get().updateChannelActivity(id, list);
      getBroadcast()?.postMessage({ type: CHAT_BROADCAST_EVENTS.CHANNEL_SET, id });
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
    getBroadcast()?.postMessage({ type: CHAT_BROADCAST_EVENTS.CHANNEL_SET, id });
  },

  refreshChannel: async (id: string) => {
    if (!id || id.startsWith('dm:')) return;
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

  toggleSectionCollapsed: (sectionId: string, value?: boolean) => {
    const workspaceId = get().workspaceId;
    let workspaces = get().workspaces;
    let dirty = false;

    workspaces = workspaces.map((ws) => {
      if (ws.id !== workspaceId) return ws;
      const sections = ws.sections.map((sec) => {
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

  toggleStar: (channelId: string) => {
    const workspaceId = get().workspaceId;
    if (!workspaceId) return;
    let workspaces = get().workspaces;
    let changed = false;

    workspaces = workspaces.map((ws) => {
      if (ws.id !== workspaceId) return ws;
      let sections = ws.sections;
      let starredIndex = sections.findIndex((sec) => sec.type === 'starred');
      if (starredIndex < 0) {
        const newSection: WorkspaceSection = {
          id: `sec-starred-${workspaceId}`,
          title: 'Starred',
          type: 'starred',
          itemIds: [],
          collapsed: false,
        };
        sections = [newSection, ...sections];
        starredIndex = 0;
      }
      const starred = sections[starredIndex];
      const has = starred.itemIds.includes(channelId);
      const itemIds = has ? starred.itemIds.filter((id) => id !== channelId) : [...starred.itemIds, channelId];
      sections = sections.map((sec, idx) => (idx === starredIndex ? { ...sec, itemIds } : sec));
      changed = true;
      return { ...ws, sections };
    });

    if (!changed) return;
    set({ workspaces });
    lsSet(WORKSPACES_KEY, workspaces);
  },

  togglePinnedChannel: (channelId: string) => {
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

  toggleArchivedChannel: (channelId: string) => {
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

  createChannel: async (name: string, memberIds: string[], kind: 'text' | 'voice' | 'video' = 'text') => {
    const projectId = get().projectId;
    if (projectId) {
      const uniqueMembers = Array.from(new Set(memberIds || []));
      const created = await createChannelApi(projectId, name, uniqueMembers, kind);
      const workspaceId = created.projectId ?? projectId;
      const id = created.id;
      const channel: Channel = {
        id,
        name: created.name,
        workspaceId,
        kind: created.type === 'VOICE' ? 'voice' : created.type === 'VIDEO' ? 'video' : kind,
        createdAt: created.createdAt ?? new Date().toISOString(),
      };

      let allChannels = [...get().allChannels, channel];
      lsSet(CHANNELS_KEY, allChannels);

      let channels = get().channels;
      if (workspaceId === get().workspaceId) channels = [...channels, channel];

      let workspaces = get().workspaces;
      let workspaceChanged = false;
      workspaces = workspaces.map((ws) => {
        if (ws.id !== workspaceId) return ws;
        let changed = false;
        const sections = ws.sections.map((sec) => {
          if (sec.type !== 'channels') return sec;
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
        workspaces = workspaces.map((ws) => {
          if (ws.id !== workspaceId) return ws;
          if (ws.sections.some((sec) => sec.type === 'channels')) return ws;
          workspaceChanged = true;
          return {
            ...ws,
            sections: [...ws.sections, { id: `${ws.id}-channels`, title: 'Channels', type: 'channels', itemIds: [id], collapsed: false }],
          };
        });
      }
      if (workspaceChanged) lsSet(WORKSPACES_KEY, workspaces);

      const members = {
        ...get().channelMembers,
        [id]: created.memberIds && created.memberIds.length ? created.memberIds : Array.from(new Set([get().me.id, ...uniqueMembers])),
      };
      lsSet(MEMBERS_KEY, members);
      const topics = { ...get().channelTopics, [id]: { topic: '' } };
      lsSet(TOPICS_KEY, topics);
      lsSet(MSGS_KEY(id), []);

      set({ allChannels, channels, workspaces, channelMembers: members, channelTopics: topics });
      getBroadcast()?.postMessage({ type: CHAT_BROADCAST_EVENTS.CHANNEL_CREATE, channel: { ...channel }, members: members[id] });
      return id;
    }

    const workspaceId = get().workspaceId || FALLBACK_WORKSPACE_ID;
    const existing = new Set(get().allChannels.map((c) => c.id));
    const base = name.replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
    let id = base || `ch-${Date.now()}`;
    if (existing.has(id)) id = `ch-${Date.now()}`;
    const display = name.startsWith('#') ? name : `# ${name}`;
    const channel: Channel = { id, name: display, workspaceId, kind, createdAt: new Date().toISOString() };

    let allChannels = [...get().allChannels, channel];
    lsSet(CHANNELS_KEY, allChannels);

    let channels = get().channels;
    if (workspaceId === get().workspaceId) channels = [...channels, channel];

    let workspaces = get().workspaces;
    let workspaceChanged = false;
    workspaces = workspaces.map((ws) => {
      if (ws.id !== workspaceId) return ws;
      let changed = false;
      const sections = ws.sections.map((sec) => {
        if (sec.type !== 'channels') return sec;
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
      workspaces = workspaces.map((ws) => {
        if (ws.id !== workspaceId) return ws;
        if (ws.sections.some((sec) => sec.type === 'channels')) return ws;
        workspaceChanged = true;
        return {
          ...ws,
          sections: [...ws.sections, { id: `${ws.id}-channels`, title: 'Channels', type: 'channels', itemIds: [id], collapsed: false }],
        };
      });
    }
    if (workspaceChanged) lsSet(WORKSPACES_KEY, workspaces);

    const members = { ...get().channelMembers, [id]: Array.from(new Set(memberIds)) };
    lsSet(MEMBERS_KEY, members);
    const topics = { ...get().channelTopics, [id]: { topic: '' } };
    lsSet(TOPICS_KEY, topics);
    lsSet(MSGS_KEY(id), []);

    set({ allChannels, channels, workspaces, channelMembers: members, channelTopics: topics });
    getBroadcast()?.postMessage({ type: CHAT_BROADCAST_EVENTS.CHANNEL_CREATE, channel: { ...channel }, members: members[id] });
    return id;
  },

  inviteToChannel: (channelId: string, memberIds: string[]) => {
    const members = new Set(get().channelMembers[channelId] || []);
    memberIds.forEach((m) => members.add(m));
    const obj = { ...get().channelMembers, [channelId]: Array.from(members) };
    set({ channelMembers: obj });
    lsSet(MEMBERS_KEY, obj);
    getBroadcast()?.postMessage({ type: CHAT_BROADCAST_EVENTS.CHANNEL_INVITE, channelId, members: obj[channelId] });
  },

  startGroupDM: (memberIds: string[], opts?: { name?: string }) => {
    void opts;
    const { me } = get();
    const unique = Array.from(new Set(memberIds || [])).filter(Boolean);
    const others = unique.filter((id) => id !== me.id);
    if (others.length === 0) return null;
    others.sort();
    const channelId = `dm:${others.join('+')}`;
    void get().setChannel(channelId);
    return channelId;
  },

  setChannelTopic: (channelId: string, topic: string) => {
    const obj = { ...get().channelTopics, [channelId]: { ...(get().channelTopics[channelId] || {}), topic } };
    set({ channelTopics: obj });
    lsSet(TOPICS_KEY, obj);
    getBroadcast()?.postMessage({ type: CHAT_BROADCAST_EVENTS.CHANNEL_TOPIC, channelId, topic });
  },

  setChannelMuted: (channelId: string, muted: boolean) => {
    const obj = { ...get().channelTopics, [channelId]: { ...(get().channelTopics[channelId] || {}), muted } };
    set({ channelTopics: obj });
    lsSet(TOPICS_KEY, obj);
    getBroadcast()?.postMessage({ type: CHAT_BROADCAST_EVENTS.CHANNEL_MUTED, channelId, muted });
  },

  updateChannelActivity: (channelId: string, messages?: Msg[]) => {
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
        .map((m) => normalize(m[1] || ''))
        .filter(Boolean);
    for (const item of list) {
      if (item.ts > since) {
        unread += 1;
        const mentionMeta = (item.mentions || []).map((x) => normalize(x));
        const mentionByMeta = mentionMeta.some((meta) => {
          if (meta === `id:${normalize(meId)}` || meta === normalize(meId)) return true;
          return meNames.some((name) => meta === `name:${name}` || meta === name);
        });
        const mentionByText = meNames.some((name) => extractMentionTokens(item.text || '').includes(name));
        if (mentionByMeta || mentionByText) mention += 1;
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
});
