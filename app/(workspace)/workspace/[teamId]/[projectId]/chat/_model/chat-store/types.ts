// app/(workspace)/workspace/[teamId]/[projectId]/chat/_model/chat-store/types.ts
import { z } from 'zod';
import { ChannelMessageResponseSchema } from './schemas/channel-message.schema';

export type ChannelMessageResponse = z.infer<typeof ChannelMessageResponseSchema>;

export type ChannelMessageEventType =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'reaction'
  | 'thread_created'
  | 'thread_meta';

export type ChannelMessageEvent = {
  type: ChannelMessageEventType;
  roomId?: string;
  payload?: unknown;
};

export type HuddleState = {
  active: boolean;
  startedAt?: number;
  muted?: boolean;
  members?: string[];
  mode?: 'audio' | 'video';
};
