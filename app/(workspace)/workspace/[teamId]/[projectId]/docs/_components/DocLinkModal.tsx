"use client";

import { useEffect, useState } from "react";

interface DocLinkModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (url: string, text: string) => void;
}

export default function DocLinkModal({
  open,
  onClose,
  onSubmit,
}: DocLinkModalProps) {
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!open) {
      setUrl("");
      setLabel("");
    }
  }, [open]);

  if (!open) return null;

  const hostname = getHostname(url);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-gray-900">링크 추가</h2>
        <p className="mt-1 text-sm text-gray-500">
          URL과 표시할 텍스트를 입력하세요.
        </p>

        <label className="mt-4 block text-sm font-medium text-gray-700">
          URL
        </label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
        />

        <label className="mt-4 block text-sm font-medium text-gray-700">
          표시 텍스트 (선택)
        </label>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="링크 제목"
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
        />

        {url && (
          <div className="mt-4 rounded-lg border bg-gray-50 px-3 py-2 text-sm">
            <div className="font-medium text-gray-900">
              {label || hostname || url}
            </div>
            <div className="text-xs text-gray-500">{url}</div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="button"
            disabled={!url}
            className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
            onClick={() => onSubmit(url, label)}
          >
            삽입
          </button>
        </div>
      </div>
    </div>
  );
}

function getHostname(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.hostname;
  } catch {
    return "";
  }
}
