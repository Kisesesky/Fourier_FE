// app/(workspace)/workspace/[teamId]/[projectId]/chat/_model/chat-store/actions.user.ts
import type { PresenceState } from '../types';
import { lsSet } from '@/lib/persist';
import { STATUS_KEY } from './constants';

type UserDeps = {
  set: (partial: Record<string, unknown>) => void;
  get: () => {
    userStatus: Record<string, PresenceState>;
    users: Record<string, { id: string; name: string }>;
  };
};

export const createUserActions = ({ set, get }: UserDeps) => ({
  setUserStatus: (userId: string, status: PresenceState) => {
    const next = { ...get().userStatus, [userId]: status };
    set({ userStatus: next });
    lsSet(STATUS_KEY, next);
  },
  addUser: (name: string, status: PresenceState = 'offline') => {
    const trimmed = name.trim();
    const base = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const idRoot = base || `mem-${Date.now()}`;
    let candidate = idRoot;
    let counter = 1;
    const currentUsers = get().users;
    while (currentUsers[candidate]) {
      candidate = `${idRoot}-${counter++}`;
    }
    const label = trimmed || candidate;
    const users = { ...currentUsers, [candidate]: { id: candidate, name: label } };
    const statusMap = { ...get().userStatus, [candidate]: status };
    set({ users, userStatus: statusMap });
    lsSet(STATUS_KEY, statusMap);
    return candidate;
  },
});
