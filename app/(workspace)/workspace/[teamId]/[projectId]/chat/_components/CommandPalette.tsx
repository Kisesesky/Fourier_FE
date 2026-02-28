// app/(workspace)/workspace/[teamId]/[projectId]/chat/_components/CommandPalette.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Hash, AtSign, Link as LinkIcon, File, MessageSquare, Command, CornerDownLeft,
  Search, ArrowUp, ArrowDown, GitBranch
} from "lucide-react";
import { useChat } from "@/workspace/chat/_model/store";
import { extractUrls } from "./LinkPreview";
import { CHAT_SLASH_COMMANDS } from "@/workspace/chat/_model/view.constants";
import type { CommandPaletteKind, CommandPaletteRow } from "@/workspace/chat/_model/view.types";

function score(query: string, text: string) {
  // 아주 얕은 패턴: 포함 점수 + 접두 가산
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const t = text.toLowerCase();
  const pos = t.indexOf(q);
  if (pos < 0) return -1;
  return 100 - pos;
}

const isImageUrl = (url: string) => /^https?:\/\/\S+\.(png|jpe?g|gif|webp|bmp|svg)(\?\S*)?$/i.test(url);

const isYouTubeUrl = (url: string) => {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    return host === "youtu.be" || host === "youtube.com" || host === "m.youtube.com";
  } catch {
    return false;
  }
};

const parseYouTubeVideoId = (url: string): string | null => {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.replace("/", "").trim();
      return id || null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/")[2] || null;
      if (u.pathname.startsWith("/embed/")) return u.pathname.split("/")[2] || null;
    }
    return null;
  } catch {
    return null;
  }
};

const getMessageTypeLabel = (text: string, attachments?: Array<{ id: string; name: string; type: string; size: number }>) => {
  if (attachments && attachments.length > 0) return "파일";
  const raw = (text || "").trim();
  if (/^https?:\/\/\S+$/i.test(raw)) {
    if (isImageUrl(raw)) return "이미지";
    if (isYouTubeUrl(raw)) return "유튜브";
    return "링크";
  }
  if (/```[\s\S]*```/.test(raw)) return "코드";
  return "텍스트";
};

const getTypeBadgeClass = (typeLabel: string) => {
  switch (typeLabel) {
    case "코드":
      return "bg-black text-white";
    case "이미지":
      return "bg-sky-200 text-blue-900";
    case "링크":
      return "bg-indigo-200 text-indigo-900";
    case "유튜브":
      return "bg-red-500 text-white";
    case "파일":
      return "bg-emerald-200 text-emerald-900";
    default:
      return "bg-slate-500/15 text-slate-600";
  }
};

const getTypeFilterChipClass = (typeLabel: string, checked: boolean) => {
  const base = "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 transition-colors";
  if (!checked) return `${base} border-border/60 bg-background/50 text-muted`;
  switch (typeLabel) {
    case "코드":
      return `${base} border-black/80 bg-black text-white`;
    case "이미지":
      return `${base} border-sky-300 bg-sky-200 text-blue-900`;
    case "링크":
      return `${base} border-indigo-300 bg-indigo-200 text-indigo-900`;
    case "유튜브":
      return `${base} border-red-500 bg-red-500 text-white`;
    case "파일":
      return `${base} border-emerald-300 bg-emerald-200 text-emerald-900`;
    default:
      return `${base} border-slate-300 bg-slate-200 text-slate-700`;
  }
};

