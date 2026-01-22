'use client';

import { useMemo } from 'react';
import type { Msg } from "@/workspace/chat/_model/types";

const GROUP_WINDOW_MS = 5 * 60 * 1000;

function sameGroup(a: Msg, b: Msg) {
  return a.authorId === b.authorId && Math.abs(a.ts - b.ts) <= GROUP_WINDOW_MS && !a.parentId && !b.parentId;
}

function isSameDay(a: number, b: number) {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

export type MessageSection = {
  head: Msg;
  items: Msg[];
  showDayDivider: boolean;
  showNewDivider: boolean;
};

type UseMessageSectionsParams = {
  messages: Msg[];
  lastReadTs: number;
  meId: string;
  users: Record<string, { id: string; name: string }>;
};

export function useMessageSections({
  messages,
  lastReadTs,
  meId,
  users,
}: UseMessageSectionsParams) {
  return useMemo(() => {
    const indexMap = new Map<string, number>();
    messages.forEach((msg, idx) => indexMap.set(msg.id, idx));

    const roots = messages.filter((m) => !m.parentId);
    const sections: MessageSection[] = [];
    for (const root of roots) {
      const lastSection = sections[sections.length - 1];
      if (lastSection && sameGroup(root, lastSection.head)) {
        lastSection.items.push(root);
      } else {
        sections.push({
          head: root,
          items: [root],
          showDayDivider: false,
          showNewDivider: false,
        });
      }
    }

    const newIdx = messages.findIndex((m) => m.ts > lastReadTs);
    sections.forEach((section, idx) => {
      const headIndex = indexMap.get(section.head.id) ?? 0;
      const prevMsg = messages[headIndex - 1];
      section.showDayDivider = !prevMsg || !isSameDay(prevMsg.ts, section.head.ts);
      section.showNewDivider = newIdx >= 0 && headIndex === newIdx;
      if (idx > 0) {
        const prevSection = sections[idx - 1];
        if (prevSection && sameGroup(section.head, prevSection.head)) {
          // ensure consecutive groups on same time window don't duplicate day divider logic
          section.showDayDivider = section.showDayDivider || false;
        }
      }
    });

    const otherSeen: Record<string, string[]> = {};
    for (const msg of messages) {
      const names = (msg.seenBy || [])
        .filter((uid) => uid !== meId)
        .map((uid) => users[uid]?.name || uid);
      otherSeen[msg.id] = names;
    }

    const rootIds = sections.map((section) => section.head.id);
    const rootIndexMap = new Map<string, number>();
    rootIds.forEach((id, idx) => rootIndexMap.set(id, idx));

    return {
      sections,
      otherSeen,
      rootIds,
      rootIndexMap,
    };
  }, [messages, lastReadTs, meId, users]);
}
