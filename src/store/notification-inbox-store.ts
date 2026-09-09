import { create } from "zustand";
import { notificationApi, type AppNotification } from "@/lib/api/notification";

interface NotificationInboxState {
  items: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  fetchInbox: () => Promise<void>;
  /** Gọi khi socket bắn event "notification" */
  receive: (notification: AppNotification) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteOne: (id: string) => Promise<void>;
  deleteAll: () => Promise<void>;
  reset: () => void;
}

export const useNotificationInboxStore = create<NotificationInboxState>((set, get) => ({
  items: [],
  unreadCount: 0,
  isLoading: false,

  fetchInbox: async () => {
    set({ isLoading: true });
    try {
      // BE trả sẵn unreadCount - dùng luôn, đừng đếm lại ở client
      const res = await notificationApi.getInbox({ page: 1, limit: 20 });
      set({ items: res.data, unreadCount: res.unreadCount });
    } catch {
      // Thông báo là kênh phụ: lỗi thì im lặng, không chặn UI
    } finally {
      set({ isLoading: false });
    }
  },

  receive: (notification) =>
    set((state) => {
      // Socket có thể bắn trùng khi reconnect - chặn duplicate theo id
      if (state.items.some((item) => item.id === notification.id)) return state;
      return {
        items: [notification, ...state.items],
        unreadCount: state.unreadCount + 1,
      };
    }),

  markAsRead: async (id) => {
    const target = get().items.find((item) => item.id === id);
    if (!target || target.isRead) return;

    // Optimistic update, đúng pattern các mutation hook khác trong repo
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, isRead: true } : item,
      ),
      unreadCount: Math.max(state.unreadCount - 1, 0),
    }));

    try {
      await notificationApi.markAsRead(id);
    } catch {
      get().fetchInbox(); // rollback bằng cách lấy lại sự thật từ server
    }
  },

  markAllAsRead: async () => {
    set((state) => ({
      items: state.items.map((item) => ({ ...item, isRead: true })),
      unreadCount: 0,
    }));
    try {
      await notificationApi.markAllAsRead();
    } catch {
      get().fetchInbox();
    }
  },

  deleteOne: async (id) => {
    const target = get().items.find((item) => item.id === id);
    const wasUnread = target && !target.isRead;
    // Optimistic remove
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
      unreadCount: wasUnread ? Math.max(state.unreadCount - 1, 0) : state.unreadCount,
    }));
    try {
      await notificationApi.deleteOne(id);
    } catch {
      get().fetchInbox(); // rollback
    }
  },

  deleteAll: async () => {
    set({ items: [], unreadCount: 0 });
    try {
      await notificationApi.deleteAll();
    } catch {
      get().fetchInbox();
    }
  },

  reset: () => set({ items: [], unreadCount: 0 }),
}));
