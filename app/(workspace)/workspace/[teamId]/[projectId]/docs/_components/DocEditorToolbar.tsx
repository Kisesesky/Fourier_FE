"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading1,
  Image,
  Italic,
  Link,
  List,
  ListOrdered,
  Palette,
  Quote,
  Strikethrough,
  Type,
  Underline as UnderlineIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type AlignKey = "left" | "center" | "right";

type DropdownItem = {
  key: string;
  label: ReactNode;
  onSelect: () => void;
};

type Option = { label: string; value: string };

export interface DocEditorToolbarProps {
  editor: Editor;
  fontFamily: string;
  setFontFamily: (value: string) => void;
  fontSize: string;
  setFontSize: (value: string) => void;
  paperTone: string;
  setPaperTone: (value: string) => void;
  textAlign: AlignKey;
  setTextAlign: (value: AlignKey) => void;
  fontOptions: Option[];
  fontSizeOptions: Option[];
  paperTones: Option[];
  onInsertLink?: () => void;
  onInsertImage?: () => void;
}

export default function DocEditorToolbar({
  editor,
  fontFamily,
  setFontFamily,
  fontSize,
  setFontSize,
  paperTone,
  setPaperTone,
  textAlign,
  setTextAlign,
  fontOptions,
  fontSizeOptions,
  paperTones,
  onInsertLink,
  onInsertImage,
}: DocEditorToolbarProps) {
  return (
    <div className="sticky top-0 z-10 border-b border-border/60 bg-[#fbfbfe]/95 px-5 py-3 backdrop-blur">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <ToolbarDropdown
          icon={Type}
          ariaLabel="폰트 선택"
          items={fontOptions.map((font) => ({
            key: font.value,
            label: (
              <span style={{ fontFamily: font.value }} className="text-sm">
                {font.label}
              </span>
            ),
            onSelect: () => setFontFamily(font.value),
          }))}
        />
        <ToolbarDropdown
          label={`${fontSize}px`}
          ariaLabel="폰트 크기"
          items={fontSizeOptions.map((size) => ({
            key: size.value,
            label: size.label,
            onSelect: () => setFontSize(size.value),
          }))}
        />
        <ToolbarDropdown
          icon={Heading1}
          ariaLabel="헤딩 선택"
          items={[
            {
              key: "paragraph",
              label: "Body",
              onSelect: () => editor.chain().focus().setParagraph().run(),
            },
            {
              key: "h1",
              label: "Heading 1",
              onSelect: () =>
                editor.chain().focus().toggleHeading({ level: 1 }).run(),
            },
            {
              key: "h2",
              label: "Heading 2",
              onSelect: () =>
                editor.chain().focus().toggleHeading({ level: 2 }).run(),
            },
            {
              key: "h3",
              label: "Heading 3",
              onSelect: () =>
                editor.chain().focus().toggleHeading({ level: 3 }).run(),
            },
          ]}
        />

        <ToolbarDivider />

        <ToolbarButton
          icon={Bold}
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          icon={Italic}
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          icon={UnderlineIcon}
          label="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <ToolbarButton
          icon={Strikethrough}
          label="Strike"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        />
        <ToolbarButton
          icon={Quote}
          label="Quote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        />
        <ToolbarButton
          icon={Code}
          label="Code"
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        />

        <ToolbarDivider />

        <ToolbarDropdown
          icon={Palette}
          ariaLabel="배경 톤"
          menuClassName="min-w-[180px]"
          items={paperTones.map((tone) => ({
            key: tone.value,
            label: (
              <div className="flex items-center gap-2 text-sm">
                <span
                  className="h-4 w-4 rounded-full border"
                  style={{ backgroundColor: tone.value }}
                />
                {tone.label}
              </div>
            ),
            onSelect: () => setPaperTone(tone.value),
          }))}
        />

        <ToolbarDivider />

        <ToolbarButton
          icon={AlignLeft}
          label="Left"
          active={textAlign === "left"}
          onClick={() => setTextAlign("left")}
        />
        <ToolbarButton
          icon={AlignCenter}
          label="Center"
          active={textAlign === "center"}
          onClick={() => setTextAlign("center")}
        />
        <ToolbarButton
          icon={AlignRight}
          label="Right"
          active={textAlign === "right"}
          onClick={() => setTextAlign("right")}
        />

        <ToolbarDivider />

        <ToolbarButton
          icon={List}
          label="Bullet List"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          icon={ListOrdered}
          label="Numbered List"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />

        <ToolbarDivider />

        <ToolbarButton
          icon={Link}
          label="링크"
          disabled={!onInsertLink}
          onClick={() => onInsertLink?.()}
        />
        <ToolbarButton
          icon={Image}
          label="이미지"
          disabled={!onInsertImage}
          onClick={() => onInsertImage?.()}
        />
      </div>
    </div>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  active,
  onClick,
  disabled,
}: {
  icon: typeof Bold;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-sm text-muted-foreground transition hover:text-foreground",
        active && "bg-primary/10 text-primary border-primary/20",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <Icon size={16} />
    </button>
  );
}

function ToolbarDivider() {
  return <div className="mx-1 h-8 w-px bg-border" aria-hidden="true" />;
}

function ToolbarDropdown({
  icon: Icon,
  label,
  ariaLabel,
  menuClassName,
  items,
}: {
  icon?: typeof Type;
  label?: string;
  ariaLabel?: string;
  menuClassName?: string;
  items: DropdownItem[];
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (
        triggerRef.current &&
        menuRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    const menuEl = menuRef.current;
    const triggerEl = triggerRef.current;
    if (!menuEl || !triggerEl) return;
    const triggerRect = triggerEl.getBoundingClientRect();
    const menuRect = menuEl.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    let left = triggerRect.left;
    if (left + menuRect.width > viewportWidth - 16) {
      left = viewportWidth - menuRect.width - 16;
    }
    if (left < 16) left = 16;
    menuEl.style.left = `${left}px`;
    menuEl.style.top = `${triggerRect.bottom + 8}px`;
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-9 items-center gap-1 rounded-full border border-transparent bg-white/70 px-3 text-xs font-medium text-muted-foreground shadow-sm transition hover:border-border hover:text-foreground"
      >
        {Icon && <Icon size={16} />}
        {label && <span>{label}</span>}
        <svg
          aria-hidden="true"
          className="h-3 w-3 text-muted-foreground"
          viewBox="0 0 12 8"
          fill="none"
        >
          <path
            d="M10.59.59 6 5.17 1.41.59 0 2l6 6 6-6L10.59.59Z"
            fill="currentColor"
          />
        </svg>
      </button>
      {open && (
        <div
          ref={menuRef}
          className={cn(
            "fixed z-30 min-w-[140px] rounded-lg border border-border bg-white p-1 shadow-xl",
            menuClassName
          )}
        >
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                item.onSelect();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-foreground hover:bg-accent"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
