// app/(workspace)/workspace/[teamId]/[projectId]/chat/_model/chat-store/actions.realtime.ts
import { lsGet, lsSet } from '@/lib/persist';
import { getChatSocket } from '@/lib/socket';
import type { Channel, Msg } from '../types';
import { CHANNELS_KEY, MEMBERS_KEY, MSGS_KEY, PINS_KEY, SAVED_KEY, TOPICS_KEY, WORKSPACES_KEY } from './constants';
import { CHAT_BROADCAST_EVENTS } from './constants/event.constants';
import { mapChannelMessage, normalizeMsgListEntities, sortMessages } from './messages';
import type { ChannelMessageResponse, HuddleState } from './types';

type StoreLike = {
  channelId: string;
  workspaceId: string;
  allChannels: Channel[];
  channels: Channel[];
  workspaces: Array<{ id: string; sections: Array<{ type: string; itemIds: string[] }> }>;
  channelMembers: Record<string, string[]>;
  channelTopics: Record<string, { topic: string; muted?: boolean }>;
  pinnedByChannel: Record<string, string[]>;
  huddles: Record<string, HuddleState>;
  savedByUser: Record<string, string[]>;
  typingUsers: Record<string, string[]>;
  messages: Msg[];
  me: { id: string };
  updateChannelActivity: (channelId: string, messages?: Msg[]) => void;
};

type RealtimeDeps = {
  set: (partial: Partial<StoreLike>) => void;
  get: () => StoreLike;
  getSocketBound: () => boolean;
  setSocketBound: (value: boolean) => void;
  getBroadcast: () => BroadcastChannel | null;
  setBroadcast: (value: BroadcastChannel) => void;
  localEchoIds: Set<string>;
};

