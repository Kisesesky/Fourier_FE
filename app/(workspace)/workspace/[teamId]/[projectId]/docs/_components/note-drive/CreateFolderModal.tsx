'use client';

import { useState, useEffect } from 'react';

type CreateFolderModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
};

export function CreateFolderModal({ open, onClose, onSubmit }: CreateFolderModalProps) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (open) setName('');
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-panel p-5 shadow-panel">
        <h3 className="text-base font-semibold">새 폴더</h3>
        <p className="mt-1 text-sm text-muted">폴더 이름을 입력하세요.</p>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-4 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          placeholder="예: 회의록"
        />
        <div className="mt-4 flex justify-end gap-2 text-sm">
          <button className="rounded-full border border-border px-4 py-2 text-muted" onClick={onClose}>
            취소
          </button>
          <button
            className="rounded-full bg-foreground px-4 py-2 text-background disabled:opacity-40"
            onClick={() => {
              if (!name.trim()) return;
              onSubmit(name.trim());
            }}
            disabled={!name.trim()}
          >
            생성
          </button>
        </div>
      </div>
    </div>
  );
}
