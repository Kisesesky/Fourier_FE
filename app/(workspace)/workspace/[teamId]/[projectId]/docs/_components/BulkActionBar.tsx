"use client";

import { useDocSelection } from "../_model/store";
import {
  moveDocToFolder,
  deleteDoc,
  getDocMeta,
  createDoc,
  saveDocs,
  getDocs,
} from "../_model/docs";

export default function BulkActionBar() {
  const { selectedDocs, clear } = useDocSelection();

  if (!selectedDocs.length) return null;

  const handleDuplicate = () => {
    const docs = getDocs();
    selectedDocs.forEach((id) => {
      const src = getDocMeta(id);
      if (!src) return;

      createDoc(
        `${src.title} - 복제`,
        src.folderId ?? undefined,
        {
          color: src.color,
          icon: src.icon,
        }
      );
    });
  };

  const handleToggleStar = () => {
    const docs = getDocs().map((d) =>
      selectedDocs.includes(d.id)
        ? { ...d, starred: !d.starred }
        : d
    );
    saveDocs(docs);
  };

  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 border-b bg-panel px-4 py-2 shadow">
      <span className="text-sm">{selectedDocs.length}개 선택됨</span>

      {/* 이동 기능: 심플하게 최상위로 이동 */}
      <button
        className="btn"
        onClick={() => {
          selectedDocs.forEach((id) => moveDocToFolder(id, null));
          clear();
        }}
      >
        이동 (최상위)
      </button>

      <button className="btn" onClick={handleDuplicate}>
        복제
      </button>

      <button className="btn" onClick={handleToggleStar}>
        중요 표시
      </button>

      <button
        className="btn text-red-500"
        onClick={() => {
          selectedDocs.forEach((id) => deleteDoc(id));
          clear();
        }}
      >
        삭제
      </button>

      <button className="btn ml-auto text-muted" onClick={clear}>
        선택 해제
      </button>
    </div>
  );
}
