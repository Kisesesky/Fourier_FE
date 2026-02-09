"use client";

import { useState, type ReactNode } from "react";
import * as Popover from "@radix-ui/react-popover";
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
  ZoomIn,
  ZoomOut,
  Strikethrough,
  Type,
  Undo2,
  Redo2,
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
  editor: any;
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
  onUploadImage?: () => void;
  canResizeImage?: boolean;
  onIncreaseImageSize?: () => void;
  onDecreaseImageSize?: () => void;
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
  onUploadImage,
  canResizeImage,
  onIncreaseImageSize,
  onDecreaseImageSize,
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
              onSelect: () => editor.chain().focus().clearNodes().run(),
            },
            {
              key: "h1",
              label: "Heading 1",
              onSelect: () =>
                editor.chain().focus().setNode("heading", { level: 1 }).run(),
            },
            {
              key: "h2",
              label: "Heading 2",
              onSelect: () =>
                editor.chain().focus().setNode("heading", { level: 2 }).run(),
            },
            {
              key: "h3",
              label: "Heading 3",
              onSelect: () =>
                editor.chain().focus().setNode("heading", { level: 3 }).run(),
            },
          ]}
        />

        <ToolbarDivider />
        <ToolbarButton
          icon={Undo2}
          label="Undo"
          onClick={() => editor.chain().focus().undo().run()}
        />
        <ToolbarButton
          icon={Redo2}
          label="Redo"
          onClick={() => editor.chain().focus().redo().run()}
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
          label="이미지 업로드"
          disabled={!onUploadImage}
          onClick={() => onUploadImage?.()}
        />
        <ToolbarButton
          icon={ZoomOut}
          label="이미지 축소"
          disabled={!canResizeImage || !onDecreaseImageSize}
          onClick={() => onDecreaseImageSize?.()}
        />
        <ToolbarButton
          icon={ZoomIn}
          label="이미지 확대"
          disabled={!canResizeImage || !onIncreaseImageSize}
          onClick={() => onIncreaseImageSize?.()}
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

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className={cn(
            "flex h-9 items-center gap-1 rounded-full border bg-white/70 px-3 text-xs font-medium text-muted-foreground shadow-sm transition hover:border-border hover:text-foreground",
            open ? "border-border text-foreground" : "border-transparent"
          )}
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
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={8}
          className={cn(
            "z-40 min-w-[140px] rounded-lg border border-border bg-white p-1 shadow-xl",
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
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
