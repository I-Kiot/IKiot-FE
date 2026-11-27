"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { SalesBranch, SalesPlace } from "@/app/(protected)/check-out/_hooks/use-sales-branch";
import { orderJourneyApi } from "@/lib/api/order-journey";
import { getCachedUser } from "@/lib/auth";
import { useAuthStore } from "@/store/auth-store";

/** Nơi tài khoản hoặc switcher sidebar đang ghim vào, chi nhánh hay kho. Rỗng khi xem toàn chuỗi. */
function pinnedPlaceId(): string {
  const user = getCachedUser() as { branchId?: string | null; warehouseId?: string | null } | null;
  const posting = user?.branchId ?? user?.warehouseId;
  if (posting) return posting;
  if (typeof window === "undefined") return "";
  const id = localStorage.getItem("activeSwitcherItemId");
  return id && !id.startsWith("all-") ? id : "";
}

/** Nơi bán của màn tạo đơn. */
export function useOrderSalesPlace(): SalesBranch {
  const locationKey = useAuthStore((state) => state.locationKey);
  const [places, setPlaces] = useState<SalesPlace[]>([]);
  const [ready, setReady] = useState(false);
  const [picked, setPicked] = useState("");
  // `locationKey` chỉ là tín hiệu switcher đã đổi; giá trị thật được đọc từ storage.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pinned = useMemo(() => pinnedPlaceId(), [locationKey]);
  const locked = places.some((place) => place.id === pinned) ? pinned : "";

  useEffect(() => {
    let stale = false;
    orderJourneyApi
      .sourceLocations()
      .then((locations) => {
        if (!stale) setPlaces(locations);
      })
      .catch(() => toast.error("Không tải được danh sách nơi bán"))
      .finally(() => {
        if (!stale) setReady(true);
      });
    return () => {
      stale = true;
    };
  }, []);

  const setBranchId = useCallback(
    (id: string) => {
      if (!locked) setPicked(id);
    },
    [locked],
  );

  return {
    branchId: locked || picked || (places.length === 1 ? places[0].id : ""),
    locked: Boolean(locked),
    branches: places,
    ready,
    setBranchId,
  };
}
