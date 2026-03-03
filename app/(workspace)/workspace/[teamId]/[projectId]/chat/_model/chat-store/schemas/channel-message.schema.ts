// app/(workspace)/workspace/[teamId]/[projectId]/chat/_model/chat-store/schemas/channel-message.schema.ts
import { z } from 'zod';

export const ChannelMessageResponseSchema = z.object({
  id: z.string(),
  content: z.string().optional(),
  senderId: z.string(),
  sender: z.object({ id: z.string(), name: z.string(), avatar: z.string().optional() }).optional(),
  reply: z
    .object({
      id: z.string(),
      content: z.string().optional(),
      sender: z.object({ id: z.string(), name: z.string(), avatar: z.string().optional() }),
      isDeleted: z.boolean(),
    })
    .optional(),
  createdAt: z.string(),
  editedAt: z.string().optional(),
  threadParentId: z.string().optional(),
  thread: z.object({ count: z.number() }).optional(),
  reactions: z.array(z.object({ emoji: z.string(), count: z.number(), reactedByMe: z.boolean().optional() })).optional(),
  mentions: z.array(z.string()).optional(),
});
