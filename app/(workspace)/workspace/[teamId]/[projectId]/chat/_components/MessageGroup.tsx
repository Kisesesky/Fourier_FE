// app/(workspace)/workspace/[teamId]/[projectId]/chat/_components/MessageGroup.tsx
'use client';

import { useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import type { Attachment, Msg, ChatUser } from '@/workspace/chat/_model/types';
import MarkdownText from './MarkdownText';
import LinkPreview, { extractUrls } from './LinkPreview';
import CodeFencePreview, { extractFences } from './CodeFencePreview';
import { LightboxItem, openLightbox } from './Lightbox';
import { Film, File, FileText, SmilePlus, Reply, MoreHorizontal, Pin, Bookmark, CornerDownRight, MessageSquare, Pencil, Trash2 } from 'lucide-react';

function formatMessageTimestamp(ts: number) {
  const date = new Date(ts);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hour = date.getHours();
  const minute = String(date.getMinutes()).padStart(2, "0");
  const meridiem = hour < 12 ? "오전" : "오후";
  const hour12 = hour % 12 || 12;
  if (isToday) {
    return `${meridiem} ${hour12}:${minute}`;
  }
  return `${yyyy}. ${mm}. ${dd}. ${meridiem} ${hour12}:${minute}`;
}

type MessageRowProps = {
  m: Msg;
  isMine: boolean;
  view: 'compact' | 'cozy';
  meId: string;
  otherMemberCount: number;
  otherSeenNames: string[];
  showHeader: boolean;
  showAvatar: boolean;
  avatarUrl?: string;
  threadMeta?: { count: number; lastTs?: number; lastAuthorId?: string };
  onEdit: (id: string, text: string) => void;
  onReact: (id: string, emoji: string) => void;
  onReply: (rootId: string) => void;
  onQuote: (msg: Msg) => void;
  openMenu: (e: MouseEvent<HTMLElement>, m: Msg, isMine: boolean) => void;
  selectable: boolean;
  selected: boolean;
  onToggleSelect: (id: string, multi?: boolean) => void;
  pinned: boolean;
  saved: boolean;
  onPin: (id: string) => void;
  onSave: (id: string) => void;
  onDelete: (id: string) => void;
  users: Record<string, ChatUser>;
  onOpenProfile: (userId: string, anchorRect?: { top: number; left: number; right: number; bottom: number }) => void;
};

type MessageGroupProps = {
  items: Msg[];
  isMine: boolean;
  view: 'compact' | 'cozy';
  meId: string;
  otherMemberCount: number;
  otherSeen: Record<string, string[]>;
  users: Record<string, ChatUser>;
  threadMetaMap?: Record<string, { count: number; lastTs?: number; lastAuthorId?: string }>;
  onEdit: (id: string, text: string) => void;
  onReact: (id: string, emoji: string) => void;
  onReply: (rootId: string) => void;
  onQuote: (msg: Msg) => void;
  openMenu: (e: MouseEvent<HTMLElement>, m: Msg, isMine: boolean) => void;
  selectable: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string, multi?: boolean) => void;
  pinnedIds: Set<string>;
  savedIds: Set<string>;
  onPin: (id: string) => void;
  onSave: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenProfile: (userId: string, anchorRect?: { top: number; left: number; right: number; bottom: number }) => void;
};

