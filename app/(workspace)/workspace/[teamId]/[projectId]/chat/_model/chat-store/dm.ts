// app/(workspace)/workspace/[teamId]/[projectId]/chat/_model/chat-store/dm.ts
import { lsGet, lsSet } from '@/lib/persist';
import { getOrCreateDmRoom } from '../../_service/api';
import { DM_ROOM_BY_CHANNEL_KEY, parseDmParticipantIds } from './constants';

export const resolveDmRoomId = async (
  channelId: string,
  channelMembers: Record<string, string[]>,
  meId: string,
): Promise<string | null> => {
  if (!channelId.startsWith('dm:')) return null;
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
