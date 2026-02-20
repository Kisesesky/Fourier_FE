// app/(workspace)/workspace/[teamId]/[projectId]/chat/_components/Composer.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Smile, Send, Play, X } from "lucide-react";
import type { FileItem } from "@/workspace/chat/_model/types";
import EmojiPicker from "./EmojiPicker";
import { replaceEmojiShortcuts, shortcutToEmoji } from "@/workspace/chat/_model/emoji.shortcuts";
import { useChat } from "@/workspace/chat/_model/store";

type UploadItem = FileItem;

function toFileItem(file: File): UploadItem {
  return {
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    type: file.type,
    blob: file,
    previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
  };
}

function replaceShortcutAtCaret(value: string, caret: number): { text: string; caret: number } {
  let i = caret - 1;
  while (i >= 0 && !/\s/.test(value[i])) i -= 1;
  const token = value.slice(i + 1, caret);
  const emoji = shortcutToEmoji[token];
  if (!emoji) return { text: value, caret };
  const next = `${value.slice(0, i + 1)}${emoji}${value.slice(caret)}`;
  const nextCaret = i + 1 + emoji.length;
  return { text: next, caret: nextCaret };
}

function isImageUrl(url: string) {
  return /^https?:\/\/\S+\.(png|jpe?g|gif|webp|bmp|svg)(\?\S*)?$/i.test(url);
}

