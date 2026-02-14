// app/(workspace)/workspace/[teamId]/[projectId]/chat/_components/MarkdownText.tsx
'use client';

import React from 'react';
import { useChat } from '@/workspace/chat/_model/store';

/**
 * 아주 가벼운 마크다운 렌더러
 * - HTML 이스케이프
 * - 링크 [text](url)
 * - **bold**, *italic*
 * - `inline code`, ```fenced```
 * - @mention 강조 + 클릭 시 프로필 팝업 이벤트
 *
 * 보안:
 * - 원문을 먼저 escape → 그 위에서 마크다운을 안전한 span/pre로만 치환
 * - a 태그는 rel="noreferrer noopener" target="_blank"
 */
export default function MarkdownText({ text }: { text: string }) {
  const users = useChat((state) => state.users);
  const mentionLookup = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; avatarUrl?: string }>();
    Object.values(users).forEach((user) => {
      const display = user.displayName?.trim();
      const name = user.name?.trim();
      if (display) map.set(display.toLowerCase(), { id: user.id, name: display, avatarUrl: user.avatarUrl });
      if (name) map.set(name.toLowerCase(), { id: user.id, name: display || name, avatarUrl: user.avatarUrl });
    });
    return map;
  }, [users]);
  const html = React.useMemo(() => renderMarkdownWithMentions(text, mentionLookup), [text, mentionLookup]);
  return <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
}

/** HTML escape */
function esc(s: string) {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** 링크 치환: [text](url) */
function linkify(s: string) {
  return s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, t, u) => {
    return `<a href="${u}" target="_blank" rel="noopener noreferrer" class="underline underline-offset-2 decoration-dotted">${t}</a>`;
  });
}

/** 코드블록 펜스 ```...``` (멀티라인) */
function fencedCode(s: string) {
  return s.replace(/```([\s\S]*?)```/g, (_m, code) => {
    const c = esc(code);
    return `<pre class="rounded border border-border bg-subtle/40 px-3 py-2 overflow-x-auto"><code>${c}</code></pre>`;
  });
}

/** 인라인 코드 `...` */
function inlineCode(s: string) {
  return s.replace(/`([^`]+)`/g, (_m, code) => `<code class="rounded bg-subtle/60 border border-border px-1">${esc(code)}</code>`);
}

/** bold, italic */
function emphasis(s: string) {
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return s;
}

/** @mention 처리(클릭 이벤트) + 줄바꿈 <br/> */
function escAttr(s: string) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function mentionsAndBreaks(
  s: string,
  mentionLookup: Map<string, { id: string; name: string; avatarUrl?: string }>,
) {
  s = s.replace(/@([^\s@<]+)/g, (_m, rawName) => {
    const lookup = mentionLookup.get(String(rawName).toLowerCase());
    if (!lookup) return `@${rawName}`;
    const displayName = escAttr(lookup.name);
    const userId = escAttr(lookup.id);
    return `<button class="mx-0.5 inline-flex translate-y-[-1px] items-center gap-0.5 rounded px-0 py-0 text-[12px] align-middle text-sky-500 hover:underline hover:underline-offset-2" onclick="(function(el){const r=el.getBoundingClientRect();window.dispatchEvent(new CustomEvent('chat:open-user-profile',{detail:{userId:'${userId}',anchorRect:{top:r.top,left:r.left,right:r.right,bottom:r.bottom}}}));})(this)"><span class="font-semibold text-sky-500">@</span><span class="font-semibold text-sky-500">${displayName}</span></button>`;
  });
  s = s.replace(/\n/g, '<br/>');
  return s;
}

function renderMarkdownWithMentions(
  src: string,
  mentionLookup: Map<string, { id: string; name: string; avatarUrl?: string }>,
) {
  // 1) escape
  let s = esc(src ?? '');
  // 2) fenced code → 미리 교체
  s = fencedCode(s);
  // 3) 링크
  s = linkify(s);
  // 4) 인라인 코드
  s = inlineCode(s);
  // 5) 굵게/기울임
  s = emphasis(s);
  // 6) 멘션/줄바꿈
  s = mentionsAndBreaks(s, mentionLookup);
  return s;
}
