// components/chat/Composer.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Paperclip, Send, Bold, Code, Quote, SmilePlus, AtSign, Upload, X } from "lucide-react";
import type { FileItem } from "@/workspace/chat/_model/types";
import MentionPopover, { SuggestItem } from "./MentionPopover";
import EmojiPicker from "./EmojiPicker";

type UploadItem = FileItem & { progress: number; ready: boolean };

function toFileItem(file: File): UploadItem {
  return {
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    type: file.type,
    blob: file,
    progress: 0,
    ready: false,
  };
}

export default function Composer({
  onSend,
}: {
  onSend: (text: string, files?: FileItem[], extra?: { parentId?: string|null; mentions?: string[] }) => void;
  parentId?: string | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionXY, setMentionXY] = useState<{x:number;y:number}>({x:0,y:0});
  const [mentionQuery, setMentionQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const allUsers: SuggestItem[] = useMemo(() => {
    if (typeof window === "undefined") return [];
    const globalUsers = (window as any).__FLOW_USERS__ as {id:string; name:string}[] | undefined;
    return (globalUsers || []).map(u => ({ id: u.id, name: u.name }));
  }, []);
  const filteredUsers = useMemo(() => {
    const q = mentionQuery.trim().toLowerCase();
    return allUsers.filter(u => u.name.toLowerCase().includes(q)).slice(0,8);
  }, [mentionQuery, allUsers]);

  /** 업로드 가짜 진행률 시뮬레이터 */
  const startFakeUpload = (items: UploadItem[]) => {
    items.forEach(item => {
      const int = setInterval(() => {
        setUploads(prev => prev.map(u => {
          if (u.id !== item.id) return u;
          const next = Math.min(100, u.progress + Math.round(5 + Math.random()*15));
          return { ...u, progress: next, ready: next >= 100 };
        }));
      }, 200);
      setTimeout(() => clearInterval(int), 5000);
    });
  };

  const insertTextAtCursor = (text: string) => {
    ref.current?.focus();
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(text));
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  };

  const surroundSelection = (left: string, right: string = left) => {
    ref.current?.focus();
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    const text = range.toString();
    range.deleteContents();
    const node = document.createTextNode(`${left}${text}${right}`);
    range.insertNode(node);
    range.setStartAfter(node);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  };

  const openMention = () => {
    const rect = getCaretCoordinates();
    setMentionXY({ x: rect.left, y: rect.bottom + 6 });
    setMentionQuery("");
    setActiveIdx(0);
    setMentionOpen(true);
  };
  const getCaretCoordinates = () => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return { left: 0, right: 0, top: 0, bottom: 0 };
    const range = sel.getRangeAt(0).cloneRange();
    range.collapse(true);
    const span = document.createElement('span');
    span.appendChild(document.createTextNode('\u200b'));
    range.insertNode(span);
    const rect = span.getBoundingClientRect();
    const out = { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
    span.parentNode?.removeChild(span);
    return out;
  };

  const replaceCurrentMentionToken = (replacement: string) => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    let node = range.startContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";
      const caret = range.startOffset;
      let i = caret - 1;
      while (i >= 0 && /[A-Za-z0-9_-]/.test(text[i])) i--;
      if (text[i] === '@') {
        const start = i;
        const end = caret;
        const before = text.slice(0, start);
        const after = text.slice(end);
        node.textContent = before + replacement + after;
        const newOffset = (before + replacement).length;
        const r = document.createRange();
        r.setStart(node, Math.min(newOffset, node.textContent.length));
        r.collapse(true);
        sel.removeAllRanges();
        sel.addRange(r);
        return;
      }
    }
    insertTextAtCursor(replacement);
  };

  const pickMention = (u: SuggestItem) => {
    replaceCurrentMentionToken(`@${u.name} `);
    setMentionOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (mentionOpen) {
      if (e.key === 'ArrowDown') { setActiveIdx(i=> Math.min(filteredUsers.length-1, i+1)); e.preventDefault(); }
      if (e.key === 'ArrowUp')   { setActiveIdx(i=> Math.max(0, i-1)); e.preventDefault(); }
      if (e.key === 'Enter')     { const u = filteredUsers[activeIdx]; if (u) pickMention(u); e.preventDefault(); return; }
      if (e.key === 'Escape')    { setMentionOpen(false); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
  };

  const onInput = () => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    let node = range.startContainer;
    let text = '';
    if (node.nodeType === Node.TEXT_NODE) text = node.textContent || '';
    else text = (node.textContent || '');
    const caret = range.startOffset;
    const token = (text.slice(0, caret) || '').split(/\s/).pop() || '';
    if (token.startsWith('@')) {
      setMentionQuery(token.slice(1));
      openMention();
    } else {
      setMentionOpen(false);
    }
  };

  const doSend = () => {
    const text = (ref.current?.innerText || '').trim();
    const allReady = uploads.every(u => u.ready);
    if (!text && uploads.length === 0) return;
    if (!allReady) return;

    const mentions = Array.from(text.matchAll(/@([A-Za-z0-9_-][A-Za-z0-9 _-]*)/g)).map(m => `name:${m[1].trim()}`);
    const files: FileItem[] = uploads.map(({ progress, ready, ...rest }) => rest);
    onSend(text, files, { mentions });

    ref.current && (ref.current.innerHTML = '');
    setUploads([]);
    setMentionOpen(false);
  };

  const onPickEmoji = (emoji: string) => {
    insertTextAtCursor(emoji);
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    const item = toFileItem(f);
    setUploads(prev => [...prev, item]);
    startFakeUpload([item]);
  };

  /** 드래그&드롭 업로드 */
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const onDragLeave = () => setDragOver(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (!files.length) return;
    const items = files.map(toFileItem);
    setUploads(prev => prev.concat(items));
    startFakeUpload(items);
  };

  /** 인용/텍스트 삽입 이벤트 수신 */
  useEffect(() => {
    const onQuote = (e: Event) => {
      const detail = (e as CustomEvent<{ text: string }>).detail;
      const quoted = (detail?.text || '').split('\n').map(l => `> ${l}`).join('\n');
      insertTextAtCursor(quoted + '\n');
    };
    const onInsert = (e: Event) => {
      const detail = (e as CustomEvent<{ text: string }>).detail;
      const txt = detail?.text || '';
      if (!txt) return;
      insertTextAtCursor(txt);
    };
    window.addEventListener('chat:insert-quote', onQuote as any);
    window.addEventListener('chat:insert-text', onInsert as any);
    return () => {
      window.removeEventListener('chat:insert-quote', onQuote as any);
      window.removeEventListener('chat:insert-text', onInsert as any);
    };
  }, []);

  const removeUpload = (id: string) => {
    setUploads(prev => prev.filter(u => u.id !== id));
  };

  const allReady = uploads.every(u => u.ready);

  return (
    <div className={`border-t border-border p-2 ${dragOver ? 'ring-2 ring-brand/60' : ''}`}
         onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      {/* 툴바 */}
      <div className="flex items-center gap-1 px-1 pb-1">
        <button className="p-1 rounded hover:bg-subtle/60" title="Bold **" onClick={()=> surroundSelection('**') }><Bold size={14}/></button>
        <button className="p-1 rounded hover:bg-subtle/60" title="Inline code `code`" onClick={()=> surroundSelection('`') }><Code size={14}/></button>
        <button className="p-1 rounded hover:bg-subtle/60" title="Quote > " onClick={()=> insertTextAtCursor('\n> ') }><Quote size={14}/></button>
        <EmojiPicker onPick={onPickEmoji} />
        <button className="p-1 rounded hover:bg-subtle/60" title="@mention" onClick={()=> { insertTextAtCursor('@'); const r = getCaretCoordinates(); setMentionXY({x:r.left,y:r.bottom+6}); setMentionOpen(true);} }><AtSign size={14}/></button>
        <span className="ml-auto" />
        <button className="px-2 py-1 text-xs rounded border border-border hover:bg-subtle/60 inline-flex items-center gap-1" onClick={()=> fileRef.current?.click()}>
          <Paperclip size={14}/> Attach
        </button>
        <input ref={fileRef} type="file" hidden onChange={onPickFile} />
      </div>

      {/* 입력창 */}
      <div
        ref={ref}
        className="min-h-[44px] max-h-40 overflow-y-auto rounded-md border border-border bg-subtle/40 px-3 py-2 text-sm outline-none"
        contentEditable
        onKeyDown={onKeyDown}
        onInput={onInput}
        data-placeholder="메시지를 입력하세요 (Shift+Enter 줄바꿈)"
        style={{ whiteSpace: 'pre-wrap' }}
      />

      {/* 업로드 진행률 */}
      {uploads.length > 0 && (
        <div className="mt-2 flex flex-col gap-2">
          {uploads.map(u => (
            <div key={u.id} className="rounded border border-border bg-subtle/30 px-2 py-1 text-xs">
              <div className="flex items-center justify-between">
                <div className="truncate">{u.name}</div>
                <button className="ml-2 p-1 rounded hover:bg-subtle/60" onClick={()=> removeUpload(u.id)} title="제거">
                  <X size={12}/>
                </button>
              </div>
              <div className="mt-1 h-2 rounded-full border border-border overflow-hidden">
                <div className="h-full bg-current opacity-60" style={{ width: `${u.progress}%` }} />
              </div>
              <div className="mt-0.5 text-right opacity-70">{u.progress}%</div>
            </div>
          ))}
        </div>
      )}

      {/* 액션 */}
      <div className="mt-2 flex items-center justify-between">
        <div className="text-xs text-muted inline-flex items-center gap-1"><Upload size={12}/> drag & drop to attach</div>
        <button
          className={`px-3 py-1.5 text-sm rounded border border-border inline-flex items-center gap-1 ${(!uploads.length || allReady) ? 'hover:bg-subtle/60' : 'opacity-50 cursor-not-allowed'}`}
          onClick={doSend}
          disabled={uploads.length > 0 && !allReady}
          title={uploads.length > 0 && !allReady ? "업로드 중..." : "Send"}
        >
          <Send size={14}/> Send
        </button>
      </div>

      {/* 멘션 팝오버 */}
      <MentionPopover
        open={mentionOpen}
        x={mentionXY.x}
        y={mentionXY.y}
        items={filteredUsers}
        activeIndex={activeIdx}
        onPick={pickMention}
        onClose={()=> setMentionOpen(false)}
      />
    </div>
  );
}