function isInsideFencedCodeBlock(text: string, caret: number) {
  const prefix = text.slice(0, Math.max(0, caret));
  const fences = prefix.match(/```/g);
  return Boolean(fences && fences.length % 2 === 1);
}

function parseYouTubeVideoId(url: string): string | null {
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
}

export default function Composer({
  onSend,
  variant = "default",
  placeholder = "메시지 입력…",
  mentionChannelId,
  quoteScopeId,
}: {
  onSend: (text: string, files?: FileItem[], extra?: { parentId?: string | null; mentions?: string[] }) => void;
  parentId?: string | null;
  variant?: "default" | "merged";
  placeholder?: string;
  mentionChannelId?: string;
  quoteScopeId?: string;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [value, setValue] = useState("");
  const [caret, setCaret] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewKind, setPreviewKind] = useState<"image" | "youtube" | null>(null);
  const [previewVideoId, setPreviewVideoId] = useState<string | null>(null);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { users, channelMembers, channelId, userStatus } = useChat((state) => ({
    users: state.users,
    channelMembers: state.channelMembers,
    channelId: state.channelId,
    userStatus: state.userStatus,
  }));

  const canSend = value.trim().length > 0 || uploads.length > 0 || !!previewUrl;
  const allUsers = useMemo(() => {
    const scopeId = mentionChannelId ?? channelId;
    const members = scopeId ? (channelMembers[scopeId] || []) : [];
    const memberUsers = members
      .map((id) => users[id])
      .filter((u): u is NonNullable<typeof u> => !!u)
      .map((u) => ({
        id: u.id,
        name: u.displayName || u.name,
        avatarUrl: u.avatarUrl,
        status: userStatus[u.id],
      }));
    if (memberUsers.length > 0) return memberUsers;
    return Object.values(users).map((u) => ({
      id: u.id,
      name: u.displayName || u.name,
      avatarUrl: u.avatarUrl,
      status: userStatus[u.id],
    }));
  }, [mentionChannelId, channelId, channelMembers, users, userStatus]);
  const mentionUsers = useMemo(() => {
    const q = mentionQuery.trim().toLowerCase();
    if (!q) return allUsers.slice(0, 8);
    return allUsers.filter((u) => u.name.toLowerCase().includes(q)).slice(0, 8);
  }, [allUsers, mentionQuery]);

  const shellClass = `flex items-start gap-2 rounded-2xl border px-2 py-2 transition ${
    isFocused ? "border-brand/60 bg-panel shadow-[0_0_0_1px_rgba(59,130,246,0.18)]" : "border-border/70 bg-panel/95"
  }`;
  const outerClass = variant === "merged" ? "px-0 py-0" : "px-2 py-2";

  const autoResize = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 192)}px`;
  };

  useEffect(() => {
    autoResize();
  }, [value]);

  const insertAtCaret = (insertText: string) => {
    const el = inputRef.current;
    if (!el) {
      setValue((prev) => prev + insertText);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? start;
    const next = `${value.slice(0, start)}${insertText}${value.slice(end)}`;
    const caret = start + insertText.length;
    setValue(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = caret;
      el.selectionEnd = caret;
      autoResize();
    });
  };

  const doSend = () => {
    const rawText = value.trim();
    const composedText = [rawText, previewUrl].filter(Boolean).join("\n").trim();
    const text = replaceEmojiShortcuts(composedText);
    if (!text && uploads.length === 0) return;

    const mentions = Array.from(text.matchAll(/@([A-Za-z0-9_-][A-Za-z0-9 _-]*)/g)).map((m) => `name:${m[1].trim()}`);
    const files: FileItem[] = uploads.map(({ ...rest }) => rest);

    onSend(text, files, { mentions });
    uploads.forEach((u) => {
      if (u.previewUrl) URL.revokeObjectURL(u.previewUrl);
    });
    setValue("");
    setPreviewUrl(null);
    setPreviewKind(null);
    setPreviewVideoId(null);
    setUploads([]);
  };

  const onPickFile = (file: File | null | undefined) => {
    if (!file) return;
    const item = toFileItem(file);
    setUploads((prev) => [...prev, item]);
  };

  const onInputFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    onPickFile(e.target.files?.[0]);
    e.target.value = "";
  };

  const onPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData?.items || []);
    const fileItem = items.find((it) => it.kind === "file");
    if (!fileItem) return;
    const file = fileItem.getAsFile();
    if (!file) return;
    e.preventDefault();
    onPickFile(file);
  };

  const onInputChange = (nextValue: string) => {
    const trimmed = nextValue.trim();
    const image = isImageUrl(trimmed);
    const youtubeId = parseYouTubeVideoId(trimmed);
    const isSingleUrl = /^https?:\/\/\S+$/i.test(trimmed);

    if (trimmed && isSingleUrl && (image || youtubeId)) {
      setPreviewUrl(trimmed);
      setPreviewKind(image ? "image" : "youtube");
      setPreviewVideoId(youtubeId);
      setValue("");
      return;
    }
    setValue(nextValue);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.nativeEvent as KeyboardEvent).isComposing) return;

    if (mentionOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((prev) => Math.min(mentionUsers.length - 1, prev + 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((prev) => Math.max(0, prev - 1));
        return;
      }
      if (e.key === "Escape") {
        setMentionOpen(false);
        return;
      }
      if (e.key === "Enter") {
        const picked = mentionUsers[mentionIndex];
        if (picked) {
          e.preventDefault();
          pickMention(picked.name);
          return;
        }
      }
    }

    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      doSend();
      return;
    }

    if (e.key === "Enter") {
      const el = inputRef.current;
      const currentCaret = el?.selectionStart ?? caret;
      const inFence = isInsideFencedCodeBlock(value, currentCaret);
      if (e.shiftKey || inFence) {
        e.preventDefault();
        insertAtCaret("\n");
        return;
      }
      e.preventDefault();
      doSend();
      return;
    }

    if (e.key === " ") {
      const el = inputRef.current;
      const caret = el?.selectionStart ?? value.length;
      const replaced = replaceShortcutAtCaret(value, caret);
      if (replaced.text !== value) {
        setValue(replaced.text);
        requestAnimationFrame(() => {
          if (!el) return;
          el.selectionStart = replaced.caret;
          el.selectionEnd = replaced.caret;
          autoResize();
        });
      }
    }
  };

  const updateMentionState = (nextValue: string, nextCaret: number) => {
    const prefix = nextValue.slice(0, Math.max(0, nextCaret));
    const token = prefix.split(/\s/).pop() || "";
    if (token.startsWith("@")) {
      setMentionQuery(token.slice(1));
      setMentionIndex(0);
      setMentionOpen(true);
      return;
    }
    setMentionOpen(false);
  };

  const pickMention = (name: string) => {
    const start = Math.max(0, value.lastIndexOf("@", Math.max(0, caret - 1)));
    const before = value.slice(0, start);
    const after = value.slice(caret).replace(/^\S*/, "");
    const inserted = `@${name} `;
    const next = `${before}${inserted}${after}`;
    const nextCaret = before.length + inserted.length;
    setValue(next);
    setCaret(nextCaret);
    setMentionOpen(false);
    requestAnimationFrame(() => {
      if (!inputRef.current) return;
      inputRef.current.focus();
      inputRef.current.selectionStart = nextCaret;
      inputRef.current.selectionEnd = nextCaret;
      autoResize();
    });
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (!files.length) return;
    const items = files.map(toFileItem);
    setUploads((prev) => prev.concat(items));
  };

  const removeUpload = (id: string) => {
    setUploads((prev) => {
      const target = prev.find((u) => u.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((u) => u.id !== id);
    });
  };

  useEffect(() => {
    const onQuote = (e: Event) => {
      const detail = (e as CustomEvent<{ text: string }>).detail;
      const quoted = (detail?.text || "")
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n");
      insertAtCaret(`${quoted}\n`);
    };

    const onInsert = (e: Event) => {
      const detail = (e as CustomEvent<{ text: string }>).detail;
      if (!detail?.text) return;
      const scope = (e as CustomEvent<{ text: string; scopeId?: string }>).detail?.scopeId;
      if (scope && quoteScopeId && scope !== quoteScopeId) return;
      if (scope && !quoteScopeId) return;
      insertAtCaret(detail.text);
    };

    window.addEventListener("chat:insert-quote", onQuote as EventListener);
    window.addEventListener("chat:insert-text", onInsert as EventListener);
    return () => {
      window.removeEventListener("chat:insert-quote", onQuote as EventListener);
      window.removeEventListener("chat:insert-text", onInsert as EventListener);
    };
  }, [value, quoteScopeId]);

  const uploadList = useMemo(
    () =>
      uploads.map((u) => (
        <div key={u.id} className="rounded-lg border border-border bg-background/70 p-3">
          <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted">
            <span className="truncate">{u.name}</span>
            <button type="button" className="rounded px-1 py-0.5 hover:bg-subtle/60 hover:text-foreground" onClick={() => removeUpload(u.id)}>
              제거
            </button>
          </div>
          {u.previewUrl && u.type.startsWith("image/") ? (
            <img src={u.previewUrl} alt={u.name} className="max-h-72 w-full rounded object-cover transition-opacity hover:opacity-90" />
          ) : (
            <div className="text-xs text-muted">첨부 파일 준비 완료</div>
          )}
        </div>
      )),
    [uploads],
  );

  return (
    <div
      className={`relative ${outerClass} ${dragOver ? "ring-2 ring-brand/60" : ""}`}
      onDragOver={onDragOver}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      {(previewUrl || uploads.length > 0) && (
        <div className="mb-2 space-y-2">
          {previewUrl && (
            <div className="inline-block w-full max-w-[560px] overflow-hidden rounded-xl border border-border bg-background/80 shadow-sm">
              <div className="flex items-center justify-between border-b border-border bg-panel/60 px-3 py-2 text-xs text-muted">
                <span>{previewKind === "youtube" ? "YouTube 미리보기" : "이미지 미리보기"}</span>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewUrl(null);
                    setPreviewKind(null);
                    setPreviewVideoId(null);
                  }}
                  className="rounded p-1 hover:bg-subtle/60 hover:text-foreground"
                  aria-label="미리보기 제거"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="relative">
                {previewKind === "youtube" && previewVideoId ? (
                  <div className="relative aspect-video w-full bg-black/70">
                    <img
                      src={`https://i.ytimg.com/vi/${previewVideoId}/hqdefault.jpg`}
                      alt="YouTube preview"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="rounded-full bg-black/50 p-3 text-white">
                        <Play size={22} fill="currentColor" />
                      </span>
                    </div>
                  </div>
                ) : (
                  <img
                    src={previewUrl}
                    alt="이미지 미리보기"
                    className="max-h-80 w-full object-cover transition-opacity hover:opacity-95"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="p-4 text-red-400 text-sm">미리보기를 불러올 수 없습니다.</div>';
                      }
                    }}
                  />
                )}
              </div>
            </div>
          )}
          {uploads.length > 0 && <div className="space-y-1.5">{uploadList}</div>}
        </div>
      )}

      <div className={shellClass}>
        <label className="inline-flex h-10 w-10 shrink-0 cursor-pointer select-none items-center justify-center rounded-xl text-foreground/90 transition hover:bg-subtle/80 hover:text-foreground">
          <Plus size={20} />
          <input ref={fileRef} type="file" className="hidden" onChange={onInputFile} />
        </label>

        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => {
            const nextValue = e.target.value;
            const nextCaret = e.target.selectionStart ?? nextValue.length;
            setCaret(nextCaret);
            onInputChange(nextValue);
            updateMentionState(nextValue, nextCaret);
          }}
          onKeyDown={onKeyDown}
          onClick={(e) => {
            const pos = (e.target as HTMLTextAreaElement).selectionStart ?? 0;
            setCaret(pos);
            updateMentionState(value, pos);
          }}
          onKeyUp={(e) => {
            const pos = (e.target as HTMLTextAreaElement).selectionStart ?? 0;
            setCaret(pos);
            updateMentionState((e.target as HTMLTextAreaElement).value, pos);
          }}
          onPaste={onPaste}
          rows={1}
          maxLength={3000}
          placeholder={placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="hide-scrollbar max-h-48 min-h-10 flex-1 resize-none rounded-xl bg-background/70 px-3 py-2.5 text-[15px] leading-snug text-foreground outline-none placeholder:text-muted/75"
        />

        <EmojiPicker
          onPick={(emoji) => insertAtCaret(emoji)}
          panelSide="top"
          panelAlign="right"
          anchorClass="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground/90 hover:bg-subtle/80"
          triggerContent={<Smile size={22} />}
        />

        <button
          type="button"
          onClick={doSend}
          disabled={!canSend}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:bg-subtle/70 disabled:text-muted"
          aria-label="메시지 전송"
        >
          <Send size={17} />
        </button>
      </div>

      {mentionOpen && (
        <div className="absolute bottom-full left-14 z-30 mb-2 w-64 overflow-hidden rounded-lg border border-border bg-background shadow-lg">
          {mentionUsers.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted">참가자 없음</div>
          ) : (
            mentionUsers.map((user, idx) => (
              <button
                key={user.id}
                type="button"
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-subtle/70 ${
                  idx === mentionIndex ? "bg-subtle/80" : ""
                }`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pickMention(user.name)}
              >
                <span className="relative inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-subtle text-[11px] font-semibold">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    user.name.slice(0, 2).toUpperCase()
                  )}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-background ${
                      user.status === "online" ? "bg-emerald-500" : user.status === "away" ? "bg-amber-500" : user.status === "busy" ? "bg-rose-500" : "bg-slate-400"
                    }`}
                  />
                </span>
                <span className="truncate">{user.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
