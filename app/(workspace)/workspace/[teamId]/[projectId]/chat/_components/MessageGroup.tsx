'use client';

import { useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import type { Attachment, Msg, ChatUser } from '@/workspace/chat/_model/types';
import MarkdownText from './MarkdownText';
import EmojiPicker from './EmojiPicker';
import ReactionBar from './ReactionBar';
import LinkPreview, { extractUrls } from './LinkPreview';
import CodeFencePreview, { extractFences } from './CodeFencePreview';
import { LightboxItem, openLightbox } from './Lightbox';
import { Eye, Film, File, FileText, Laugh, Pencil, Quote, Settings2, Trash } from 'lucide-react';

type MessageRowProps = {
  m: Msg;
  isMine: boolean;
  view: 'compact' | 'cozy';
  meId: string;
  otherSeenNames: string[];
  showHeader: boolean;
  showAvatar: boolean;
  avatarUrl?: string;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onReact: (id: string, emoji: string) => void;
  onReply: (rootId: string) => void;
  openMenu: (e: MouseEvent<HTMLElement>, m: Msg, isMine: boolean) => void;
  onQuoteInline: (m: Msg) => void;
  selectable: boolean;
  selected: boolean;
  onToggleSelect: (id: string, multi?: boolean) => void;
};

type MessageGroupProps = {
  items: Msg[];
  isMine: boolean;
  view: 'compact' | 'cozy';
  meId: string;
  otherSeen: Record<string, string[]>;
  users: Record<string, ChatUser>;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onReact: (id: string, emoji: string) => void;
  onReply: (rootId: string) => void;
  openMenu: (e: MouseEvent<HTMLElement>, m: Msg, isMine: boolean) => void;
  onQuoteInline: (m: Msg) => void;
  selectable: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string, multi?: boolean) => void;
};

