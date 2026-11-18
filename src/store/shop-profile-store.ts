import { create } from "zustand";
import { getMyTenant } from "@/lib/api/tenant";

/** Phần hồ sơ shop cần để in tên/logo ở sidebar và trên hoá đơn. */
export interface ShopProfile {
  name: string;
  logoUrl: string | null;
  address: string | null;
  phoneNumber: string | null;
}

interface ShopProfileState {
  profile: ShopProfile | null;
  /** Tenant đã tải, để đăng xuất rồi vào shop khác không hiện logo shop cũ. */
  loadedTenantId: string | null;
  /** Tải `GET /tenant/me` một lần cho mỗi tenant. ADMIN không có tenant nên không gọi. */
  load: (tenantId: string | null | undefined) => Promise<void>;
  /** Màn cài đặt gọi sau khi đổi/gỡ logo, để sidebar đổi ngay không cần tải lại trang. */
  setLogoUrl: (logoUrl: string | null) => void;
}

export const useShopProfileStore = create<ShopProfileState>((set, get) => ({
  profile: null,
  loadedTenantId: null,
  load: async (tenantId) => {
    if (!tenantId) {
      set({ profile: null, loadedTenantId: null });
      return;
    }
    if (get().loadedTenantId === tenantId) return;
    set({ loadedTenantId: tenantId, profile: null });
    try {
      const tenant = await getMyTenant();
      // Người dùng có thể đã đổi tài khoản trong lúc chờ.
      if (get().loadedTenantId !== tenantId) return;
      set({
        profile: {
          name: tenant.name,
          logoUrl: tenant.logoUrl ?? null,
          address: tenant.mainAddress ?? null,
          phoneNumber: tenant.phoneNumber ?? null,
        },
      });
    } catch {
      // Không có logo thì hiện icon mặc định; cho phép thử lại ở lần mount sau.
      if (get().loadedTenantId === tenantId) set({ loadedTenantId: null });
    }
  },
  setLogoUrl: (logoUrl) =>
    set((state) => (state.profile ? { profile: { ...state.profile, logoUrl } } : state)),
}));

/** Đọc ngoài React (hàm in hoá đơn). Sidebar đã tải hồ sơ khi vào app nên thường có sẵn. */
export const getShopProfile = () => useShopProfileStore.getState().profile;
