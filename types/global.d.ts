// types/global.d.ts
declare module '@tiptap/extension-placeholder';
declare module '@tiptap/extension-task-list';
declare module '@tiptap/extension-task-item';
declare module '@tiptap/extension-code-block-lowlight';
declare module '@tiptap/extension-image';
declare module '@tiptap/extension-table';
declare module '@tiptap/extension-table-row';
declare module '@tiptap/extension-table-cell';
declare module '@tiptap/extension-table-header';
declare module 'lucide-react';

export {};

declare global {
  interface Window {
    __FLOW_USERS__?: { id: string; name: string }[];
  }
}
