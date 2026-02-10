// app/(workspace)/workspace/[teamId]/[projectId]/chat/_components/MessageGroup.tsx
'use client';

import { useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import type { Attachment, Msg, ChatUser } from '@/workspace/chat/_model/types';
import MarkdownText from './MarkdownText';
import LinkPreview, { extractUrls } from './LinkPreview';
import CodeFencePreview, { extractFences } from './CodeFencePreview';
import { LightboxItem, openLightbox } from './Lightbox';
import { Film, File, FileText, SmilePlus, Reply, MoreHorizontal, Pencil, Quote, Trash, Pin, Bookmark } from 'lucide-react';

type MessageRowProps = {
  m: Msg;
  isMine: boolean;
  view: 'compact' | 'cozy';
  meId: string;
  otherSeenNames: string[];
  showHeader: boolean;
  showAvatar: boolean;
  avatarUrl?: string;
  threadMeta?: { count: number; lastTs?: number; lastAuthorId?: string };
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onReact: (id: string, emoji: string) => void;
  onReply: (rootId: string) => void;
  openMenu: (e: MouseEvent<HTMLElement>, m: Msg, isMine: boolean) => void;
  onQuoteInline: (m: Msg) => void;
  selectable: boolean;
  selected: boolean;
  onToggleSelect: (id: string, multi?: boolean) => void;
  pinned: boolean;
  saved: boolean;
  onPin: (id: string) => void;
  onSave: (id: string) => void;
  users: Record<string, ChatUser>;
};

type MessageGroupProps = {
  items: Msg[];
  isMine: boolean;
  view: 'compact' | 'cozy';
  meId: string;
  otherSeen: Record<string, string[]>;
  users: Record<string, ChatUser>;
  threadMetaMap?: Record<string, { count: number; lastTs?: number; lastAuthorId?: string }>;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onReact: (id: string, emoji: string) => void;
  onReply: (rootId: string) => void;
  openMenu: (e: MouseEvent<HTMLElement>, m: Msg, isMine: boolean) => void;
  onQuoteInline: (m: Msg) => void;
  selectable: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string, multi?: boolean) => void;
  pinnedIds: Set<string>;
  savedIds: Set<string>;
  onPin: (id: string) => void;
  onSave: (id: string) => void;
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

function ReactionPills({ m, meId, onToggle }: { m: Msg; meId: string; onToggle: (emoji: string) => void }) {
  const entries = Object.entries(m.reactions || {});
  if (entries.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {entries.map(([emoji, users]) => {
        const reacted = users.includes(meId);
        return (
        <button
          key={emoji}
          className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] leading-none transition ${
            reacted ? "border-border bg-subtle/80 text-foreground" : "border-border bg-subtle/40 text-foreground hover:bg-subtle/60"
          }`}
          onClick={() => onToggle(emoji)}
          title={`${users.length}명`}
        >
          <span>{emoji}</span>
          {users.length > 0 && <span className={reacted ? "text-background/80" : "text-muted"}>{users.length}</span>}
        </button>
      )})}
    </div>
  );
}

function MessageRow({
  m,
  isMine,
  view,
  meId,
  otherSeenNames,
  showHeader,
  showAvatar,
  avatarUrl,
  threadMeta,
  onEdit,
  onDelete,
  onReact,
  onReply,
  openMenu,
  onQuoteInline,
  selectable,
  selected,
  onToggleSelect,
  pinned,
  saved,
  onPin,
  onSave,
  users,
}: MessageRowProps) {
  const padClass = showHeader ? (view === 'compact' ? 'py-0.5' : 'py-1') : 'py-0';
  const urls = extractUrls(m.text);
  const fences = extractFences(m.text);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(m.text || '');

  useEffect(() => setDraft(m.text || ''), [m.text]);

  const initials = (m.author || '?').slice(0, 2).toUpperCase();
  const ts = new Date(m.ts);
  const timestampLabel = ts.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });
  const timestampIso = ts.toISOString();
  const contentSpacing = showHeader ? 'space-y-1' : 'space-y-0';

  const effectiveThread = threadMeta ?? (m.threadCount ? { count: m.threadCount } : undefined);
  const lastReplyTime = effectiveThread?.lastTs ? new Date(effectiveThread.lastTs).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' }) : null;
  const lastReplyUser = effectiveThread?.lastAuthorId ? users[effectiveThread.lastAuthorId] : undefined;
  return (
    <div
      className={`group/message relative px-3 ${padClass} transition-all duration-150 ease-out ${
        selected ? 'bg-brand/10 ring-1 ring-brand/40' : 'hover:bg-subtle/40'
      }`}
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
        <div className="flex gap-2.5">
          <div className="pt-0.5">
            {showAvatar ? (
              <button
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border bg-muted/20 text-[12px] font-semibold text-foreground"
                onClick={(e) => openMenu(e, m, isMine)}
                aria-label={`${m.author} 메시지 메뉴 열기`}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={m.author} className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </button>
            ) : (
              <div className="h-9 w-9 opacity-0" />
            )}
          </div>
          <div className={`min-w-0 flex-1 ${contentSpacing}`}>
            {showHeader && (
              <div className="flex items-center gap-2 text-[14px] text-muted">
                <span className="font-semibold text-foreground">{m.author}</span>
                <time className="text-[11px]" dateTime={timestampIso}>{timestampLabel}</time>
              </div>
            )}
            {m.reply && (
              <div
                className="mb-1 flex items-center gap-3 rounded-full border border-border/70 bg-panel/70 px-3 py-1.5 text-left text-[12px] text-muted transition hover:border-border/50 hover:bg-panel cursor-pointer"
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
                <span className="h-8 w-8 overflow-hidden rounded-full bg-muted/20 text-[11px] font-semibold text-foreground">
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
                <div className="min-w-0 flex-1 truncate text-[12px] text-muted">
                  <span className="font-semibold text-foreground">{m.reply.sender?.name ?? "User"}</span>
                  <span className="mx-1 text-muted">:</span>
                  <span>{m.reply.isDeleted ? "삭제된 메시지입니다." : m.reply.content ?? ""}</span>
                </div>
              </div>
            )}
            <div className="text-[14px] leading-snug text-foreground">
              <MarkdownText text={m.text} />
              {m.editedAt && <span className="ml-2 text-[11px] text-muted">(edited)</span>}
            </div>
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

      <div className="absolute right-2 top-1 z-10 flex items-center gap-0.5 rounded-md border border-border bg-panel/90 px-1 py-0.5 opacity-0 transition group-hover/message:opacity-100">
        <button
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-subtle/60"
          onClick={() => onReact(m.id, "👍")}
          aria-label="Add reaction"
          title="Add reaction"
        >
          <SmilePlus size={14} />
        </button>
        <button
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-subtle/60"
          onClick={() => onReply(m.parentId ? (m.parentId as string) : m.id)}
          aria-label="Reply"
          title="Reply in thread"
        >
          <Reply size={14} />
        </button>
        <button
          className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${pinned ? 'text-amber-500' : 'text-muted'} hover:bg-subtle/60`}
          onClick={() => onPin(m.id)}
          aria-label="Pin"
          title="Pin message"
        >
          <Pin size={14} />
        </button>
        <button
          className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${saved ? 'text-emerald-500' : 'text-muted'} hover:bg-subtle/60`}
          onClick={() => onSave(m.id)}
          aria-label="Save"
          title="Save message"
        >
          <Bookmark size={14} />
        </button>
        <button
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-subtle/60"
          onClick={() => onQuoteInline(m)}
          aria-label="Reply"
          title="Reply"
        >
          <Quote size={14} />
        </button>
        <button
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-subtle/60"
          onClick={(e) => openMenu(e, m, isMine)}
          aria-label="More actions"
          title="More actions"
        >
          <MoreHorizontal size={14} />
        </button>
      </div>

      <div className={`pl-[36px] ${showHeader ? 'mt-1' : 'mt-0.5'}`}>
        <div className="flex flex-wrap items-center gap-1 text-[12px] text-muted">
          <ReactionPills m={m} meId={meId} onToggle={(emoji) => onReact(m.id, emoji)} />
        </div>
        {effectiveThread?.count && effectiveThread.count > 0 && (
          <div className="mt-0.5 flex items-center gap-1 text-[12px] text-muted">
            <button
              className="inline-flex items-center gap-1.5 rounded-md bg-brand/5 px-1.5 py-0.5 text-[11px] text-brand hover:bg-brand/10"
              onClick={() => onReply(m.parentId ? (m.parentId as string) : m.id)}
              title="Open thread"
            >
              <span className="text-muted">┗</span>
              <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-border bg-muted/20 text-[9px] font-semibold text-foreground">
                {lastReplyUser?.avatarUrl ? (
                  <img src={lastReplyUser.avatarUrl} alt={lastReplyUser.name} className="h-full w-full object-cover" />
                ) : (
                  (lastReplyUser?.name || m.author || '?').slice(0, 2).toUpperCase()
                )}
              </div>
              <span className="font-bold">{effectiveThread.count}개의 댓글</span>
              {lastReplyTime && <span className="text-muted">· {lastReplyTime}</span>}
            </button>
          </div>
        )}
        {otherSeenNames.length > 0 && (
          <span className="opacity-70">
            Seen by {otherSeenNames.slice(0, 3).join(', ')}
            {otherSeenNames.length > 3 ? ` 외 ${otherSeenNames.length - 3}명` : ''}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2 opacity-0 transition group-hover/message:opacity-100">
          {isMine && (
            <button className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-foreground" onClick={() => setEditing(true)}>
              <Pencil size={12} /> Edit
            </button>
          )}
          {isMine && (
            <button className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-foreground" onClick={() => onDelete(m.id)}>
              <Trash size={12} /> Delete
            </button>
          )}
          <button className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-foreground" onClick={() => onQuoteInline(m)}>
            <Quote size={12} /> Reply
          </button>
        </div>
      </div>
    </div>
  );
}

export function MessageGroup({
  items,
  isMine,
  view,
  meId,
  otherSeen,
  users,
  threadMetaMap,
  onEdit,
  onDelete,
  onReact,
  onReply,
  openMenu,
  onQuoteInline,
  selectable,
  selectedIds,
  onToggleSelect,
  pinnedIds,
  savedIds,
  onPin,
  onSave,
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
          avatarUrl={users[item.authorId]?.avatarUrl}
          threadMeta={threadMetaMap?.[item.id]}
          otherSeenNames={index === items.length - 1 ? seenNames : []}
          showHeader={index === 0}
          showAvatar={index === 0}
          users={users}
          onEdit={onEdit}
          onDelete={onDelete}
          onReact={onReact}
          onReply={onReply}
          openMenu={openMenu}
          onQuoteInline={onQuoteInline}
          selectable={selectable}
          selected={selectedIds.has(item.id)}
          onToggleSelect={onToggleSelect}
          pinned={pinnedIds.has(item.id)}
          saved={savedIds.has(item.id)}
          onPin={onPin}
          onSave={onSave}
        />
      ))}
    </div>
  );
}
