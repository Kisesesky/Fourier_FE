// app/(workspace)/workspace/[teamId]/[projectId]/chat/_model/store/useChatViewUiStore.ts

import { create } from "zustand";
import type { SetStateAction } from "react";
import type { Msg, ViewMode } from "@/workspace/chat/_model/types";

type MenuState = { open: boolean; x: number; y: number; msg?: Msg; mine?: boolean };

type ChatViewUiState = {
  view: ViewMode;
  rightOpen: boolean;
  cmdOpen: boolean;
  selectMode: boolean;
  selectedIds: Set<string>;
  menu: MenuState;
  pinOpen: boolean;
  savedOpen: boolean;
  inviteOpen: boolean;
  settingsOpen: boolean;
  replyTarget: Msg | null;
  setView: (value: SetStateAction<ViewMode>) => void;
  setRightOpen: (value: SetStateAction<boolean>) => void;
  setCmdOpen: (value: SetStateAction<boolean>) => void;
  setSelectMode: (value: SetStateAction<boolean>) => void;
  setSelectedIds: (value: SetStateAction<Set<string>>) => void;
  setMenu: (value: SetStateAction<MenuState>) => void;
  setPinOpen: (value: SetStateAction<boolean>) => void;
  setSavedOpen: (value: SetStateAction<boolean>) => void;
  setInviteOpen: (value: SetStateAction<boolean>) => void;
  setSettingsOpen: (value: SetStateAction<boolean>) => void;
  setReplyTarget: (value: SetStateAction<Msg | null>) => void;
  resetChatViewUiState: () => void;
};

const resolve = <T,>(next: SetStateAction<T>, prev: T): T =>
  typeof next === "function" ? (next as (value: T) => T)(prev) : next;

const initialState = {
  view: "cozy" as ViewMode,
  rightOpen: false,
  cmdOpen: false,
  selectMode: false,
  selectedIds: new Set<string>(),
  menu: { open: false, x: 0, y: 0 } as MenuState,
  pinOpen: false,
  savedOpen: false,
  inviteOpen: false,
  settingsOpen: false,
  replyTarget: null as Msg | null,
};

export const useChatViewUiStore = create<ChatViewUiState>((set) => ({
  ...initialState,
  setView: (value) => set((state) => ({ view: resolve(value, state.view) })),
  setRightOpen: (value) => set((state) => ({ rightOpen: resolve(value, state.rightOpen) })),
  setCmdOpen: (value) => set((state) => ({ cmdOpen: resolve(value, state.cmdOpen) })),
  setSelectMode: (value) => set((state) => ({ selectMode: resolve(value, state.selectMode) })),
  setSelectedIds: (value) => set((state) => ({ selectedIds: resolve(value, state.selectedIds) })),
  setMenu: (value) => set((state) => ({ menu: resolve(value, state.menu) })),
  setPinOpen: (value) => set((state) => ({ pinOpen: resolve(value, state.pinOpen) })),
  setSavedOpen: (value) => set((state) => ({ savedOpen: resolve(value, state.savedOpen) })),
  setInviteOpen: (value) => set((state) => ({ inviteOpen: resolve(value, state.inviteOpen) })),
  setSettingsOpen: (value) => set((state) => ({ settingsOpen: resolve(value, state.settingsOpen) })),
  setReplyTarget: (value) => set((state) => ({ replyTarget: resolve(value, state.replyTarget) })),
  resetChatViewUiState: () => set(initialState),
}));

