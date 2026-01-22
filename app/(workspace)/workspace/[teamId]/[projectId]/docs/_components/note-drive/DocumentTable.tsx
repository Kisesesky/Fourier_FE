'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Check, MoreHorizontal, Star } from 'lucide-react';
import clsx from 'clsx';

import type { DocFolder, DocMeta } from '@/workspace/docs/_model/docs';
import { MENU_ATTR, formatFileSize, relativeTime } from './utils';

export type SortKey = 'title' | 'updatedAt' | 'owner' | 'size';

type DocumentTableProps = {
  docs: DocMeta[];
  folders: DocFolder[];
  sortKey: SortKey;
  sortDir: 'asc' | 'desc';
  onSortChange: (key: SortKey) => void;
  onOpen: (doc: DocMeta) => void;
  onRename: (doc: DocMeta) => void;
  onDuplicate: (doc: DocMeta) => void;
  onDelete: (doc: DocMeta) => void;
  onToggleStar: (doc: DocMeta) => void;
  onMove: (doc: DocMeta, folderId?: string) => void;
};

export function DocumentTable({
  docs,
  folders,
  sortKey,
  sortDir,
  onSortChange,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
  onToggleStar,
  onMove,
}: DocumentTableProps) {
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [pickerFor, setPickerFor] = useState<string | null>(null);

  useEffect(() => {
    if (!menuFor) {
      setPickerFor(null);
    }
  }, [menuFor]);

  useEffect(() => {
    if (!menuFor) return;
    const onDown = (event: MouseEvent) => {
      if (!(event.target as HTMLElement | null)?.closest('[data-doc-menu="true"]')) {
        setMenuFor(null);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuFor]);

  if (!docs.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border px-6 py-10 text-sm text-muted">
        <p>표시할 문서가 없습니다.</p>
        <p className="text-xs">필터나 정렬을 조정해 보세요.</p>
      </div>
    );
  }

  const headerButtonClasses = (key: SortKey) =>
    clsx(
      'flex items-center gap-1 text-left',
      sortKey === key ? 'text-foreground' : 'text-muted'
    );

  return (
    <div className="flex flex-1 flex-col">
      <div className="hidden border-b border-border px-4 py-2 text-xs uppercase tracking-wide text-muted sm:grid sm:grid-cols-[minmax(200px,2fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(100px,1fr)_120px]">
        <button className={headerButtonClasses('title')} onClick={() => onSortChange('title')}>
          이름
          <ChevronDown
            size={12}
            className={clsx(
              'transition',
              sortKey === 'title' ? (sortDir === 'desc' ? 'rotate-180' : 'rotate-0') : 'opacity-30'
            )}
          />
        </button>
        <button className={headerButtonClasses('owner')} onClick={() => onSortChange('owner')}>
          소유자
          <ChevronDown
            size={12}
            className={clsx(
              'transition',
              sortKey === 'owner' ? (sortDir === 'desc' ? 'rotate-180' : 'rotate-0') : 'opacity-30'
            )}
          />
        </button>
        <button className={headerButtonClasses('updatedAt')} onClick={() => onSortChange('updatedAt')}>
          수정 날짜
          <ChevronDown
            size={12}
            className={clsx(
              'transition',
              sortKey === 'updatedAt' ? (sortDir === 'desc' ? 'rotate-180' : 'rotate-0') : 'opacity-30'
            )}
          />
        </button>
        <button className={headerButtonClasses('size')} onClick={() => onSortChange('size')}>
          파일 크기
          <ChevronDown
            size={12}
            className={clsx(
              'transition',
              sortKey === 'size' ? (sortDir === 'desc' ? 'rotate-180' : 'rotate-0') : 'opacity-30'
            )}
          />
        </button>
        <span className="text-right">동작</span>
      </div>
      <div className="flex-1 divide-y divide-border/70">
        {docs.map((doc) => {
          const currentFolderId = resolveDocFolderId(doc, folders);
          const menuOpen = menuFor === doc.id;
          const pickerOpen = pickerFor === doc.id;
          return (
            <div
              key={doc.id}
              className="group grid grid-cols-1 gap-3 px-4 py-3 text-sm transition hover:bg-subtle/40 sm:grid-cols-[minmax(200px,2fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(100px,1fr)_120px]"
            >
              <button className="flex min-w-0 items-center gap-3 text-left" onClick={() => onOpen(doc)}>
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-base"
                  style={{ backgroundColor: doc.color || 'var(--border)' }}
                >
                  {doc.icon || '📄'}
                </div>
                <span className="truncate font-medium">{doc.title}</span>
              </button>
              <div className="text-muted">{doc.owner}</div>
              <div className="text-muted">{relativeTime(doc.updatedAt)}</div>
              <div className="text-muted">{formatFileSize(doc.fileSize)}</div>
              <div className="flex items-center justify-end gap-2 text-muted" {...MENU_ATTR}>
                <button
                  className={clsx(
                    'rounded-full border px-2 py-1 transition',
                    doc.starred ? 'border-yellow-500 text-yellow-500' : 'border-border text-muted hover:text-yellow-500'
                  )}
                  onClick={() => onToggleStar(doc)}
                  title="중요 표시"
                >
                  <Star size={14} fill={doc.starred ? 'currentColor' : 'none'} />
                </button>
                <div className="relative">
                  <button
                    className="rounded-full border border-border p-1 text-muted transition hover:text-foreground"
                    onClick={() => setMenuFor((prev) => (prev === doc.id ? null : doc.id))}
                    title="옵션"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-8 z-20 w-48 rounded-xl border border-border bg-panel text-sm shadow-xl">
                      <button className="block w-full px-3 py-2 text-left hover:bg-subtle/60" onClick={() => { setMenuFor(null); onRename(doc); }}>
                        이름 변경
                      </button>
                      <button className="block w-full px-3 py-2 text-left hover:bg-subtle/60" onClick={() => { setMenuFor(null); onDuplicate(doc); }}>
                        복제
                      </button>
                      <button
                        className="block w-full px-3 py-2 text-left hover:bg-subtle/60"
                        onClick={() => setPickerFor((prev) => (prev === doc.id ? null : doc.id))}
                      >
                        폴더 이동
                      </button>
                      {pickerOpen && (
                        <div className="border-t border-border/60">
                          <div className="px-3 py-2 text-xs uppercase tracking-wide text-muted">폴더 선택</div>
                          <div className="max-h-48 overflow-y-auto text-xs">
                            {folders.map((folder) => (
                              <button
                                key={folder.id}
                                className={clsx(
                                  'flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-subtle/60',
                                  currentFolderId === folder.id ? 'text-foreground' : 'text-muted'
                                )}
                                onClick={() => {
                                  onMove(doc, folder.id);
                                  setMenuFor(null);
                                }}
                              >
                                <span>{folder.icon || '📁'}</span>
                                <span className="flex-1 truncate">{folder.name}</span>
                                {currentFolderId === folder.id && <Check size={12} />}
                              </button>
                            ))}
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-muted hover:bg-subtle/60"
                              onClick={() => {
                                onMove(doc, undefined);
                                setMenuFor(null);
                              }}
                            >
                              분류 해제
                            </button>
                          </div>
                        </div>
                      )}
                      <button className="block w-full px-3 py-2 text-left text-red-500 hover:bg-red-500/10" onClick={() => { setMenuFor(null); onDelete(doc); }}>
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function resolveDocFolderId(doc: DocMeta, folders: DocFolder[]) {
  if (doc.folderId) return doc.folderId;
  if (doc.locations?.length) return doc.locations[0] ?? null;

  const legacyPath = (doc as { location?: string })?.location;
  if (typeof legacyPath === 'string') {
    const [primary] = legacyPath.split('/');
    const match = folders.find(
      (folder) => folder.name.trim() === primary?.trim()
    );
    return match?.id ?? null;
  }

  return null;
}
