"use client";

// Trang chỉ tải dữ liệu, giữ state và mở dialog; bảng và phân trang ở components/fulfillments-*.tsx.

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { allows } from "@/components/sidebar/constants/role-permissions";
import { getCachedUser } from "@/lib/auth";
import { orderJourneyApi, PACK_PAGE_SIZE } from "@/lib/api/order-journey";
import type { PackableOrder } from "@/types/order-flow";
import { useLiveTick } from "@/hooks/use-live-refresh";
import { CHANGE_RESOURCES } from "@/types/change-feed";
import { FulfillmentsTable, type PackListQuery, type PackListState } from "./components/fulfillments-table";
import { PackOrderDialog } from "./components/pack-order-dialog";

const LIVE_RESOURCES = [CHANGE_RESOURCES.ORDERS] as const;

/** Màn Đóng hàng (C-6): đơn CONFIRMED chờ đóng gói; bấm "Đóng hàng" để khoá hàng và chuyển đơn sang PACKED. */
export default function FulfillmentsPage() {
  // Một state cho cả tình trạng lẫn dữ liệu để mỗi nhánh của `.then()` chỉ gọi một setter
  // (lint cấm setState trong useEffect).
  const [listState, setListState] = useState<PackListState>({ status: "loading" });
  const [query, setQuery] = useState<PackListQuery>({ page: 1, limit: PACK_PAGE_SIZE });
  const [reloadKey, setReloadKey] = useState(0);
  const [selected, setSelected] = useState<PackableOrder | null>(null);
  const canPack = allows(getCachedUser()?.role, "orders", "pack");
  // Người khác vừa đóng / đổi đơn: tải lại nền (KHÔNG gọi `reload`, nó `setSelected(null)` và sẽ đóng hộp thoại đang mở).
  const visibleIds = listState.status === "ready" ? listState.result.data.map((order) => order.id) : [];
  const liveTick = useLiveTick({ resources: LIVE_RESOURCES, visibleIds });
  const lastLoadRef = useRef<{ query: PackListQuery; reloadKey: number } | null>(null);

  useEffect(() => {
    // Cùng query và reloadKey với lần trước = lần tải nền do sự kiện: giữ danh sách đang hiện, lỗi thì im lặng.
    const last = lastLoadRef.current;
    const silent = last?.query === query && last.reloadKey === reloadKey;
    lastLoadRef.current = { query, reloadKey };
    // Chuyển trang / đổi số đơn liên tiếp: response cũ về sau thì bỏ, không đè lên trang đang xem.
    let cancelled = false;
    orderJourneyApi.listPackable(query.page, query.limit).then(
      (res) => {
        if (cancelled) return;
        // Trang hiện tại rỗng mà không phải trang 1 (vd. vừa đóng đơn cuối của trang cuối)
        // → lùi về trang cuối còn đơn; effect tự chạy lại.
        if (res.data.length === 0 && query.page > 1) {
          setQuery({ page: Math.max(1, res.pagination.totalPages), limit: query.limit });
        } else {
          setListState({ status: "ready", result: res });
        }
      },
      () => {
        if (cancelled || silent) return;
        toast.error("Không tải được danh sách đơn chờ đóng gói");
        setListState({ status: "error" });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [query, reloadKey, liveTick]);

  // Danh sách trên màn hình chỉ là ảnh chụp lúc tải - sau mỗi lần đóng (thành công hay bị người khác
  // đóng trước) đều tải lại. Đúng/sai do BE quyết định (nhận đơn theo status, khoá hàng có điều kiện).
  const reload = () => {
    setSelected(null);
    setReloadKey((key) => key + 1);
  };

  // Ổn định để cột của bảng không phải dựng lại mỗi lần render.
  const openPack = useCallback((order: PackableOrder) => setSelected(order), []);

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[{ label: "Trang chủ", href: "/dashboard" }, { label: "Vận hành" }, { label: "Đóng hàng" }]}
        title="Đóng hàng"
        description="Đơn đã xác nhận, chờ đóng gói. Đóng gói sẽ khoá hàng trên kệ cho đơn."
        actions={
          <Button variant="outline" onClick={reload} disabled={listState.status === "loading"}>
            Tải lại
          </Button>
        }
      />

      <FulfillmentsTable
        state={listState}
        query={query}
        onQueryChange={setQuery}
        canPack={canPack}
        onPack={openPack}
      />

      <PackOrderDialog
        key={selected?.id ?? "none"}
        order={selected}
        onClose={() => setSelected(null)}
        onNeedsReload={reload}
      />
    </div>
  );
}