function AttachmentBubble({ attachment, all, index }: { attachment: Attachment; all: Attachment[]; index: number }) {
  const handleOpen = () => {
    const items: LightboxItem[] = all
      .map((item) => {
        const isVideo = item.type.startsWith('video/');
        const kind: 'image' | 'video' = isVideo ? 'video' : 'image';
        const src = item.dataUrl || '';
        return { id: item.id, kind, src, name: item.name, mime: item.type };
      })
      .filter((entry) => !!entry.src);
    if (!items.length) return;
    const initialIndex = Math.max(0, Math.min(items.length - 1, index));
    openLightbox(items, initialIndex);
  };

  if (attachment.dataUrl && attachment.type.startsWith('image/')) {
    return (
      <button onClick={handleOpen} className="block">
        <img
          src={attachment.dataUrl}
          alt={attachment.name}
          className="max-h-[320px] max-w-[320px] rounded border border-border hover:opacity-90"
        />
      </button>
    );
  }
  if (attachment.dataUrl && attachment.type.startsWith('video/')) {
    return (
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-subtle/40 px-2 py-1 text-xs hover:bg-subtle/60"
      >
        <Film size={14} /> {attachment.name}
      </button>
    );
  }
  if (attachment.dataUrl && attachment.type === 'application/pdf') {
    return (
      <a
        href={attachment.dataUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-md border border-border bg-subtle/40 px-2 py-1 text-xs"
      >
        <FileText size={14} /> {attachment.name}
      </a>
    );
  }
  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-border bg-subtle/40 px-2 py-1 text-xs">
      <File size={14} /> {attachment.name}
    </div>
  );
}

