import type { Notification } from "@/schema/notification";
import { getStoredToken, request } from "@/end-points/http";

export const notifications = {
  async list(): Promise<Notification[]> {
    return request<Notification[]>("/notifications", {
      method: "GET",
      token: getStoredToken(),
    });
  },

  async unreadCount(): Promise<{ count: number }> {
    return request<{ count: number }>("/notifications/unread-count", {
      method: "GET",
      token: getStoredToken(),
    });
  },

  async markRead(id: number): Promise<Notification> {
    return request<Notification>(`/notifications/${id}/read`, {
      method: "PATCH",
      token: getStoredToken(),
    });
  },

  async markAllRead(): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>("/notifications/read-all", {
      method: "PATCH",
      token: getStoredToken(),
    });
  },
};
