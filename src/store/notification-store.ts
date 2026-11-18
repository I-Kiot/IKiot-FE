import { create } from "zustand";
import {
  deleteAllSystemNotifications,
  deleteSystemNotification,
  listSystemNotifications,
  markAllSystemNotificationsAsRead,
  markSystemNotificationAsRead,
  type SystemNotification,
} from "@/lib/api/notification";
import { listAllTickets } from "@/lib/api/ticket";

const unreadOf = (items: SystemNotification[]) => items.filter((n) => !n.isRead).length;

/** Thông báo hệ thống của ADMIN (chuông trên header). Socket `system-notification` đẩy thêm qua `prepend`. */
interface NotificationState {
  items: SystemNotification[];
  unreadCount: number;
  fetchSystemNotifications: () => Promise<void>;
  prepend: (notification: SystemNotification) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteOne: (id: string) => Promise<void>;
  deleteAll: () => Promise<void>;

  openTicketsCount: number;
  setOpenTicketsCount: (count: number) => void;
  fetchOpenTicketsCount: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  unreadCount: 0,
  fetchSystemNotifications: async () => {
    try {
      const items = (await listSystemNotifications()) || [];
      set({ items, unreadCount: unreadOf(items) });
    } catch (err) {
      console.error("Failed to fetch system notifications:", err);
    }
  },
  prepend: (notification) =>
    set((state) => {
      if (state.items.some((n) => n.id === notification.id)) return state;
      const items = [notification, ...state.items];
      return { items, unreadCount: unreadOf(items) };
    }),
  // Cập nhật UI trước, gọi API sau; lỗi thì tải lại danh sách từ server.
  markAsRead: async (id) => {
    set((state) => {
      const items = state.items.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      return { items, unreadCount: unreadOf(items) };
    });
    try {
      await markSystemNotificationAsRead(id);
    } catch {
      await get().fetchSystemNotifications();
    }
  },
  markAllAsRead: async () => {
    set((state) => ({ items: state.items.map((n) => ({ ...n, isRead: true })), unreadCount: 0 }));
    try {
      await markAllSystemNotificationsAsRead();
    } catch {
      await get().fetchSystemNotifications();
    }
  },
  deleteOne: async (id) => {
    set((state) => {
      const items = state.items.filter((n) => n.id !== id);
      return { items, unreadCount: unreadOf(items) };
    });
    try {
      await deleteSystemNotification(id);
    } catch {
      await get().fetchSystemNotifications();
    }
  },
  deleteAll: async () => {
    set({ items: [], unreadCount: 0 });
    try {
      await deleteAllSystemNotifications();
    } catch {
      await get().fetchSystemNotifications();
    }
  },

  openTicketsCount: 0,
  setOpenTicketsCount: (count) => set({ openTicketsCount: count }),
  fetchOpenTicketsCount: async () => {
    try {
      const res = await listAllTickets();
      const openCount = (res.data || []).filter((t) => t.status === "OPEN").length;
      set({ openTicketsCount: openCount });
    } catch (err) {
      console.error("Failed to fetch open tickets count:", err);
    }
  },
}));
