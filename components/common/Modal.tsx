// components/common/Modal.tsx
'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import clsx from 'clsx';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  widthClass?: string; // e.g. "max-w-4xl"
  heightClass?: string;
  bodyClassName?: string;
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  className,
  widthClass = 'max-w-5xl',
  heightClass,
  bodyClassName
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] text-foreground">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx(
        'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] rounded-2xl border border-border bg-panel shadow-panel',
        widthClass, heightClass, className
      )}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-panel">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-subtle" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>
        <div className={clsx("max-h-[78vh] overflow-auto bg-panel", bodyClassName)}>{children}</div>
      </div>
    </div>,
    document.body
  );
}
