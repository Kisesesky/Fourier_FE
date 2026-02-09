"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { JSONContent } from "@tiptap/react";

import type { DocMeta } from "../_model/types";
import type { OutlineItem } from "../_model/hooks/useDocOutline";
import { getDocMeta, getDocs, saveDocs, syncDocsFromServer } from "../_model/docs";
import { serializeDocContent, updateDocument } from "../_service/api";

type SaveStatus = "idle" | "saving";

export interface DocEditorContextValue {
  docId: string;
  meta: DocMeta | null;
  content: JSONContent | null;
  outline: OutlineItem[];
  wordCount: number;
  status: SaveStatus;
  lastSavedAt: string | null;
  setOutline: (value: OutlineItem[]) => void;
  setWordCount: (value: number) => void;
  updateMeta: (patch: Partial<DocMeta>) => void;
  updateContent: (payload: JSONContent) => void;
}

const DocEditorContext = createContext<DocEditorContextValue | null>(null);

export function DocEditorProvider({
  docId,
  children,
}: {
  docId: string;
  children: ReactNode;
}) {
  const [meta, setMeta] = useState<DocMeta | null>(() => getDocMeta(docId));
  const [content, setContent] = useState<JSONContent | null>(
    meta?.content ?? null
  );
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(
    meta?.updatedAt ?? null
  );

  useEffect(() => {
    void syncDocsFromServer().finally(() => {
      const nextMeta = getDocMeta(docId);
      setMeta(nextMeta ?? null);
      setContent(nextMeta?.content ?? null);
      setLastSavedAt(nextMeta?.updatedAt ?? null);
    });
  }, [docId]);

  useEffect(() => {
    function sync() {
      const updated = getDocMeta(docId);
      if (!updated) return;

      setMeta({ ...updated });
      setContent(updated.content ?? null);
      setLastSavedAt(updated.updatedAt);
    }

    window.addEventListener("docs:refresh", sync);
    return () => window.removeEventListener("docs:refresh", sync);
  }, [docId]);

  const persistDocs = (updater: (docs: DocMeta[]) => DocMeta[]) => {
    setStatus("saving");
    const updated = updater(getDocs());
    saveDocs(updated);
    const savedAt = new Date().toISOString();
    setLastSavedAt(savedAt);
    setStatus("idle");
  };

  const updateMeta = (patch: Partial<DocMeta>) => {
    if (!meta) return;

    setMeta((prev) => (prev ? { ...prev, ...patch } : prev));
    persistDocs((docs) =>
      docs.map((doc) =>
        doc.id === docId
          ? { ...doc, ...patch, updatedAt: new Date().toISOString() }
          : doc
      )
    );

    void updateDocument(docId, {
      title: patch.title,
      folderId: patch.folderId,
      content: patch.content ? serializeDocContent(patch.content) : undefined,
      starred: patch.starred,
    }).catch(() => {});
  };

  const updateContent = (newContent: JSONContent) => {
    setContent(newContent);
    persistDocs((docs) =>
      docs.map((doc) =>
        doc.id === docId
          ? { ...doc, content: newContent, updatedAt: new Date().toISOString() }
          : doc
      )
    );

    void updateDocument(docId, {
      content: serializeDocContent(newContent),
    }).catch(() => {});
  };

  const value = useMemo(
    () => ({
      docId,
      meta,
      content,
      outline,
      wordCount,
      status,
      lastSavedAt,
      setOutline,
      setWordCount,
      updateMeta,
      updateContent,
    }),
    [
      docId,
      meta,
      content,
      outline,
      wordCount,
      status,
      lastSavedAt,
      setOutline,
      setWordCount,
      updateMeta,
      updateContent,
    ]
  );

  return (
    <DocEditorContext.Provider value={value}>
      {children}
    </DocEditorContext.Provider>
  );
}

export function useDocEditor() {
  const ctx = useContext(DocEditorContext);
  if (!ctx) {
    throw new Error("DocEditorContext not found.");
  }
  return ctx;
}
