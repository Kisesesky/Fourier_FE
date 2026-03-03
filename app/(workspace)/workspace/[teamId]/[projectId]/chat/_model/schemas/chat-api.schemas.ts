// app/(workspace)/workspace/[teamId]/[projectId]/chat/_model/schemas/chat-apu.schemas.ts
import { z } from 'zod';

export const ChannelResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  projectId: z.string().optional(),
  isDefault: z.boolean().optional(),
  memberIds: z.array(z.string()).optional(),
  createdAt: z.string().optional(),
  type: z.enum(['CHAT', 'VOICE', 'VIDEO']).optional(),
});

export const MessageResponseSchema = z.object({
  id: z.string(),
  content: z.string().optional(),
  senderId: z.string(),
  sender: z.object({ id: z.string(), name: z.string(), avatar: z.string().optional() }).optional(),
  createdAt: z.string(),
  editedAt: z.string().optional(),
  threadParentId: z.string().optional(),
  thread: z.object({ count: z.number() }).optional(),
});

export const AnalyticsSchema = z.object({
  counts: z.array(z.number()),
  granularity: z.string(),
});
