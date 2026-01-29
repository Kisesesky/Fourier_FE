'use client';

import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

type DrawerProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  children: React.ReactNode;
  width?: number;
  title?: string;
  side?: 'left' | 'right';
  headerContent?: (close: () => void) => React.ReactNode;
};

export default function Drawer({
  open,
  onOpenChange,
  children,
  width = 380,
  title = 'Details',
  side = 'right',
  headerContent,
}: DrawerProps) {
  const [dragDistance, setDragDistance] = useState(0);
  const startX = useRef<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const THRESHOLD = 80;
  const MAX_DRAG = 240;
  const isRight = side === 'right';
  const hiddenOffset = width + 16;

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    if (open) document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onOpenChange]);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      startX.current = e.touches[0].clientX;
      setDragDistance(0);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startX.current == null) return;
      const delta = e.touches[0].clientX - startX.current;
      const adjusted = isRight
        ? Math.min(Math.max(delta, 0), MAX_DRAG)
        : Math.min(Math.max(-delta, 0), MAX_DRAG);
      setDragDistance(adjusted);
    };

    const onTouchEnd = () => {
      if (dragDistance > THRESHOLD) onOpenChange(false);
      setDragDistance(0);
      startX.current = null;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [dragDistance, onOpenChange, isRight]);

  const translate = open
    ? (isRight ? dragDistance : -dragDistance)
    : (isRight ? hiddenOffset : -hiddenOffset);

  const renderHeader = headerContent
    ? headerContent(() => onOpenChange(false))
    : (
      <>
        <div className="font-medium">{title}</div>
        <button
          className="text-sm text-muted hover:text-foreground"
          onClick={() => onOpenChange(false)}
        >
          Close
        </button>
      </>
    );

  return (
    <div className={clsx('fixed inset-0 z-50 lg:hidden', open ? 'pointer-events-auto' : 'pointer-events-none')}>
      <div
        className={clsx('absolute inset-0 bg-black/40 transition-opacity', open ? 'opacity-100' : 'opacity-0')}
        onClick={() => onOpenChange(false)}
      />
      <div
        ref={panelRef}
        className={clsx(
          'absolute top-0 h-full w-full bg-panel shadow-panel transition-transform',
          isRight ? 'right-0 border-l border-border' : 'left-0 border-r border-border'
        )}
        style={{
          maxWidth: width,
          transform: `translateX(${translate}px)`
        }}
      >
        <div className="flex h-12 items-center justify-between border-b border-border px-4">
          {renderHeader}
        </div>
        <div className="h-[calc(100%-48px)] overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
