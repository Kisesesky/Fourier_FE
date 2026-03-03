// app/(workspace)/workspace/[teamId]/[projectId]/chat/_model/types/apu.types.ts
import { z } from 'zod';
import { AnalyticsSchema, ChannelResponseSchema, MessageResponseSchema } from '../schemas/chat-api.schemas';

export type ChannelResponse = z.infer<typeof ChannelResponseSchema>;
export type MessageResponse = z.infer<typeof MessageResponseSchema>;
export type AnalyticsResponse = z.infer<typeof AnalyticsSchema>;