function AttachmentBubble({ attachment, all, index }: { attachment: Attachment; all: Attachment[]; index: number }) {
  const handleOpen = () => {
    const items: LightboxItem[] = all
      .map((item) => {
        const isVideo = item.type.startsWith('video/');
        const isImage = item.type.startsWith('image/');
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

function ReactionPills({ m, onToggle }: { m: Msg; onToggle: (emoji: string) => void }) {
  const entries = Object.entries(m.reactions || {});
  if (entries.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {entries.map(([emoji, users]) => (
        <button
          key={emoji}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-subtle/40 px-2 py-0.5 text-[11px] hover:bg-subtle/60"
          onClick={() => onToggle(emoji)}
          title={`${users.length}명`}
        >
          <span>{emoji}</span>
          {users.length > 0 && <span className="text-muted">{users.length}</span>}
        </button>
      ))}
    </div>
  );
}

function SeenBadge({ m, meId }: { m: Msg; meId: string }) {
  const seen = new Set(m.seenBy || []);
  if (!seen.has(meId)) return null;
  return (
    <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted">
      <Eye size={12} /> Seen by you
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
  onEdit,
  onDelete,
  onReact,
  onReply,
  openMenu,
  onQuoteInline,
  selectable,
  selected,
  onToggleSelect,
}: MessageRowProps) {
  const padClass = showHeader ? (view === 'compact' ? 'py-1' : 'py-1.5') : 'py-0.5';
  const urls = extractUrls(m.text);
  const fences = extractFences(m.text);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(m.text || '');

  useEffect(() => setDraft(m.text || ''), [m.text]);

  const initials = (m.author || '?').slice(0, 2).toUpperCase();
  const ts = new Date(m.ts);
  const timestampLabel = ts.toLocaleString();
  const timestampIso = ts.toISOString();
  const contentSpacing = showHeader ? 'space-y-2' : 'space-y-1';
  const metaMargin = showHeader ? 'mt-2' : 'mt-1';

  return (
    <div
      className={`group/message relative ${padClass} -mx-2 rounded-xl border border-transparent px-3 transition-all duration-150 ease-out ${
        selected ? 'border-brand/50 bg-brand/10 shadow-sm ring-1 ring-brand/40' : 'hover:border-border/60 hover:bg-subtle/20 hover:shadow-sm'
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
        <div className="flex gap-3">
          <div className="pt-1">
            {showAvatar ? (
              <button
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border bg-subtle/40 text-xs font-semibold text-muted"
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
              <div className="h-4 w-9" />
            )}
          </div>
          <div className={`min-w-0 flex-1 ${contentSpacing}`}>
            {showHeader && (
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="font-semibold text-text">{m.author}</span>
                <time dateTime={timestampIso}>{timestampLabel}</time>
                <button
                  className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-md text-muted opacity-0 transition group-hover/message:opacity-100 hover:text-text"
                  onClick={(e) => openMenu(e, m, isMine)}
                  aria-label="메시지 옵션 열기"
                >
                  <Settings2 size={14} />
                </button>
              </div>
            )}
            <div className="text-sm whitespace-pre-wrap">
              <MarkdownText text={m.text} />
              {m.editedAt && <span className="ml-2 text-[11px] text-muted">(edited)</span>}
            </div>
            <CodeFencePreview fences={fences} />
            {urls.length > 0 && (
              <div className="mt-2 space-y-2">
                {urls.map((url) => (
                  <LinkPreview key={url} url={url} />
                ))}
              </div>
            )}
            {m.attachments?.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
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

      <div
        className={`absolute top-1 ${isMine ? 'right-[-44px]' : 'left-[-44px]'} opacity-0 transition group-hover/message:opacity-100`}
      >
        <ReactionBar onPick={(emoji) => onReact(m.id, emoji)} />
      </div>

      <div className={`${metaMargin} flex flex-wrap items-center gap-2 text-[11px] text-muted`}>
        <div className="flex items-center gap-2 opacity-0 pointer-events-none transition group-hover/message:pointer-events-auto group-hover/message:opacity-100">
          <button
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 transition hover:bg-subtle/50"
            onClick={() => onReply(m.parentId ? (m.parentId as string) : m.id)}
          >
            <Quote size={12} /> Reply
          </button>
          {isMine && (
            <button
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 transition hover:bg-subtle/50"
              onClick={() => setEditing(true)}
            >
              <Pencil size={12} /> Edit
            </button>
          )}
          {isMine && (
            <button
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 transition hover:bg-subtle/50"
              onClick={() => onDelete(m.id)}
            >
              <Trash size={12} /> Delete
            </button>
          )}
          <EmojiPicker
            onPick={(emoji) => onReact(m.id, emoji)}
            anchorClass="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 transition hover:bg-subtle/50"
            triggerContent={
              <>
                <Laugh size={12} /> React
              </>
            }
          />
          <button
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 transition hover:bg-subtle/50"
            onClick={() => onQuoteInline(m)}
          >
            <Settings2 size={12} /> Quote
          </button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ReactionPills m={m} onToggle={(emoji) => onReact(m.id, emoji)} />
          <SeenBadge m={m} meId={meId} />
          {otherSeenNames.length > 0 && (
            <span className="opacity-70">
              Seen by {otherSeenNames.slice(0, 3).join(', ')}
              {otherSeenNames.length > 3 ? ` 외 ${otherSeenNames.length - 3}명` : ''}
            </span>
          )}
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
  onEdit,
  onDelete,
  onReact,
  onReply,
  openMenu,
  onQuoteInline,
  selectable,
  selectedIds,
  onToggleSelect,
}: MessageGroupProps) {
  const head = items[0];
  const seenNames = otherSeen[head.id] || [];
  return (
    <div className="space-y-0.5">
      {items.map((item, index) => (
        <MessageRow
          key={item.id}
          m={item}
          isMine={isMine}
          view={view}
          meId={meId}
          avatarUrl={users[item.authorId]?.avatarUrl}
          otherSeenNames={index === items.length - 1 ? seenNames : []}
          showHeader={index === 0}
          showAvatar={index === 0}
          onEdit={onEdit}
          onDelete={onDelete}
          onReact={onReact}
          onReply={onReply}
          openMenu={openMenu}
          onQuoteInline={onQuoteInline}
          selectable={selectable}
          selected={selectedIds.has(item.id)}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  );
}
