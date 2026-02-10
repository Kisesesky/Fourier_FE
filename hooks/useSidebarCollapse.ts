// hooks/useSidebarCollapse.ts
'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'app:sidebar-collapsed';

const readStoredValue = () => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(STORAGE_KEY) === '1';
};

export function useSidebarCollapse() {
  const [collapsed, setCollapsed] = useState<boolean>(() => readStoredValue());

  useEffect(() => {
    setCollapsed(readStoredValue());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage) return;
      if (event.key === STORAGE_KEY) {
        setCollapsed(event.newValue === '1');
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  return [collapsed, setCollapsed] as const;
}