export default function CommandPalette({
  open, onOpenChange, scope = "global"
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  scope?: "global" | "channel";
}) {
  const {
    me, users, channels, channelId, setChannel, messages
  } = useChat();

  const inputRef = useRef<HTMLInputElement>(null);
  const userFilterRef = useRef<HTMLDivElement | null>(null);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const [sectionFilter, setSectionFilter] = useState({ channel: true, thread: true });
  const [typeFilter, setTypeFilter] = useState({
    텍스트: true,
    이미지: true,
    링크: true,
    코드: true,
    파일: true,
    유튜브: true,
  });
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userFilterOpen, setUserFilterOpen] = useState(false);
  const [sortMode, setSortMode] = useState<"latest" | "oldest">("latest");
  const [detailOpen, setDetailOpen] = useState(false);

  // 데이터 소스 → 행 변환
  const rows = useMemo<CommandPaletteRow[]>(() => {
    const out: CommandPaletteRow[] = [];

    if (scope === "global") {
      // 채널
      for (const c of channels) {
        out.push({
          id: `ch:${c.id}`,
          kind: 'channel',
          label: c.name,
          desc: '채널',
          aux: c.id,
          payload: { id: c.id }
        });
      }

      // 사용자 (DM 후보)
      for (const u of Object.values(users)) {
        if (u.id === me.id) continue;
        out.push({
          id: `u:${u.id}`,
          kind: 'user',
          label: u.name,
          desc: '사용자',
          payload: { id: u.id, name: u.name }
        });
      }
    }

    // 메시지(최근 200개 내 텍스트가 있는 것만)
    const ms = messages.slice(-200).filter(m => (m.text || '').trim().length > 0);
    for (const m of ms) {
      out.push({
        id: `m:${m.id}`,
        kind: 'message',
        label: (m.text || '').replace(/\s+/g, ' ').slice(0, 120),
        desc: m.author,
        aux: new Date(m.ts).toLocaleString(),
        payload: {
          id: m.id,
          parentId: m.parentId,
          author: m.author,
          authorId: m.authorId,
          ts: m.ts,
          text: m.text || "",
          attachments: m.attachments || [],
        }
      });

      if (scope === "channel") continue;

      // 메시지에서 링크 추출
      for (const url of extractUrls(m.text || "")) {
        out.push({
          id: `l:${m.id}:${url}`,
          kind: 'link',
          label: url,
          desc: m.author,
          aux: new Date(m.ts).toLocaleString(),
          payload: { url, msgId: m.id, author: m.author, authorId: m.authorId, ts: m.ts }
        });
      }
    }

    // 첨부(간단 표기)
    for (const m of ms) {
      if (!m.attachments || m.attachments.length === 0) continue;
      for (const a of m.attachments) {
        out.push({
          id: `f:${m.id}:${a.id}`,
          kind: 'file',
          label: a.name,
          desc: m.author,
          aux: new Date(m.ts).toLocaleString(),
          payload: { msgId: m.id, attachment: a, author: m.author, authorId: m.authorId, ts: m.ts }
        });
      }
    }

    if (scope === "global") {
      // 슬래시 명령
      for (const s of CHAT_SLASH_COMMANDS) {
        out.push({
          id: `s:${s.id}`,
          kind: 'slash',
          label: s.label,
          desc: s.desc,
          payload: s
        });
      }
    }

    return out;
  }, [channels, users, me.id, messages, scope]);

  // 필터
  const filtered = useMemo<CommandPaletteRow[]>(() => {
    const query = q.trim();
    if (!query && scope !== "channel") return rows.slice(0, 80);

    if (scope === "channel") {
      const searched = (query ? rows : rows.slice(0, 200))
        .map((r) => ({ r, s: Math.max(score(query, r.label), score(query, r.desc || ''), score(query, r.aux || '')) }))
        .filter((x) => (query ? x.s >= 0 : true))
        .sort((a, b) => b.s - a.s)
        .map((x) => x.r)
        .slice(0, 200);

      const scoped = searched.filter((r) => {
        if (r.kind !== "message") return false;
        const isThread = !!r.payload?.parentId;
        if (isThread && !sectionFilter.thread) return false;
        if (!isThread && !sectionFilter.channel) return false;
        const typeLabel = getMessageTypeLabel(String(r.payload?.text || ""), r.payload?.attachments || []);
        if (!typeFilter[typeLabel as keyof typeof typeFilter]) return false;
        if (selectedUserIds.length > 0 && !selectedUserIds.includes(String(r.payload?.authorId || ""))) return false;
        return true;
      });
      const sorted = [...scoped].sort((a, b) => {
        const at = Number(a.payload?.ts || 0);
        const bt = Number(b.payload?.ts || 0);
        return sortMode === "latest" ? bt - at : at - bt;
      });
      return sorted;
    }

    // 접두어 모드: # @ / 로 범주 빠르게
    if (query.startsWith('#')) {
      const k = query.slice(1);
      return rows
        .filter(r => r.kind === 'channel')
        .map(r => ({ r, s: score(k, r.label) }))
        .filter(x => x.s >= 0)
        .sort((a,b)=> b.s - a.s)
        .map(x => x.r)
        .slice(0, 80);
    }
    if (query.startsWith('@')) {
      const k = query.slice(1);
      return rows
        .filter(r => r.kind === 'user')
        .map(r => ({ r, s: score(k, r.label) }))
        .filter(x => x.s >= 0)
        .sort((a,b)=> b.s - a.s)
        .map(x => x.r)
        .slice(0, 80);
    }
    if (query.startsWith('/')) {
      const k = query.slice(1);
      return rows
        .filter(r => r.kind === 'slash')
        .map(r => ({ r, s: score(k, r.label) + score(k, r.desc || '') }))
        .filter(x => x.s >= 0)
        .sort((a,b)=> b.s - a.s)
        .map(x => x.r)
        .slice(0, 80);
    }

    // 일반 검색
    return rows
      .map(r => ({ r, s: Math.max(score(query, r.label), score(query, r.desc || ''), score(query, r.aux || '')) }))
      .filter(x => x.s >= 0)
      .sort((a,b)=> b.s - a.s)
      .map(x => x.r)
      .slice(0, 80);
  }, [q, rows, scope, sectionFilter, typeFilter, selectedUserIds, sortMode]);

  useEffect(() => {
    if (!open) return;
    setIdx(0);
    if (scope === "channel") setDetailOpen(false);
    setTimeout(() => inputRef.current?.focus(), 10);
  }, [open, scope]);

  const channelMessageRows = useMemo(
    () => rows.filter((row) => row.kind === "message"),
    [rows],
  );
  const userOptions = useMemo(() => {
    const map = new Map<string, { name: string; avatarUrl?: string }>();
    channelMessageRows.forEach((row) => {
      const authorId = String(row.payload?.authorId || "");
      const author = String(row.payload?.author || "");
      if (!authorId || !author) return;
      if (!map.has(authorId)) map.set(authorId, { name: author, avatarUrl: users[authorId]?.avatarUrl });
    });
    return Array.from(map.entries()).map(([id, value]) => ({ id, name: value.name, avatarUrl: value.avatarUrl }));
  }, [channelMessageRows, users]);

  useEffect(() => {
    if (!userFilterOpen) return;
    const onDown = (event: MouseEvent) => {
      if (!userFilterRef.current) return;
      if (!userFilterRef.current.contains(event.target as Node)) {
        setUserFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [userFilterOpen]);

  // 단축키: 위/아래/엔터/esc
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
      if (e.key === 'ArrowDown') { setIdx(i => Math.min(i + 1, Math.max(0, filtered.length - 1))); e.preventDefault(); }
      if (e.key === 'ArrowUp') { setIdx(i => Math.max(i - 1, 0)); e.preventDefault(); }
      if (e.key === 'Enter') { if (filtered[idx]) { run(filtered[idx]); } }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, filtered, idx]);

  const scrollMainTo = (id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // 실행
  const run = async (r: CommandPaletteRow) => {
    switch (r.kind) {
      case 'channel':
        setChannel(r.payload.id);
        break;
      case 'user':
        setChannel(`dm:${r.payload.id}`);
        break;
      case 'message':
        // 메시지 위치로만 스크롤 (검색에서 우측 스레드 패널은 열지 않음)
        scrollMainTo(r.payload.id);
        break;
      case 'link': {
        const url = r.payload.url as string;
        window.open(url, '_blank', 'noopener,noreferrer');
        break;
      }
      case 'file': {
        const { attachment } = r.payload;
        if (attachment?.dataUrl) window.open(attachment.dataUrl, '_blank', 'noopener,noreferrer');
        break;
      }
      case 'slash': {
        // 입력창에 텍스트 삽입 이벤트
        const ev = new CustomEvent('chat:insert-text', { detail: { text: r.payload.insert || '' } });
        window.dispatchEvent(ev);
        break;
      }
    }
    onOpenChange(false);
  };

  if (!open) return null;
  const activeId = filtered[idx]?.id;
  const channelRows = scope === "channel" ? filtered.filter((row) => row.kind === "message" && !row.payload?.parentId) : [];
  const threadRows = scope === "channel" ? filtered.filter((row) => row.kind === "message" && !!row.payload?.parentId) : [];

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={()=> onOpenChange(false)} />
      <div className="absolute left-1/2 top-16 -translate-x-1/2 w-[min(720px,calc(100vw-1rem))] rounded-2xl border border-border bg-panel shadow-panel sm:top-24 sm:w-[min(720px,calc(100vw-2rem))]">
        {/* 입력 */}
        <div className="px-3 py-2 border-b border-border flex items-center gap-2">
          {scope === "channel" ? <Search size={16} className="opacity-70" /> : <Command size={16} className="opacity-70" />}
          <input
            ref={inputRef}
            value={q}
            onChange={e=> setQ(e.target.value)}
            placeholder={scope === "channel" ? "현재 채널에서 메시지·링크·파일 검색…" : "채널(#), 사용자(@), 슬래시(/), 메시지·링크·파일 검색…"}
            className="flex-1 bg-transparent outline-none text-sm"
          />
          {scope !== "channel" && (
            <div className="text-[11px] text-muted hidden md:flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 rounded border border-border bg-subtle/20">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded border border-border bg-subtle/20">↓</kbd>
              <span className="opacity-60">이동</span>
              <kbd className="px-1.5 py-0.5 rounded border border-border bg-subtle/20">Enter</kbd>
              <span className="opacity-60">실행</span>
              <kbd className="px-1.5 py-0.5 rounded border border-border bg-subtle/20">Esc</kbd>
              <span className="opacity-60">닫기</span>
            </div>
          )}
        </div>
        {scope === "channel" && (
          <div className="border-b border-border bg-slate-100/70 px-3 py-1.5 text-right dark:bg-slate-800/40">
            <button
              type="button"
              className="rounded-md border border-border/70 bg-slate-200/80 px-2.5 py-1 text-[11px] text-slate-700 hover:bg-slate-300/80 dark:bg-slate-700/70 dark:text-slate-200 dark:hover:bg-slate-600/80"
              onClick={() => setDetailOpen((prev) => !prev)}
            >
              {detailOpen ? "상세검색 닫기" : "상세검색"}
            </button>
          </div>
        )}
        {scope === "channel" && detailOpen && (
          <div className="border-b border-border bg-background/30 px-3 py-2.5 text-xs">
            <div className="space-y-2">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
                <div className="rounded-lg border border-border/50 bg-background/40 px-2 py-2 md:col-span-7">
                  <div className="mb-1.5 text-[11px] font-semibold text-muted">구분</div>
                  <div className="flex flex-wrap items-center gap-2 text-[12px]">
                    <label className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/50 px-2 py-1">
                      <input
                        type="checkbox"
                        checked={sectionFilter.channel && sectionFilter.thread}
                        onChange={(e) => setSectionFilter({ channel: e.target.checked, thread: e.target.checked })}
                      />
                      전체
                    </label>
                    <label className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/50 px-2 py-1">
                      <input
                        type="checkbox"
                        checked={sectionFilter.channel}
                        onChange={(e) => setSectionFilter((prev) => ({ ...prev, channel: e.target.checked }))}
                      />
                      채널
                    </label>
                    <label className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/50 px-2 py-1">
                      <input
                        type="checkbox"
                        checked={sectionFilter.thread}
                        onChange={(e) => setSectionFilter((prev) => ({ ...prev, thread: e.target.checked }))}
                      />
                      스레드
                    </label>
                  </div>
                </div>
                <div className="rounded-lg border border-border/50 bg-background/40 px-2 py-2 md:col-span-5">
                  <div className="mb-1.5 text-[11px] font-semibold text-muted">정렬</div>
                  <select
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value as "latest" | "oldest")}
                    className="w-full rounded border border-border/60 bg-background/60 px-2 py-1 text-xs text-muted"
                  >
                    <option value="latest">최신순</option>
                    <option value="oldest">오래된순</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
                <div className="rounded-lg border border-border/50 bg-background/40 px-2 py-2 md:col-span-8">
                  <div className="mb-1.5 text-[11px] font-semibold text-muted">타입</div>
                  <div className="flex flex-wrap items-center gap-2 text-[12px]">
                    {(["텍스트", "이미지", "링크", "코드", "파일", "유튜브"] as const).map((key) => (
                      <label key={key} className={getTypeFilterChipClass(key, typeFilter[key])}>
                        <input
                          type="checkbox"
                          checked={typeFilter[key]}
                          onChange={(e) => setTypeFilter((prev) => ({ ...prev, [key]: e.target.checked }))}
                        />
                        {key}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-border/50 bg-background/40 px-2 py-2 md:col-span-4">
                  <div className="mb-1.5 text-[11px] font-semibold text-muted">유저</div>
                  <div className="relative" ref={userFilterRef}>
                    <button
                      type="button"
                      className="w-full rounded border border-border bg-background/60 px-2 py-1 text-left text-xs hover:bg-subtle/60"
                      onClick={() => setUserFilterOpen((prev) => !prev)}
                    >
                      {selectedUserIds.length > 0 ? `${selectedUserIds.length}명 선택` : "전체"}
                    </button>
                    {userFilterOpen && (
                      <div className="absolute right-0 z-30 mt-1 w-52 rounded-lg border border-border bg-panel p-2 shadow-lg">
                        <label className="mb-1 flex items-center gap-1.5 rounded-md px-1 py-1 hover:bg-subtle/60">
                          <input
                            type="checkbox"
                            checked={selectedUserIds.length === 0}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedUserIds([]);
                            }}
                          />
                          전체
                        </label>
                        <div className="max-h-40 space-y-1 overflow-y-auto">
                          {userOptions.map((u) => (
                            <label key={u.id} className="flex items-center gap-1.5 rounded-md px-1 py-1 hover:bg-subtle/60">
                              <input
                                type="checkbox"
                                checked={selectedUserIds.includes(u.id)}
                                onChange={(e) =>
                                  setSelectedUserIds((prev) =>
                                    e.target.checked ? Array.from(new Set([...prev, u.id])) : prev.filter((id) => id !== u.id)
                                  )
                                }
                              />
                              <span className="h-5 w-5 overflow-hidden rounded-full bg-subtle/70 text-[9px] font-semibold text-foreground">
                                {u.avatarUrl ? (
                                  <img src={u.avatarUrl} alt={u.name} className="h-full w-full object-cover" />
                                ) : (
                                  <span className="flex h-full w-full items-center justify-center">{u.name.slice(0, 2).toUpperCase()}</span>
                                )}
                              </span>
                              <span className="truncate">{u.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 리스트 */}
        <div className="max-h-[60vh] overflow-y-auto py-1">
          {filtered.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-muted">결과가 없습니다.</div>
          )}
          {scope === "channel" ? (
            <>
              <div className="mx-3 mt-2 rounded-xl border border-border/70 bg-panel/40">
                <div className="flex items-center justify-between border-b border-border/70 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                  <span>채널</span>
                  <span className="rounded-full bg-subtle/70 px-2 py-0.5 text-[10px] normal-case">{channelRows.length}</span>
                </div>
                {channelRows.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted">채널 메시지 결과가 없습니다.</div>
                ) : (
                  channelRows.map((r) => {
                    const resultIndex = filtered.findIndex((row) => row.id === r.id);
                    const typeLabel = getMessageTypeLabel(String(r.payload?.text || ""), r.payload?.attachments || []);
                    return (
                      <button
                        key={r.id}
                        onMouseEnter={() => setIdx(resultIndex)}
                        onClick={() => run(r)}
                        className="w-full px-3 py-2 text-left"
                      >
                        <div className={`flex items-start gap-3 rounded-lg border border-border/60 bg-panel/80 px-3 py-2.5 transition-colors hover:bg-zinc-200/40 dark:hover:bg-zinc-700/30 ${activeId === r.id ? 'bg-subtle/60' : ''}`}>
                        <div className="h-8 w-8 overflow-hidden rounded-full bg-subtle/70 text-[10px] font-semibold text-foreground">
                          {users[r.payload?.authorId]?.avatarUrl ? (
                            <img
                              src={users[r.payload.authorId].avatarUrl}
                              alt={r.payload?.author || "User"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center">
                              {(r.payload?.author || "?").slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold text-foreground">{r.payload?.author || "Unknown"}</span>
                            <span className="shrink-0 text-[11px] text-muted">
                              {r.payload?.ts
                                ? new Date(r.payload.ts).toLocaleString("ko-KR", { hour: "numeric", minute: "2-digit", hour12: true, month: "2-digit", day: "2-digit" })
                                : ""}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-1">
                            <span className="inline-flex rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold text-sky-500">채널</span>
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${getTypeBadgeClass(typeLabel)}`}>
                              {typeLabel}
                            </span>
                          </div>
                          {(() => {
                            const rawText = String(r.payload?.text || "").trim();
                            const isSingleUrl = /^https?:\/\/\S+$/i.test(rawText);
                            if (isSingleUrl && isImageUrl(rawText)) {
                              return (
                                <div className="mt-1 overflow-hidden rounded-lg border border-border/60 bg-background/70">
                                  <img src={rawText} alt="image preview" className="max-h-40 max-w-[260px] w-full object-cover" />
                                </div>
                              );
                            }
                            if (isSingleUrl && isYouTubeUrl(rawText)) {
                              const videoId = parseYouTubeVideoId(rawText);
                              if (videoId) {
                                return (
                                  <div className="mt-1 overflow-hidden rounded-lg border border-border/60 bg-background/70">
                                    <div className="relative h-40 max-w-[260px] w-full bg-black/70">
                                      <img
                                        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
                                        alt="YouTube preview"
                                        className="h-full w-full object-cover"
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="rounded-full bg-black/50 px-3 py-1 text-[11px] font-semibold text-white">YouTube</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                            }
                            return <p className="mt-1 line-clamp-2 text-sm text-foreground/90">{r.label}</p>;
                          })()}
                        </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="mx-3 mt-3 rounded-xl border border-border/70 bg-panel/40">
                <div className="flex items-center justify-between border-b border-border/70 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                  <span>스레드</span>
                  <span className="rounded-full bg-subtle/70 px-2 py-0.5 text-[10px] normal-case">{threadRows.length}</span>
                </div>
                {threadRows.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted">스레드 메시지 결과가 없습니다.</div>
                ) : (
                  threadRows.map((r) => {
                    const resultIndex = filtered.findIndex((row) => row.id === r.id);
                    const typeLabel = getMessageTypeLabel(String(r.payload?.text || ""), r.payload?.attachments || []);
                    return (
                      <button
                        key={r.id}
                        onMouseEnter={() => setIdx(resultIndex)}
                        onClick={() => run(r)}
                        className="w-full px-3 py-2 text-left"
                      >
                        <div className={`flex items-start gap-3 rounded-lg border border-border/60 bg-panel/80 px-3 py-2.5 transition-colors hover:bg-zinc-200/40 dark:hover:bg-zinc-700/30 ${activeId === r.id ? 'bg-subtle/60' : ''}`}>
                        <div className="h-8 w-8 overflow-hidden rounded-full bg-subtle/70 text-[10px] font-semibold text-foreground">
                          {users[r.payload?.authorId]?.avatarUrl ? (
                            <img
                              src={users[r.payload.authorId].avatarUrl}
                              alt={r.payload?.author || "User"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center">
                              {(r.payload?.author || "?").slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold text-foreground">{r.payload?.author || "Unknown"}</span>
                            <span className="shrink-0 text-[11px] text-muted">
                              {r.payload?.ts
                                ? new Date(r.payload.ts).toLocaleString("ko-KR", { hour: "numeric", minute: "2-digit", hour12: true, month: "2-digit", day: "2-digit" })
                                : ""}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-1">
                            <span className="inline-flex rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold text-violet-500">스레드</span>
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${getTypeBadgeClass(typeLabel)}`}>
                              {typeLabel}
                            </span>
                          </div>
                          {(() => {
                            const rawText = String(r.payload?.text || "").trim();
                            const isSingleUrl = /^https?:\/\/\S+$/i.test(rawText);
                            if (isSingleUrl && isImageUrl(rawText)) {
                              return (
                                <div className="mt-1 overflow-hidden rounded-lg border border-border/60 bg-background/70">
                                  <img src={rawText} alt="image preview" className="max-h-40 max-w-[260px] w-full object-cover" />
                                </div>
                              );
                            }
                            if (isSingleUrl && isYouTubeUrl(rawText)) {
                              const videoId = parseYouTubeVideoId(rawText);
                              if (videoId) {
                                return (
                                  <div className="mt-1 overflow-hidden rounded-lg border border-border/60 bg-background/70">
                                    <div className="relative h-40 max-w-[260px] w-full bg-black/70">
                                      <img
                                        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
                                        alt="YouTube preview"
                                        className="h-full w-full object-cover"
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="rounded-full bg-black/50 px-3 py-1 text-[11px] font-semibold text-white">YouTube</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                            }
                            return <p className="mt-1 line-clamp-2 text-sm text-foreground/90">{r.label}</p>;
                          })()}
                        </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            filtered.map((r, i) => (
              <button
                key={r.id}
                onMouseEnter={()=> setIdx(i)}
                onClick={()=> run(r)}
                className={`w-full px-3 py-2 text-left ${i===idx?'bg-subtle/60':''}`}
              >
                <div className="flex items-center gap-2">
                  <span className="opacity-80">{iconFor(r.kind)}</span>
                  <div className="min-w-0">
                    <div className="truncate text-sm">{r.label}</div>
                    <div className="truncate text-[11px] text-muted">{r.desc || ' '}</div>
                  </div>
                  <div className="ml-auto text-[11px] text-muted">{r.aux}</div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* 푸터 */}
        <div className="px-3 py-2 border-t border-border flex items-center gap-2 text-[11px] text-muted">
          <Search size={12}/> {scope === "channel" ? `현재 채널 결과: ${filtered.length}` : channelId}
          {scope !== "channel" && (
            <div className="ml-auto flex items-center gap-2">
              <ArrowUp size={12}/> / <ArrowDown size={12}/> 이동
              <CornerDownLeft size={12}/> 실행
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function iconFor(k: CommandPaletteKind) {
  switch (k) {
    case 'channel': return <Hash size={14}/>;
    case 'user':    return <AtSign size={14}/>;
    case 'message': return <MessageSquare size={14}/>;
    case 'link':    return <LinkIcon size={14}/>;
    case 'file':    return <File size={14}/>;
    case 'slash':   return <GitBranch size={14}/>;
  }
}
