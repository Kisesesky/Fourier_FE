// app/(workspace)/workspace/[teamId]/[projectId]/chat/_model/chat-store/actions.thread-search.ts
import type { ChatUser, Msg } from '../types';
import { CHAT_BROADCAST_EVENTS } from './constants/event.constants';
import { hasLink } from './messages';

type ThreadSearchDeps = {
  set: (partial: Record<string, unknown>) => void;
  get: () => {
    channelId: string;
    me: ChatUser;
    messages: Msg[];
    typingUsers: Record<string, string[]>;
  };
  broadcast: BroadcastChannel | null;
};

export const createThreadSearchActions = ({ set, get, broadcast }: ThreadSearchDeps) => ({
  openThread: (rootId: string) => set({ threadFor: { rootId } }),
  closeThread: () => set({ threadFor: null }),
  setTyping: (typing: boolean) => {
    const { channelId, me } = get();
    broadcast?.postMessage({ type: CHAT_BROADCAST_EVENTS.TYPING, channelId, user: me.name, typing });
  },
  getThread: (rootId: string) => {
    const all = get().messages;
    const root = all.find((m) => m.id === rootId);
    const replies = all.filter((m) => m.parentId === rootId).sort((a, b) => a.ts - b.ts);
    return { root, replies };
  },
  search: (q: string, opts?: { kind?: 'all' | 'messages' | 'files' | 'links' }) => {
    const kind = opts?.kind || 'all';
    const text = (q || '').toLowerCase().trim();
    const list = get().messages;
    return list.filter((m) => {
      const hasFile = (m.attachments || []).length > 0;
      const link = hasLink(m.text || '');
      const textHit = text ? (m.text || '').toLowerCase().includes(text) : true;
      if (!textHit) return false;
      if (kind === 'messages') return !hasFile && !link;
      if (kind === 'files') return hasFile;
      if (kind === 'links') return link;
      return true;
    });
  },
});
