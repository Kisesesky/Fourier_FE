// app/(workspace)/workspace/[teamId]/[projectId]/docs/_components/DocImageModal.tsx
'use client';

import { useEffect, useState } from "react";

interface DocImageModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (src: string, alt?: string) => void;
}

export default function DocImageModal({
  open,
  onClose,
  onSubmit,
}: DocImageModalProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [alt, setAlt] = useState("");

  useEffect(() => {
    if (!open) {
      setPreview(null);
      setAlt("");
    }
  }, [open]);

  if (!open) return null;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) {
      setPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result?.toString() ?? null;
      setPreview(result);
    };
    reader.readAsDataURL(selected);
  };

  const handleSubmit = () => {
    if (!preview) return;
    onSubmit(preview, alt.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-gray-900">이미지 첨부</h2>
        <p className="mt-1 text-sm text-gray-500">
          이미지를 업로드하면 문서에 바로 삽입됩니다.
        </p>

        <label className="mt-4 block text-sm font-medium text-gray-700">
          이미지 파일
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
        />

        <label className="mt-4 block text-sm font-medium text-gray-700">
          대체 텍스트
        </label>
        <input
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder="이미지 설명"
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
        />

        {preview && (
          <div className="mt-4 rounded-lg border bg-gray-50 p-3">
            <img
              src={preview}
              alt="preview"
              className="h-48 w-full rounded-md object-contain"
            />
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
            disabled={!preview}
            className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
            onClick={handleSubmit}
          >
            삽입
          </button>
        </div>
      </div>
    </div>
  );
}
