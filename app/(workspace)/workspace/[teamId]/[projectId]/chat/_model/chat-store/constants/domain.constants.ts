// app/(workspace)/workspace/[teamId]/[projectId]/chat/_model/chat-store/constants/domain.constants.ts
import type { Channel, Workspace } from '../../types';

export const CHANNEL_TYPE = {
  DM: 'DM',
  PUBLIC: 'PUBLIC',
} as const;

export const DEFAULT_HUDDLE_MEMBER_IDS: string[] = [];
export const FALLBACK_WORKSPACE_ID = 'workspace';

export const normalizeColor = (value?: string) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const withoutHash = trimmed.replace(/^#/, '');
  if (!withoutHash) return undefined;
  return `#${withoutHash}`;
};

export const inferChannelKind = (channel: Pick<Channel, 'id' | 'name' | 'isDM'>): 'text' | 'voice' | 'video' => {
  if (channel.isDM || channel.id.startsWith('dm:')) return 'text';
  const lower = `${channel.name || ''}`.toLowerCase();
  if (lower.includes('[voice]') || lower.includes('voice') || lower.includes('음성')) return 'voice';
  if (lower.includes('[video]') || lower.includes('video') || lower.includes('화상')) return 'video';
  return 'text';
};

export const buildWorkspace = (id: string, channels: Channel[]): Workspace => ({
  id,
  name: 'Project Chat',
  sections: [
    { id: `${id}:starred`, title: 'Starred', type: 'starred', itemIds: [], collapsed: false },
    { id: `${id}:channels`, title: 'Channels', type: 'channels', itemIds: channels.map((ch) => ch.id), collapsed: false },
    { id: `${id}:dms`, title: 'Direct Messages', type: 'dms', itemIds: [], collapsed: false },
  ],
});

export const parseDmParticipantIds = (channelId: string): string[] => {
  const raw = channelId.startsWith('dm:') ? channelId.slice(3) : channelId;
  if (!raw) return [];
  return raw.split('+').map((item) => item.trim()).filter(Boolean);
};