function ReactionPills({
  m,
  meId,
  view,
  usersMap,
  onToggle,
}: {
  m: Msg;
  meId: string;
  view: 'compact' | 'cozy';
  usersMap: Record<string, ChatUser>;
  onToggle: (emoji: string) => void;
}) {
  const entries = Object.entries(m.reactions || {});
  if (entries.length === 0) return null;
  const chipTextClass = view === "compact" ? "text-[11.5px]" : "text-[12.5px]";
  return (
    <div className="mt-1 flex flex-wrap gap-1.5">
      {entries.map(([emoji, userIds]) => {
        const reacted = userIds.includes(meId);
        const who = userIds
          .map((id) => usersMap[id]?.displayName || usersMap[id]?.name || (id.startsWith("anon-") ? "익명" : id))
          .slice(0, 8);
        return (
        <div key={emoji} className="group/reaction relative">
          <button
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 leading-none transition ${chipTextClass} ${
              reacted ? "border-border bg-subtle/85 text-foreground" : "border-border bg-subtle/45 text-foreground hover:bg-subtle/70"
            }`}
            onClick={() => onToggle(emoji)}
            title={`${userIds.length}명`}
          >
            <span>{emoji}</span>
            {userIds.length > 0 && (
              <span className={`font-semibold ${reacted ? "text-background/80" : "text-muted"}`}>{userIds.length}</span>
            )}
          </button>
          <div className="pointer-events-none absolute bottom-full left-0 z-20 mb-1 hidden min-w-36 rounded-md border border-border bg-panel px-2 py-1.5 text-[11px] text-muted shadow-lg group-hover/reaction:block">
            <div className="mb-0.5 text-foreground">{emoji} 반응</div>
            <div>{who.join(", ") || "사용자 없음"}</div>
          </div>
        </div>
      )})}
    </div>
  );
}

function MessageRow({
  m,
  isMine,
  view,
  meId,
  otherMemberCount,
  otherSeenNames,
  showHeader,
  showAvatar,
  avatarUrl,
  threadMeta,
  onEdit,
  onReact,
  onReply,
  onQuote,
  openMenu,
  selectable,
  selected,
  onToggleSelect,
  pinned,
  saved,
  onPin,
  onSave,
  onDelete,
  users,
  onOpenProfile,
}: MessageRowProps) {
  const stripFences = (text: string) => text.replace(/```[\s\S]*?```/g, "").trim();
  const stripUrls = (text: string) => text.replace(/https?:\/\/[^\s]+/gi, "").trim();
  const padClass = showHeader ? (view === 'compact' ? 'py-0.5' : 'py-1') : 'py-0';
  const headerTextClass = view === "compact" ? "text-[13px]" : "text-[13.5px]";
  const bodyTextClass = view === "compact" ? "text-[13.5px] leading-[1.55]" : "text-[14.5px] leading-[1.65]";
  const plainText = stripFences(m.text || "");
  const urls = extractUrls(plainText);
  const displayText = urls.length > 0 ? stripUrls(plainText) : plainText;
  const fences = extractFences(m.text);
  const [editing, setEditing] = useState(false);
  const [quickEmojiOpen, setQuickEmojiOpen] = useState(false);
  const [draft, setDraft] = useState(m.text || '');

  useEffect(() => setDraft(m.text || ''), [m.text]);

  const initials = (m.author || '?').slice(0, 2).toUpperCase();
  const ts = new Date(m.ts);
  const timestampLabel = formatMessageTimestamp(m.ts);
  const timestampIso = ts.toISOString();
  const contentSpacing = showHeader ? 'space-y-1' : 'space-y-0';

  const effectiveThread = threadMeta ?? (m.threadCount ? { count: m.threadCount } : undefined);
  const lastReplyTime = effectiveThread?.lastTs ? new Date(effectiveThread.lastTs).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' }) : null;
  const lastReplyUser = effectiveThread?.lastAuthorId ? users[effectiveThread.lastAuthorId] : undefined;
  const unreadMemberCount = Math.max(otherMemberCount - otherSeenNames.length, 0);
  return (
    <div
      className={`group/message relative mx-1 rounded-xl px-3 ${padClass} transition-all duration-150 ease-out ${
        selected ? 'bg-brand/12 ring-1 ring-brand/40' : 'hover:bg-slate-100/10'
      }`}
      onMouseLeave={() => setQuickEmojiOpen(false)}
      onContextMenu={(e) => {
        e.preventDefault();
        openMenu(e, m, isMine);
      }}
      onClick={(e) => {
        if (selectable && (e.shiftKey || e.metaKey || e.ctrlKey)) onToggleSelect(m.id, true);
      }}
      data-mid={m.id}
    >
      {selectable && (
        <label className="absolute -left-7 top-2 opacity-100">
          <input type="checkbox" checked={selected} onChange={() => onToggleSelect(m.id, false)} />
        </label>
      )}

      {!editing ? (
        <div className="grid grid-cols-[40px_minmax(0,1fr)] grid-rows-[auto_auto] gap-x-2.5">
          <div className="row-span-2 pt-0.5">
            {showAvatar ? (
              <button
                className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-muted/20 text-[12px] font-semibold text-foreground"
                onClick={(event) => onOpenProfile(m.authorId, event.currentTarget.getBoundingClientRect())}
                aria-label={`${m.author} 프로필 보기`}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={m.author} className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </button>
            ) : (
              <div className="h-10 w-10 opacity-0" />
            )}
          </div>
          <div className={`col-start-2 row-start-1 min-w-0 ${contentSpacing}`}>
            {showHeader && (
              <div className={`flex items-center gap-2 ${headerTextClass}`}>
                <button
                  type="button"
                  className="font-semibold text-foreground/95 hover:underline"
                  onClick={(event) => onOpenProfile(m.authorId, event.currentTarget.getBoundingClientRect())}
                >
                  {m.author}
                </button>
                <time className="text-[10.5px] tracking-wide text-muted" dateTime={timestampIso}>{timestampLabel}</time>
              </div>
            )}
          </div>
          <div className={`col-start-2 row-start-2 min-w-0 -mt-0.5 ${contentSpacing}`}>
            {m.reply && (
              <div
                className="mb-1 cursor-pointer rounded-lg bg-panel/55 px-2.5 py-1.5 text-left text-[11px] text-muted transition hover:bg-panel/80"
                role="button"
                tabIndex={0}
                onClick={() => {
                  const ev = new CustomEvent("chat:scroll-to", { detail: { id: m.reply?.id } });
                  window.dispatchEvent(ev);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    const ev = new CustomEvent("chat:scroll-to", { detail: { id: m.reply?.id } });
                    window.dispatchEvent(ev);
                  }
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex shrink-0 text-muted"><CornerDownRight size={12} /></span>
                  <span className="h-7 w-7 overflow-hidden rounded-full bg-muted/20 text-[10px] font-semibold text-foreground">
                    {m.reply.sender?.avatar ? (
                      <img
                        src={m.reply.sender.avatar}
                        alt={m.reply.sender.name ?? "User"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        {(m.reply.sender?.name ?? "User").slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <div className="min-w-0 flex-1 truncate text-[11px] text-muted">
                    <span className="font-semibold text-foreground/95">{m.reply.sender?.name ?? "User"}</span>
                    <span className="mx-1 text-muted">:</span>
                    <span>{m.reply.isDeleted ? "삭제된 메시지입니다." : m.reply.content ?? ""}</span>
                  </div>
                </div>
                <div className="pl-[31px]">
                  <div className={`truncate ${bodyTextClass} text-foreground`}>
                    {m.text || "답장 내용 없음"}
                  </div>
                </div>
              </div>
            )}
            {!m.reply && (
              <div className={`${bodyTextClass} text-foreground`}>
                {displayText ? <MarkdownText text={displayText} /> : null}
                {m.editedAt && <span className="ml-2 text-[11px] text-muted">(edited)</span>}
              </div>
            )}
            <CodeFencePreview fences={fences} />
            {urls.length > 0 && (
              <div className="mt-1 space-y-1">
                {urls.map((url) => (
                  <LinkPreview key={url} url={url} />
                ))}
              </div>
            )}
            {m.attachments?.length ? (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {m.attachments.map((attachment, index) => (
                  <AttachmentBubble key={attachment.id} attachment={attachment} all={m.attachments!} index={index} />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-brand/60"
          />
          <div className="flex items-center gap-2 text-xs">
            <button
              className="rounded-md border border-border px-2 py-1 hover:bg-subtle/60"
              onClick={() => {
                onEdit(m.id, draft.trim());
                setEditing(false);
              }}
            >
              저장
            </button>
            <button className="rounded-md border border-border px-2 py-1 hover:bg-subtle/60" onClick={() => setEditing(false)}>
              취소
            </button>
          </div>
        </div>
      )}

      <div className="absolute right-2 top-1 z-10 flex items-center gap-0.5 rounded-lg border border-border bg-background px-1 py-0.5 opacity-0 shadow-lg transition group-hover/message:opacity-100 group-focus-within/message:opacity-100">
        <div className="relative">
          <button
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-subtle/60"
            onClick={() => setQuickEmojiOpen((prev) => !prev)}
            aria-label="퀵 이모지"
          >
            <SmilePlus size={16} />
          </button>
          {quickEmojiOpen && (
            <div className="absolute bottom-full right-0 mb-1 flex items-center gap-1 rounded-md border border-border bg-background px-1.5 py-1 shadow-lg">
              {["😁", "😥", "👌", "👋", "🙏", "❤️", "✅"].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="inline-flex h-7 w-7 items-center justify-center rounded text-base hover:bg-subtle/60"
                  onClick={() => {
                    onReact(m.id, emoji);
                    setQuickEmojiOpen(false);
                  }}
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-subtle/60"
          onClick={() => onQuote(m)}
          aria-label="답장"
        >
          <Reply size={14} />
        </button>
        <button
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-subtle/60"
          onClick={() => onReply(m.parentId ? (m.parentId as string) : m.id)}
          aria-label="스레드"
        >
          <MessageSquare size={14} />
        </button>
        <button
          className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${pinned ? 'text-amber-500' : 'text-muted'} hover:bg-subtle/60`}
          onClick={() => onPin(m.id)}
          aria-label="고정"
        >
          <Pin size={14} />
        </button>
        <button
          className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${saved ? 'text-emerald-500' : 'text-muted'} hover:bg-subtle/60`}
          onClick={() => onSave(m.id)}
          aria-label="저장"
        >
          <Bookmark size={14} />
        </button>
        {isMine && (
          <button
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-subtle/60"
            onClick={() => setEditing(true)}
            aria-label="편집"
          >
            <Pencil size={14} />
          </button>
        )}
        {isMine && (
          <button
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-rose-500 hover:bg-subtle/60"
            onClick={() => onDelete(m.id)}
            aria-label="삭제"
          >
            <Trash2 size={14} />
          </button>
        )}
        <button
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-subtle/60"
          onClick={(e) => openMenu(e, m, isMine)}
          aria-label="추가 메뉴"
        >
          <MoreHorizontal size={14} />
        </button>
      </div>

        <div className={`pl-[45px] ${showHeader ? 'mt-1' : 'mt-0.5'}`}>
          <div className="flex flex-wrap items-center gap-1 text-[12px] text-muted">
            <ReactionPills m={m} meId={meId} view={view} usersMap={users} onToggle={(emoji) => onReact(m.id, emoji)} />
          </div>
        {effectiveThread?.count && effectiveThread.count > 0 && (
          <div className="mt-0.5 flex items-center gap-1 text-[12px] text-muted">
            <button
              className="inline-flex items-center gap-1.5 rounded-md bg-brand/5 px-1.5 py-0.5 text-[11px] text-brand hover:bg-brand/10"
              onClick={() => onReply(m.parentId ? (m.parentId as string) : m.id)}
              title="Open thread"
            >
              <CornerDownRight size={12} className="text-muted" />
              <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-border bg-muted/20 text-[9px] font-semibold text-foreground">
                {lastReplyUser?.avatarUrl ? (
                  <img src={lastReplyUser.avatarUrl} alt={lastReplyUser.name} className="h-full w-full object-cover" />
                ) : (
                  (lastReplyUser?.name || m.author || '?').slice(0, 2).toUpperCase()
                )}
              </div>
              <span className="font-bold">{effectiveThread.count}개의 댓글</span>
              {lastReplyTime && <span className="text-muted">{lastReplyTime}</span>}
            </button>
          </div>
        )}
        {unreadMemberCount > 0 && (
          <span
            className="inline-flex px-2.5 py-1 text-[11px] font-semibold text-black"
            title={`안 읽은 인원 ${unreadMemberCount}명`}
          >
            {unreadMemberCount}
          </span>
        )}
      </div>
    </div>
  );
}

export function MessageGroup({
  items,
  isMine,
  view,
  meId,
  otherMemberCount,
  otherSeen,
  users,
  threadMetaMap,
  onEdit,
  onReact,
  onReply,
  onQuote,
  openMenu,
  selectable,
  selectedIds,
  onToggleSelect,
  pinnedIds,
  savedIds,
  onPin,
  onSave,
  onDelete,
  onOpenProfile,
}: MessageGroupProps) {
  const head = items[0];
  const seenNames = otherSeen[head.id] || [];
  return (
    <div className="space-y-0">
      {items.map((item, index) => (
        <MessageRow
          key={item.id}
          m={item}
          isMine={isMine}
          view={view}
          meId={meId}
          otherMemberCount={otherMemberCount}
          avatarUrl={users[item.authorId]?.avatarUrl}
          threadMeta={threadMetaMap?.[item.id]}
          otherSeenNames={index === items.length - 1 ? seenNames : []}
          showHeader={index === 0}
          showAvatar={index === 0}
          users={users}
          onEdit={onEdit}
          onReact={onReact}
          onReply={onReply}
          onQuote={onQuote}
          openMenu={openMenu}
          selectable={selectable}
          selected={selectedIds.has(item.id)}
          onToggleSelect={onToggleSelect}
          pinned={pinnedIds.has(item.id)}
          saved={savedIds.has(item.id)}
          onPin={onPin}
          onSave={onSave}
          onDelete={onDelete}
          onOpenProfile={onOpenProfile}
        />
      ))}
    </div>
  );
}
