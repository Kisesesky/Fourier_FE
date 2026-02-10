// app/(workspace)/workspace/[teamId]/[projectId]/chat/_model/hooks/useThreadItems.ts
'use client';

import { useMemo } from "react";
import type { Channel, Msg } from "@/workspace/chat/_model/types";

export type ThreadItem = {
  channelId: string;
  channelName: string;
  rootId: string;
  root: Msg;
  replies: Msg[];
  lastTs: number;
  unread: number;
  lastPreview: string;
  lastAuthor?: string;
};

const MSGS_KEY = (id: string) => `fd.chat.messages:${id}`;

const summarize = (msg?: Msg) => {
  if (!msg) return "";
  if (msg.text?.trim()) return msg.text.trim().slice(0, 120);
  return "";
};

export function useThreadItems({
  channels,
  lastReadAt,
  meId,
  activityKey,
}: {
  channels: Channel[];
  lastReadAt: Record<string, number>;
  meId: string;
  activityKey?: Record<string, unknown>;
}) {
  return useMemo<ThreadItem[]>(() => {
    if (typeof window === "undefined") return [];
    const items: ThreadItem[] = [];
    const channelList = channels.filter((c) => !(c.isDM || c.id.startsWith("dm:")));
    channelList.forEach((channel) => {
      const raw = localStorage.getItem(MSGS_KEY(channel.id));
      if (!raw) return;
      let messages: Msg[] = [];
      try {
        messages = JSON.parse(raw) as Msg[];
      } catch {
        return;
      }
      const rootMap = new Map<string, Msg>();
      const repliesByRoot = new Map<string, Msg[]>();
      messages.forEach((m) => {
        if (!m.parentId) {
          rootMap.set(m.id, m);
          return;
        }
        const list = repliesByRoot.get(m.parentId) || [];
        list.push(m);
        repliesByRoot.set(m.parentId, list);
      });

      const rootIds = new Set<string>();
      repliesByRoot.forEach((_list, rootId) => rootIds.add(rootId));
      rootMap.forEach((root) => {
        if ((root.threadCount ?? 0) > 0) rootIds.add(root.id);
      });

      rootIds.forEach((rootId) => {
        const root = rootMap.get(rootId);
        if (!root) return;
        const replies = (repliesByRoot.get(rootId) || []).sort((a, b) => a.ts - b.ts);
        const participated =
          root.authorId === meId || replies.some((reply) => reply.authorId === meId);
        if (!participated) return;
        const last = replies[replies.length - 1] ?? root;
        const unreadBase = lastReadAt[channel.id] || 0;
        const unread = replies.filter((r) => r.ts > unreadBase).length;
        items.push({
          channelId: channel.id,
          channelName: channel.name?.replace(/^#\s*/, "") || channel.id,
          rootId,
          root,
          replies,
          lastTs: last.ts,
          unread,
          lastPreview: summarize(last),
          lastAuthor: last.author,
        });
      });
    });
    return items.sort((a, b) => b.lastTs - a.lastTs);
  }, [channels, lastReadAt, meId, activityKey]);
}
