// app/(workspace)/workspace/[teamId]/_model/types/workspace-settings.types.ts
import type { WORKSPACE_SETTINGS_TABS } from "../constants/workspace-settings.constants";

export type WorkspaceSettingsSection = (typeof WORKSPACE_SETTINGS_TABS)[number]["id"];

export type WorkspaceNotificationSettings = {
  mentions: boolean;
  dm: boolean;
  customerCenterReply: boolean;
  emailDigest: boolean;
};

export type PasswordFormState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type PasswordVisibleState = {
  current: boolean;
  next: boolean;
  confirm: boolean;
};
