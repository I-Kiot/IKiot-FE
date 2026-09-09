import { create } from "zustand";
import { listSystemNotifications } from "@/lib/api/notification";
import { listAllTickets } from "@/lib/api/ticket";

interface NotificationState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  decrementUnreadCount: () => void;
  incrementUnreadCount: () => void;
  fetchUnreadCount: () => Promise<void>;

  openTicketsCount: number;
  setOpenTicketsCount: (count: number) => void;
  fetchOpenTicketsCount: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  decrementUnreadCount: () => set((state) => ({ unreadCount: Math.max(state.unreadCount - 1, 0) })),
  incrementUnreadCount: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  fetchUnreadCount: async () => {
    try {
      const data = await listSystemNotifications();
      const unread = data.filter((n) => !n.isRead).length;
      set({ unreadCount: unread });
    } catch (err) {
      console.error("Failed to fetch unread notification count:", err);
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
