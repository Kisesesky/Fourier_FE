'use client';

import { X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type TermsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAgree: () => void;
  title: string;
  content: string;
};

export default function TermsModal({ isOpen, onClose, onAgree, title, content }: TermsModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isConfirmButtonEnabled, setIsConfirmButtonEnabled] = useState(false);

  const normalizedContent = useMemo(() => content.replaceAll("className=", "class="), [content]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setIsConfirmButtonEnabled(false);
    document.body.style.overflow = "hidden";

    const frame = window.setTimeout(() => {
      if (!contentRef.current) {
        return;
      }

      const { scrollHeight, clientHeight } = contentRef.current;
      if (scrollHeight <= clientHeight + 1) {
        setIsConfirmButtonEnabled(true);
      }
    }, 50);

    return () => {
      window.clearTimeout(frame);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleScroll = () => {
    if (!contentRef.current) {
      return;
    }

    const { scrollTop, clientHeight, scrollHeight } = contentRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 4) {
      setIsConfirmButtonEnabled(true);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
      <div className="flex h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500">끝까지 스크롤한 뒤 동의할 수 있습니다.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="모달 닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div
          ref={contentRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-5 py-4 text-sm leading-7 text-slate-700"
        >
          <div
            className="prose prose-slate max-w-none prose-headings:mb-3 prose-headings:text-slate-900 prose-p:my-3 prose-li:my-1"
            dangerouslySetInnerHTML={{ __html: normalizedContent }}
          />
        </div>

        <footer className="border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={onAgree}
            disabled={!isConfirmButtonEnabled}
            className={`w-full rounded-2xl py-3 text-base font-semibold text-white transition ${
              isConfirmButtonEnabled
                ? "bg-indigo-600 hover:bg-indigo-500"
                : "cursor-not-allowed bg-slate-300"
            }`}
          >
            약관 동의
          </button>
        </footer>
      </div>
    </div>
  );
}
