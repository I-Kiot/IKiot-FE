import { create } from "zustand";
import { type User, getCachedUser, setCachedUser } from "@/lib/auth";
import { getMe, logout as apiLogout } from "@/lib/api/auth";
import { disablePushNotifications } from "@/lib/fcm";
import { useNotificationInboxStore } from "@/store/notification-inbox-store";


function getInitialLocationKey(user: User | null): string {
  if (!user) return "all";
  if (user.role === "TENANT_OWNER") {
    if (typeof window !== "undefined") {
      return localStorage.getItem("activeLocationKey") || "all";
    }
    return "all";
  } else {
    if (user.branchId) {
      return `branch-${user.branchId}`;
    } else if (user.warehouseId) {
      return `warehouse-${user.warehouseId}`;
    }
    return "all";
  }
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  locationKey: string;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setLocationKey: (key: string) => void;
  fetchMe: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: getCachedUser(),
  isLoading: false,
  error: null,
  locationKey: getInitialLocationKey(getCachedUser()),

  setUser: (user) => {
    set({ user });
    if (user) {
      setCachedUser(user);
      set({ locationKey: getInitialLocationKey(user) });
    } else {
      set({ locationKey: "all" });
    }
  },

  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),

  setLocationKey: (key: string) => {
    set({ locationKey: key });
    if (typeof window !== "undefined") {
      localStorage.setItem("activeLocationKey", key);
    }
  },

  fetchMe: async () => {
    set({ isLoading: true, error: null });
    try {
      // `getMe` answers `undefined` for an empty body rather than throwing, and the
      // store models "signed out" as null.
      const userData = (await getMe()) ?? null;
      set({ 
        user: userData, 
        isLoading: false,
        locationKey: getInitialLocationKey(userData)
      });
      // Nothing to cache when the profile came back empty - writing null would only
      // overwrite a good cached user with a blank one.
      if (userData) setCachedUser(userData);
    } catch (err: any) {
      console.error("Failed to fetch current user profile:", err);
      const errMsg = err?.response?.data?.message || err?.message || "Failed to load user profile";
      set({ error: errMsg, isLoading: false });
      // If unauthorized, could clear tokens but let Axios interceptor handle 401 redirect
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      try {
        await disablePushNotifications();
      } catch (fcmErr) {
        console.error("Failed to disable push notifications on logout:", fcmErr);
      }
      try {
        useNotificationInboxStore.getState().reset();
      } catch (storeErr) {
        console.error("Failed to reset notification inbox store:", storeErr);
      }

      await apiLogout();
      set({ user: null, isLoading: false, locationKey: "all" });
      if (typeof window !== "undefined") {
        localStorage.removeItem("activeLocationKey");
      }
    } catch (err: any) {
      console.error("Logout error:", err);
      set({ isLoading: false });
    }
  },
}));

