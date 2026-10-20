import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { branchApi } from "@/lib/api/branch";
import { getCachedUser } from "@/lib/auth";
import { useAuthStore } from "@/store/auth-store";
import type { Branch } from "@/types/branch";

/**
 * The branch the sidebar switcher (or the account's own posting) pins the sale to, or "" when the
 * view is the whole chain / a warehouse - in which case the seller picks where the sale happens.
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
  /** The branch the sale is booked to; "" until one is picked. */
  branchId: string;
  /** True when the switcher/posting fixed the branch - the selector must not let it change. */
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
  // `locationKey` is the signal that the switcher moved; the value itself is read from storage.
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

  // A pinned branch is never changed from here.
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
