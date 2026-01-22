// lib/kanbanHistory.ts
'use client';

import { useCallback, useEffect, useRef, useState } from "react";

export type Snapshot<T> = T;

export function useHistory<T>(initial: T) {
  const [present, setPresent] = useState<T>(initial);
  const pastRef = useRef<Snapshot<T>[]>([]);
  const futureRef = useRef<Snapshot<T>[]>([]);

  const commit = useCallback((next: T) => {
    pastRef.current.push(present);
    futureRef.current = [];
    setPresent(next);
  }, [present]);

  const canUndo = pastRef.current.length > 0;
  const canRedo = futureRef.current.length > 0;

  const undo = useCallback(() => {
    if (!canUndo) return;
    const prev = pastRef.current.pop() as T;
    futureRef.current.push(present);
    setPresent(prev);
  }, [present, canUndo]);

  const redo = useCallback(() => {
    if (!canRedo) return;
    const next = futureRef.current.pop() as T;
    pastRef.current.push(present);
    setPresent(next);
  }, [present, canRedo]);

  // 단축키
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (!isMeta) return;
      if (e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.key.toLowerCase() === 'z' && e.shiftKey) || (e.key.toLowerCase() === 'y')) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  return { state: present, set: setPresent, commit, undo, redo, canUndo, canRedo };
}
