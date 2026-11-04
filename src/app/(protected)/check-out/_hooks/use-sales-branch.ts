import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { branchApi } from "@/lib/api/branch";
import { getCachedUser } from "@/lib/auth";
import { useAuthStore } from "@/store/auth-store";
import type { Branch } from "@/types/branch";

/**
 * Chi nhánh mà switcher sidebar (hoặc chi nhánh gán cho tài khoản) ghim đơn bán vào. Rỗng khi xem toàn chuỗi
 * hoặc kho: người bán tự chọn nơi bán.
 */
function lockedBranchId(): string {
  const user = getCachedUser() as { branchId?: string } | null;
  if (user?.branchId) return user.branchId;
  if (typeof window !== "undefined") {
    const id = localStorage.getItem("activeSwitcherItemId");
    if (id && localStorage.getItem("activeSwitcherItemType") === "branch" && id !== "all-branches") {
      return id;
    }
  }
  return "";
}

export interface SalesBranch {
  /** Chi nhánh ghi nhận đơn; "" cho tới khi người bán chọn. */
  branchId: string;
  /** True khi switcher hoặc tài khoản đã cố định chi nhánh: selector không được đổi. */
  locked: boolean;
  branches: Branch[];
  ready: boolean;
  setBranchId: (id: string) => void;
}

/** One "nơi bán" shared by both tabs of /check-out. */
export function useSalesBranch(): SalesBranch {
  const locationKey = useAuthStore((state) => state.locationKey);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [ready, setReady] = useState(false);
  const [picked, setPicked] = useState("");
  // `locationKey` chỉ là tín hiệu switcher đã đổi; giá trị thật được đọc từ storage.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const locked = useMemo(() => lockedBranchId(), [locationKey]);

  useEffect(() => {
    let stale = false;
    branchApi
      .getList({ limit: 100 })
      .then((res) => {
        if (!stale) setBranches(res.data || []);
      })
      .catch(() => toast.error("Không tải được danh sách chi nhánh"))
      .finally(() => {
        if (!stale) setReady(true);
      });
    return () => {
      stale = true;
    };
  }, []);

  // Chi nhánh đã ghim không đổi được từ đây.
  const setBranchId = useCallback(
    (id: string) => {
      if (!locked) setPicked(id);
    },
    [locked],
  );

  const branchId = locked || picked || (branches.length === 1 ? branches[0].id : "");
  return {
    branchId,
    locked: Boolean(locked),
    branches,
    ready,
    setBranchId,
  };
}
