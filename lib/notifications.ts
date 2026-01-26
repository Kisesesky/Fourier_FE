// src/lib/notifications.ts
import api from "./api";

export type NotificationItem = {
  id: string;
  type: string;
  read: boolean;
  createdAt: string;
  payload: Record<string, any>;
};

export async function fetchNotifications(): Promise<NotificationItem[]> {
  const res = await api.get("/notifications");
  return res.data ?? [];
}

export async function markNotificationRead(id: string) {
  const res = await api.patch(`/notifications/${id}/read`);
  return res.data;
}

export async function markAllNotificationsRead() {
  const res = await api.patch("/notifications/read-all");
  return res.data;
}
