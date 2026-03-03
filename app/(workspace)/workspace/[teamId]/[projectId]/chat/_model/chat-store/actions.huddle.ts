// app/(workspace)/workspace/[teamId]/[projectId]/chat/_model/chat-store/actions.huddle.ts
import type { HuddleState } from './types';
import { CHAT_BROADCAST_EVENTS } from './constants/event.constants';
import { DEFAULT_HUDDLE_MEMBER_IDS } from './constants';

type HuddleDeps = {
  set: (partial: Record<string, unknown>) => void;
  get: () => {
    channelId: string;
    me: { id: string };
    huddles: Record<string, HuddleState>;
  };
  broadcast: BroadcastChannel | null;
};

export const createHuddleActions = ({ set, get, broadcast }: HuddleDeps) => ({
  startHuddle: (ch?: string, mode: 'audio' | 'video' = 'audio') => {
    const channelId = ch || get().channelId;
    const curr = get().huddles;
    const { me } = get();
    const fallbackMembers = DEFAULT_HUDDLE_MEMBER_IDS.length > 0 ? DEFAULT_HUDDLE_MEMBER_IDS : [me.id];
    const hs: Record<string, HuddleState> = {
      ...curr,
      [channelId]: { active: true, startedAt: Date.now(), muted: false, members: fallbackMembers, mode },
    };
    set({ huddles: hs });
    broadcast?.postMessage({ type: CHAT_BROADCAST_EVENTS.HUDDLE_STATE, channelId, state: hs[channelId] });
  },
  stopHuddle: (ch?: string) => {
    const channelId = ch || get().channelId;
    const curr = get().huddles;
    const hs: Record<string, HuddleState> = { ...curr, [channelId]: { active: false } };
    set({ huddles: hs });
    broadcast?.postMessage({ type: CHAT_BROADCAST_EVENTS.HUDDLE_STATE, channelId, state: hs[channelId] });
  },
  toggleHuddleMute: (ch?: string) => {
    const channelId = ch || get().channelId;
    const curr = get().huddles[channelId] || { active: false };
    const next = { ...curr, muted: !curr.muted };
    const hs: Record<string, HuddleState> = { ...get().huddles, [channelId]: next };
    set({ huddles: hs });
    broadcast?.postMessage({ type: CHAT_BROADCAST_EVENTS.HUDDLE_STATE, channelId, state: next });
  },
});
