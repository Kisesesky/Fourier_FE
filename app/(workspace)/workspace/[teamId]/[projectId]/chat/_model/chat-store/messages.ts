// app/(workspace)/workspace/[teamId]/[projectId]/chat/_model/chat-store/messages.ts
import type { Msg } from '../types';
import { ChannelMessageResponseSchema } from './schemas/channel-message.schema';
import type { ChannelMessageResponse } from './types';

export const sortMessages = (list: Msg[]) =>
  [...list].sort((a, b) => {
    if (a.ts !== b.ts) return a.ts - b.ts;
    return a.id.localeCompare(b.id);
  });

export const decodeHtmlEntities = (input?: string | null) => {
  let next = input ?? '';
  for (let i = 0; i < 5; i += 1) {
    const decoded = next
      .replace(/&(amp);?/gi, '&')
      .replace(/&(quot|quote);?/gi, '"')
      .replace(/&(apos);?/gi, "'")
      .replace(/&#x27;?/gi, "'")
      .replace(/&#39;?/gi, "'")
      .replace(/&(lt);?/gi, '<')
      .replace(/&(gt);?/gi, '>');
    if (decoded === next) break;
    next = decoded;
  }
  return next;
};

export const normalizeMsgEntities = (msg: Msg): Msg => ({
  ...msg,
  text: decodeHtmlEntities(msg.text),
  reply: msg.reply
    ? {
        ...msg.reply,
        content: decodeHtmlEntities(msg.reply.content),
      }
    : undefined,
});

export const normalizeMsgListEntities = (list: Msg[]) => list.map(normalizeMsgEntities);

export const hasLink = (text: string) => /(https?:\/\/[^\s]+)/i.test(text || '');

export const summarizeMessage = (msg?: Msg) => {
  if (!msg) return '';
  if (msg.text && msg.text.trim().length > 0) {
    return msg.text.replace(/\s+/g, ' ').trim().slice(0, 80);
  }
  if (msg.attachments && msg.attachments.length > 0) {
    const count = msg.attachments.length;
    return count === 1 ? '1 attachment' : `${count} attachments`;
  }
  return '';
};

const mapReactions = (
  reactions: Array<{ emoji: string; count: number; reactedByMe?: boolean }> | undefined,
  meId: string,
) => {
  if (!reactions || reactions.length === 0) return undefined;
  const out: Record<string, string[]> = {};
  reactions.forEach((r) => {
    const count = Math.max(0, r.count || 0);
    if (count === 0) return;
    const ids: string[] = [];
    if (r.reactedByMe) ids.push(meId);
    const fill = count - (r.reactedByMe ? 1 : 0);
    for (let i = 0; i < fill; i += 1) {
      ids.push(`anon-${r.emoji}-${i}`);
    }
    out[r.emoji] = ids;
  });
  return Object.keys(out).length > 0 ? out : undefined;
};

export const mapChannelMessage = (message: ChannelMessageResponse, channelId: string, meId: string): Msg => ({
  id: message.id,
  author: message.sender?.name ?? 'Unknown',
  authorId: message.senderId,
  text: decodeHtmlEntities(message.content),
  ts: message.createdAt ? Date.parse(message.createdAt) : Date.now(),
  editedAt: message.editedAt ? Date.parse(message.editedAt) : undefined,
  channelId,
  reply: message.reply
    ? {
        id: message.reply.id,
        content: decodeHtmlEntities(message.reply.content),
        sender: {
          id: message.reply.sender?.id,
          name: message.reply.sender?.name ?? 'Unknown',
          avatar: message.reply.sender?.avatar,
        },
        isDeleted: message.reply.isDeleted,
      }
    : undefined,
  parentId: message.threadParentId ?? undefined,
  threadCount: message.thread?.count ?? undefined,
  reactions: mapReactions(message.reactions, meId),
  mentions: message.mentions ?? undefined,
});

export const parseChannelMessageResponse = (value: unknown): ChannelMessageResponse | null => {
  const parsed = ChannelMessageResponseSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
};