export const createRealtimeActions = ({
  set,
  get,
  getSocketBound,
  setSocketBound,
  getBroadcast,
  setBroadcast,
  localEchoIds,
}: RealtimeDeps) => ({
  initRealtime: () => {
    if (typeof window === 'undefined') return;
    if (!getSocketBound()) {
      setSocketBound(true);
      const token = localStorage.getItem('accessToken');
      const socket = getChatSocket(token);
      if (socket) {
        socket.on('message.pinned', (data: { messageId: string }) => {
          const channelId = get().channelId;
          const pins = { ...(get().pinnedByChannel || {}) };
          const list = new Set(pins[channelId] || []);
          list.add(data.messageId);
          pins[channelId] = Array.from(list);
          set({ pinnedByChannel: pins });
          lsSet(PINS_KEY, pins);
        });
        socket.on('message.unpinned', (data: { messageId: string }) => {
          const channelId = get().channelId;
          const pins = { ...(get().pinnedByChannel || {}) };
          const list = new Set(pins[channelId] || []);
          list.delete(data.messageId);
          pins[channelId] = Array.from(list);
          set({ pinnedByChannel: pins });
          lsSet(PINS_KEY, pins);
        });
        socket.on('message.saved', (data: { messageId: string }) => {
          const meId = get().me.id;
          const saved = { ...(get().savedByUser || {}) };
          const list = new Set(saved[meId] || []);
          list.add(data.messageId);
          saved[meId] = Array.from(list);
          set({ savedByUser: saved });
          lsSet(SAVED_KEY(meId), saved);
        });
        socket.on('message.unsaved', (data: { messageId: string }) => {
          const meId = get().me.id;
          const saved = { ...(get().savedByUser || {}) };
          const list = new Set(saved[meId] || []);
          list.delete(data.messageId);
          saved[meId] = Array.from(list);
          set({ savedByUser: saved });
          lsSet(SAVED_KEY(meId), saved);
        });
        socket.on('message.event', (event: { type: string; roomId?: string; payload?: any }) => {
          if (!event?.roomId || !event.roomId.startsWith('channel:')) return;
          const channelId = event.roomId.replace('channel:', '');
          const currentId = get().channelId;
          const list = normalizeMsgListEntities(channelId === currentId ? get().messages : lsGet<Msg[]>(MSGS_KEY(channelId), []));

          if (event.type === 'created' && event.payload) {
            const msg = mapChannelMessage(event.payload as ChannelMessageResponse, channelId, get().me.id);
            if (localEchoIds.has(msg.id)) return;
            if (list.some((m) => m.id === msg.id)) return;
            const next = sortMessages([...list, msg]);
            if (channelId === currentId) set({ messages: next });
            lsSet(MSGS_KEY(channelId), next);
            get().updateChannelActivity(channelId, next);
          }

          if (event.type === 'updated' && event.payload) {
            const updated = mapChannelMessage(event.payload as ChannelMessageResponse, channelId, get().me.id);
            const next = list.map((m) => (m.id === updated.id ? { ...m, ...updated } : m));
            if (channelId === currentId) set({ messages: next });
            lsSet(MSGS_KEY(channelId), next);
            get().updateChannelActivity(channelId, next);
          }

          if (event.type === 'deleted' && event.payload) {
            const messageId = (event.payload as { messageId: string }).messageId;
            if (!messageId) return;
            const next = list.filter((m) => m.id !== messageId);
            if (channelId === currentId) set({ messages: next });
            lsSet(MSGS_KEY(channelId), next);
            get().updateChannelActivity(channelId, next);
          }

          if (event.type === 'reaction' && event.payload) {
            const { messageId, emoji, userId, action } = event.payload as {
              messageId: string;
              emoji: string;
              userId: string;
              action: 'added' | 'removed';
            };
            const next = list.map((m) => {
              if (m.id !== messageId) return m;
              const map = { ...(m.reactions || {}) };
              const setIds = new Set(map[emoji] || []);
              if (action === 'removed') setIds.delete(userId);
              else setIds.add(userId);
              if (setIds.size === 0) delete map[emoji];
              else map[emoji] = Array.from(setIds);
              return { ...m, reactions: map };
            });
            if (channelId === currentId) set({ messages: next });
            lsSet(MSGS_KEY(channelId), next);
          }

          if (event.type === 'thread_created' && event.payload) {
            const replyPayload = (event.payload as { message?: ChannelMessageResponse }).message;
            if (!replyPayload) return;
            const replyMsg = mapChannelMessage(replyPayload, channelId, get().me.id);
            if (localEchoIds.has(replyMsg.id)) return;
            if (list.some((m) => m.id === replyMsg.id)) return;
            const next = sortMessages([...list, replyMsg]);
            if (channelId === currentId) set({ messages: next });
            lsSet(MSGS_KEY(channelId), next);
            get().updateChannelActivity(channelId, next);
          }

          if (event.type === 'thread_meta' && event.payload) {
            const { parentMessageId, thread } = event.payload as { parentMessageId: string; thread?: { replyCount?: number } };
            if (!parentMessageId) return;
            const next = list.map((m) => (m.id === parentMessageId ? { ...m, threadCount: thread?.replyCount ?? m.threadCount } : m));
            if (channelId === currentId) set({ messages: next });
            lsSet(MSGS_KEY(channelId), next);
          }
        });
      }
    }

    if (!getBroadcast()) {
      const bc = new BroadcastChannel('flowdash-chat');
      setBroadcast(bc);
      bc.onmessage = (e) => {
        const data = e.data || {};
        if (!data.type) return;

        const curCh = get().channelId;

        if (data.type === CHAT_BROADCAST_EVENTS.CHANNEL_CREATE) {
          const newChannel = data.channel as Channel;
          const currentWorkspace = get().workspaceId;
          const allChannels = [...get().allChannels, newChannel];
          lsSet(CHANNELS_KEY, allChannels);

          let channels = get().channels;
          if (newChannel.workspaceId === currentWorkspace) channels = [...channels, newChannel];

          let workspaces = get().workspaces;
          let wsChanged = false;
          workspaces = workspaces.map((ws) => {
            if (ws.id !== newChannel.workspaceId) return ws;
            let changed = false;
            const sections = ws.sections.map((sec) => {
              if (sec.type !== 'channels') return sec;
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
          if (wsChanged) lsSet(WORKSPACES_KEY, workspaces as any);

          const members = { ...get().channelMembers, [newChannel.id]: data.members as string[] };
          set({ allChannels, channels, workspaces: workspaces as any, channelMembers: members });
          lsSet(MEMBERS_KEY, members);
          get().updateChannelActivity(newChannel.id);
        }
        if (data.type === CHAT_BROADCAST_EVENTS.CHANNEL_INVITE) {
          const members = { ...get().channelMembers, [data.channelId]: data.members as string[] };
          set({ channelMembers: members });
          lsSet(MEMBERS_KEY, members);
        }
        if (data.type === CHAT_BROADCAST_EVENTS.CHANNEL_TOPIC) {
          const obj = { ...get().channelTopics, [data.channelId]: { ...(get().channelTopics[data.channelId] || {}), topic: data.topic } };
          set({ channelTopics: obj });
          lsSet(TOPICS_KEY, obj);
        }
        if (data.type === CHAT_BROADCAST_EVENTS.CHANNEL_MUTED) {
          const obj = { ...get().channelTopics, [data.channelId]: { ...(get().channelTopics[data.channelId] || {}), muted: data.muted } };
          set({ channelTopics: obj });
          lsSet(TOPICS_KEY, obj);
        }
        if (data.type === CHAT_BROADCAST_EVENTS.MESSAGE_NEW) {
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
        if (data.type === CHAT_BROADCAST_EVENTS.MESSAGE_UPDATE) {
          const cur = get().messages;
          const next = cur.map((m) => (m.id === data.id ? { ...m, ...data.patch } : m));
          if (data.channelId === curCh) set({ messages: next });
          get().updateChannelActivity(data.channelId || curCh, data.channelId === curCh ? next : undefined);
        }
        if (data.type === CHAT_BROADCAST_EVENTS.MESSAGE_DELETE) {
          const cur = get().messages;
          const next = cur.filter((m) => m.id !== data.id);
          if (data.channelId === curCh) set({ messages: next });
          get().updateChannelActivity(data.channelId || curCh, data.channelId === curCh ? next : undefined);
        }
        if (data.type === CHAT_BROADCAST_EVENTS.MESSAGE_RESTORE) {
          const cur = get().messages;
          const msg = data.msg as Msg | undefined;
          if (!msg) return;
          const next = [...cur, msg].sort((a, b) => a.ts - b.ts);
          if (msg.channelId === curCh) {
            set({ messages: next });
            get().updateChannelActivity(msg.channelId, next);
          } else {
            get().updateChannelActivity(msg.channelId);
          }
        }
        if (data.type === CHAT_BROADCAST_EVENTS.MESSAGE_REACT) {
          const cur = get().messages;
          const next = cur.map((m) => {
            if (m.id !== data.id) return m;
            const map = { ...(m.reactions || {}) };
            const setIds = new Set(map[data.emoji] || []);
            if (setIds.has(data.userId)) setIds.delete(data.userId);
            else setIds.add(data.userId);
            if (setIds.size === 0) delete map[data.emoji];
            else map[data.emoji] = Array.from(setIds);
            return { ...m, reactions: map };
          });
          set({ messages: next });
        }
        if (data.type === CHAT_BROADCAST_EVENTS.TYPING) {
          if (data.channelId !== curCh) return;
          const { typingUsers } = get();
          const list = new Set(typingUsers[curCh] || []);
          if (data.typing) list.add(data.user);
          else list.delete(data.user);
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
        if (data.type === CHAT_BROADCAST_EVENTS.PIN_SYNC) {
          const pins = { ...(get().pinnedByChannel || {}) };
          pins[data.channelId] = data.pins || [];
          set({ pinnedByChannel: pins });
          lsSet(PINS_KEY, pins);
        }
        if (data.type === CHAT_BROADCAST_EVENTS.HUDDLE_STATE) {
          const hs = { ...get().huddles, [data.channelId]: data.state as HuddleState };
          set({ huddles: hs });
        }
        if (data.type === CHAT_BROADCAST_EVENTS.SEEN_UPDATE) {
          if (data.channelId !== curCh) return;
          const cur = get().messages;
          const next = cur.map((m) => {
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
});
