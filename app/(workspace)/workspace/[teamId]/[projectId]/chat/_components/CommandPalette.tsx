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

export default function CommandPalette({
  open, onOpenChange
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const {
    me, users, channels, channelId, setChannel, messages, openThread
  } = useChat();

  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);

  // 데이터 소스 → 행 변환
  const rows = useMemo<CommandPaletteRow[]>(() => {
    const out: CommandPaletteRow[] = [];

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

    // 메시지(최근 200개 내 텍스트가 있는 것만)
    const ms = messages.slice(-200).filter(m => (m.text || '').trim().length > 0);
    for (const m of ms) {
      out.push({
        id: `m:${m.id}`,
        kind: 'message',
        label: (m.text || '').replace(/\s+/g, ' ').slice(0, 120),
        desc: `메시지 — ${m.author}`,
        aux: new Date(m.ts).toLocaleString(),
        payload: { id: m.id, parentId: m.parentId }
      });

      // 메시지에서 링크 추출
      for (const url of extractUrls(m.text || "")) {
        out.push({
          id: `l:${m.id}:${url}`,
          kind: 'link',
          label: url,
          desc: `링크 — ${m.author}`,
          aux: new Date(m.ts).toLocaleString(),
          payload: { url, msgId: m.id }
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
          desc: `파일 — ${a.type || 'file'}`,
          aux: m.author,
          payload: { msgId: m.id, attachment: a }
        });
      }
    }

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

    return out;
  }, [channels, users, me.id, messages]);

  // 필터
  const filtered = useMemo<CommandPaletteRow[]>(() => {
    const query = q.trim();
    if (!query) return rows.slice(0, 80);

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
  }, [q, rows]);

  useEffect(() => {
    if (!open) return;
    setIdx(0);
    setTimeout(() => inputRef.current?.focus(), 10);
  }, [open]);

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
        // 메시지 위치로 스크롤 + 스레드면 우측 열기
        scrollMainTo(r.payload.id);
        if (!r.payload.parentId) {
          // 루트 메시지는 스레드 열기 (디스코드와 유사한 동작)
          openThread(r.payload.id);
          window.dispatchEvent(new Event('chat:open-right'));
        }
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

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={()=> onOpenChange(false)} />
      <div className="absolute left-1/2 top-24 -translate-x-1/2 w-[720px] rounded-2xl border border-border bg-panel shadow-panel">
        {/* 입력 */}
        <div className="px-3 py-2 border-b border-border flex items-center gap-2">
          <Command size={16} className="opacity-70" />
          <input
            ref={inputRef}
            value={q}
            onChange={e=> setQ(e.target.value)}
            placeholder="채널(#), 사용자(@), 슬래시(/), 메시지·링크·파일 검색…"
            className="flex-1 bg-transparent outline-none text-sm"
          />
          <div className="text-[11px] text-muted hidden md:flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-subtle/20">↑</kbd>
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-subtle/20">↓</kbd>
            <span className="opacity-60">이동</span>
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-subtle/20">Enter</kbd>
            <span className="opacity-60">실행</span>
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-subtle/20">Esc</kbd>
            <span className="opacity-60">닫기</span>
          </div>
        </div>

        {/* 리스트 */}
        <div className="max-h-[60vh] overflow-y-auto py-1">
          {filtered.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-muted">결과가 없습니다.</div>
          )}
          {filtered.map((r, i) => (
            <button
              key={r.id}
              onMouseEnter={()=> setIdx(i)}
              onClick={()=> run(r)}
              className={`w-full px-3 py-2 flex items-center gap-2 text-left ${i===idx?'bg-subtle/60':''}`}
            >
              <span className="opacity-80">{iconFor(r.kind)}</span>
              <div className="min-w-0">
                <div className="truncate text-sm">{r.label}</div>
                <div className="truncate text-[11px] text-muted">{r.desc || ' '}</div>
              </div>
              <div className="ml-auto text-[11px] text-muted">{r.aux}</div>
            </button>
          ))}
        </div>

        {/* 푸터 */}
        <div className="px-3 py-2 border-t border-border flex items-center gap-2 text-[11px] text-muted">
          <Search size={12}/> {channelId}
          <div className="ml-auto flex items-center gap-2">
            <ArrowUp size={12}/> / <ArrowDown size={12}/> 이동
            <CornerDownLeft size={12}/> 실행
          </div>
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
