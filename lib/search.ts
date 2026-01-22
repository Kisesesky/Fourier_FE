// lib/search.ts
import type { JSONContent } from "@tiptap/react";
import { getDocs } from "@/workspace/docs/_model/docs";

export type SearchResult =
  | { type: "chat"; id: string; channelId: string; author: string; text: string; ts: number }
  | { type: "issue"; id: string; title: string; status: "todo" | "doing" | "done"; labels?: string[]; due?: string }
  | { type: "doc"; id: string; title: string; snippet: string };

const CHAT_CHANNELS_KEY = "fd.chat.channels";
const CHAT_MSGS_KEY = (id: string) => `fd.chat.messages:${id}`;
const KANBAN_KEY = "fd.kanban.board";

export function getChatIndex(): SearchResult[] {
  if (typeof window === "undefined") return [];
  let out: SearchResult[] = [];
  try {
    const channels = JSON.parse(localStorage.getItem(CHAT_CHANNELS_KEY) || "[]") as {id:string; name:string}[];
    channels.forEach(ch => {
      const msgs = JSON.parse(localStorage.getItem(CHAT_MSGS_KEY(ch.id)) || "[]") as any[];
      msgs.forEach(m => out.push({ type:"chat", id: m.id, channelId: ch.id, author: m.author, text: m.text, ts: m.ts }));
    });
  } catch {}
  return out;
}

export function getKanbanIndex(): SearchResult[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KANBAN_KEY);
  if (!raw) return [];
  try {
    const board = JSON.parse(raw) as Record<"todo"|"doing"|"done", {id:string; title:string; labels?:string[]; due?:string}[]>;
    const out: SearchResult[] = [];
    (["todo","doing","done"] as const).forEach(status => {
      (board[status] || []).forEach(c => out.push({ type:"issue", id:c.id, title:c.title, status, labels:c.labels, due:c.due }));
    });
    return out;
  } catch { return []; }
}

export function getDocsIndex(): SearchResult[] {
  if (typeof window === "undefined") return [];
  const docs = getDocs();

  return docs.map((doc) => {
    const text = extractText(doc.content);
    const snippet = text.slice(0, 160);
    return {
      type: "doc",
      id: doc.id,
      title: doc.title,
      snippet,
    } satisfies SearchResult;
  });
}

function score(q: string, text: string) {
  q = q.toLowerCase().trim();
  text = (text || "").toLowerCase();
  if (!q) return 0;
  if (text.includes(q)) return q.length * 2;
  // 순차 포함 점수
  let t = text, s = 0;
  for (const ch of q) {
    const i = t.indexOf(ch);
    if (i === -1) return 0;
    s += 1; t = t.slice(i + 1);
  }
  return s;
}

export function searchAll(q: string): { results: SearchResult[] } {
  const pool = [
    ...getChatIndex(),
    ...getKanbanIndex(),
    ...getDocsIndex(),
  ];
  const ranked = pool
    .map(r => {
      const text =
        r.type === "chat"  ? `${r.text} ${r.author} ${r.channelId}` :
        r.type === "issue" ? `${r.title} ${(r.labels||[]).join(" ")} ${r.status} ${r.due||""}` :
                             `${r.title} ${r.snippet}`;
      return { r, s: score(q, text) };
    })
    .filter(x => x.s > 0)
    .sort((a,b) => b.s - a.s)
    .map(x => x.r);
  return { results: ranked };
}

function extractText(content?: JSONContent | null): string {
  if (!content) return "";
  let buffer = "";

  const walk = (node?: JSONContent) => {
    if (!node) return;
    if (typeof node.text === "string") {
      buffer += `${node.text} `;
    }
    if (node.content) {
      node.content.forEach((child) => walk(child));
    }
  };

  walk(content);
  return buffer.replace(/\s+/g, " ").trim();
}
