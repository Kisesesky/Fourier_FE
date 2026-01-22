'use client';

import Image from 'next/image';
import clsx from 'clsx';
import { useMemo } from 'react';

import { useChat } from '@/workspace/chat/_model/store';

type MobileNavHeaderProps = {
  onClose: () => void;
};

export default function MobileNavHeader({ onClose }: MobileNavHeaderProps) {
  const { me } = useChat();

  const fallback = useMemo(() => {
    const name = me?.name?.trim() || 'User';
    return name
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [me]);

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-3 mr-auto">
        <Image
          src="/logo.png"
          alt="Fourier logo"
          width={40}
          height={40}
          className="h-10 w-10 rounded-md object-cover"
          priority
        />
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-foreground">FOURIER</span>
        </div>
      </div>
      <button
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border bg-background text-sm font-semibold text-muted"
        onClick={onClose}
        aria-label="Close navigation"
      >
        {me?.avatarUrl ? (
          <img src={me.avatarUrl} alt={me?.name || 'Me'} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs">{fallback}</span>
        )}
      </button>
    </div>
  );
}
