// app/(workspace)/workspace/[teamId]/_model/constants/workspace-settings.constants.ts
import { Bell, CircleUserRound, Settings2, Users } from "lucide-react";

export const WORKSPACE_SETTINGS_KEY = "workspace:settings:notifications";

export const WORKSPACE_SETTINGS_TABS = [
  { id: "Workspace", label: "Workspace", icon: Settings2, description: "현재 워크스페이스 컨텍스트와 빠른 액션" },
  { id: "Members", label: "Members", icon: Users, description: "멤버 관리 화면 이동" },
  { id: "Notifications", label: "Notifications", icon: Bell, description: "알림 옵션 제어" },
  { id: "My Account", label: "My Account", icon: CircleUserRound, description: "내 계정 및 보안 정보" },
] as const;
