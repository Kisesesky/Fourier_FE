'use client';

import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import clsx from 'clsx';

import type { DocFolder } from '@/workspace/docs/_model/docs';
import { MENU_ATTR } from './utils';

type FolderGridProps = {
  folders: DocFolder[];
  counts: Map<string, number>;
  totalCount: number;
  unfiledCount: number;
  activeFolder: string;
  onSelect: (id: string) => void;
  onRename: (folder: DocFolder) => void;
  onDelete: (folder: DocFolder) => void;
};

export function FolderGrid({
  folders,
  counts,
  totalCount,
  unfiledCount,
  activeFolder,
  onSelect,
  onRename,
  onDelete,
}: FolderGridProps) {
  const [menuFor, setMenuFor] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted">내 드라이브</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <FolderCard
          label="전체 노트"
          count={totalCount}
          icon="📚"
          color="var(--border)"
          active={activeFolder === 'all'}
          onClick={() => onSelect('all')}
        />
        {folders.map((folder) => (
          <FolderCard
            key={folder.id}
            label={folder.name}
            count={counts.get(folder.id) ?? 0}
            icon={folder.icon || '📁'}
            color={folder.color}
            active={activeFolder === folder.id}
            onClick={() => onSelect(folder.id)}
            showMenu
            menuOpen={menuFor === folder.id}
            onMenuToggle={() => setMenuFor((prev) => (prev === folder.id ? null : folder.id))}
            onRename={() => onRename(folder)}
            onDelete={() => onDelete(folder)}
          />
        ))}
        {unfiledCount > 0 && (
          <FolderCard
            label="미분류"
            count={unfiledCount}
            icon="🗂️"
            color="#94a3b8"
            active={activeFolder === 'unfiled'}
            onClick={() => onSelect(activeFolder === 'unfiled' ? 'all' : 'unfiled')}
          />
        )}
      </div>
    </div>
  );
}

type FolderCardProps = {
  label: string;
  count?: number;
  actualCount?: number;
  icon: string;
  color?: string;
  active: boolean;
  onClick: () => void;
  showMenu?: boolean;
  menuOpen?: boolean;
  onMenuToggle?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
};

function FolderCard({
  label,
  count = 0,
  icon,
  color,
  active,
  onClick,
  showMenu,
  menuOpen,
  onMenuToggle,
  onRename,
  onDelete,
}: FolderCardProps) {
  return (
    <div
      className={clsx(
        'relative flex flex-col rounded-2xl border p-4 text-left shadow-sm transition',
        active ? 'border-foreground bg-foreground/10' : 'border-border hover:border-foreground/40 hover:shadow-md'
      )}
    >
      <button className="flex flex-1 items-center gap-3 text-left" onClick={onClick}>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
          style={{ backgroundColor: color || 'var(--border)' }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{label}</p>
          <p className="text-xs text-muted">{typeof count === 'number' ? `${count}개의 노트` : '정리 중'}</p>
        </div>
      </button>
      {showMenu && (
        <div className="absolute right-3 top-3" {...MENU_ATTR}>
          <button
            className="rounded-full border border-border p-1 text-muted transition hover:text-foreground"
            onClick={onMenuToggle}
          >
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-20 w-36 rounded-xl border border-border bg-panel text-sm shadow-xl">
              <button className="block w-full px-3 py-2 text-left hover:bg-subtle/60" onClick={onRename}>
                이름 변경
              </button>
              <button className="block w-full px-3 py-2 text-left text-red-500 hover:bg-red-500/10" onClick={onDelete}>
                삭제
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
