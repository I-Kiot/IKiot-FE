import client from "./client";

export interface NotificationAnnouncement {
  id: string;
  title: string;
  description: string;
  type: "ANNOUNCEMENT";
  category: "Maintenance" | "New feature" | "Promotion" | "Security";
  targetType: "ALL" | "SELECTION";
  targetTenants?: Array<{ id: string; name: string }>;
  createdBy?: { email: string; profile?: { firstName?: string; lastName?: string } };
  createdAt: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  description: string;
  type: "SYSTEM_TRANSACTION" | "SYSTEM_TENANT_CREATED" | "SYSTEM_TICKET_CREATED" | "SYSTEM_TENANT_BANK_UPDATED";
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ComposeAnnouncementPayload {
  title: string;
  description: string;
  category: "Maintenance" | "New feature" | "Promotion" | "Security";
  targetType: "ALL" | "SELECTION";
  targetTenants?: string[];
}

export async function composeAnnouncement(payload: ComposeAnnouncementPayload): Promise<{ success: boolean; data: NotificationAnnouncement }> {
  const response = await client.post("/admin/notifications", payload);
  return response.data;
}

export async function listAnnouncements(): Promise<NotificationAnnouncement[]> {
  const response = await client.get("/admin/notifications");
  return response.data.data;
}

export async function listSystemNotifications(): Promise<SystemNotification[]> {
  const response = await client.get("/admin/system-notifications");
  return response.data.data;
}

export async function markSystemNotificationAsRead(id: string): Promise<{ success: boolean; data: SystemNotification }> {
  const response = await client.patch(`/admin/system-notifications/${id}/read`);
  return response.data;
}

export async function markAllSystemNotificationsAsRead(): Promise<{ success: boolean }> {
  const response = await client.patch("/admin/system-notifications/mark-all-read");
  return response.data;
}

export async function deleteSystemNotification(id: string): Promise<{ success: boolean }> {
  const response = await client.delete(`/admin/system-notifications/${id}`);
  return response.data;
}

export async function deleteAllSystemNotifications(): Promise<{ success: boolean }> {
  const response = await client.delete("/admin/system-notifications");
  return response.data;
}

// ---- Hộp thư cấp tenant (khác hoàn toàn với /admin/* ở trên) ----

export type NotificationType =
  | "LEAVE_REQUEST_CREATED" | "LEAVE_REQUEST_APPROVED" | "LEAVE_REQUEST_REJECTED"
  | "LEAVE_REQUEST_CANCELLED" | "LEAVE_REQUEST_EXPIRED"
  | "STOCK_MOVEMENT_CREATED" | "STOCK_MOVEMENT_IN_TRANSIT"
  | "STOCK_MOVEMENT_RECEIVED" | "STOCK_MOVEMENT_CANCELLED"
  | "INVENTORY_LOW_STOCK" | "ORDER_PAID"
  | "SUBSCRIPTION_ACTIVATED" | "SUBSCRIPTION_EXPIRING" | "SUBSCRIPTION_EXPIRED"
  | "SCHEDULE_ASSIGNED" | "PAYSLIP_APPROVED" | "PAYSLIP_PAID"
  | "STAFF_ACCOUNT_CREATED" | "TICKET_REPLIED" | "SEPAY_LINKED";

/** Payload socket event "notification" chính là document này. */
export interface AppNotification {
  id: string;
  title: string;
  description: string;
  type: NotificationType;
  link?: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface InboxResponse {
  data: AppNotification[];
  unreadCount: number;
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export const notificationApi = {
  async getInbox(params: { page?: number; limit?: number } = {}): Promise<InboxResponse> {
    const response = await client.get("/notifications", { params });
    return response.data;
  },

  async getUnreadCount(): Promise<number> {
    const response = await client.get("/notifications/unread-count");
    return response.data.data;
  },

  async markAsRead(id: string): Promise<void> {
    await client.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await client.patch("/notifications/read-all");
  },

  async deleteOne(id: string): Promise<void> {
    await client.delete(`/notifications/${id}`);
  },

  async deleteAll(): Promise<void> {
    await client.delete("/notifications");
  },

  async registerDevice(token: string): Promise<void> {
    await client.post("/notifications/device-token", {
      token,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    });
  },

  async removeDevice(token: string): Promise<void> {
    // Axios: DELETE có body phải truyền qua `data`
    await client.delete("/notifications/device-token", { data: { token } });
  },
};

