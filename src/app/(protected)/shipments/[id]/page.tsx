"use client";

// Đích của đường dẫn trong thông báo giao hàng (`/shipments/<id>`, do BE ghi vào thông báo). Không có màn
// riêng cho một lần giao: trang này tra lần giao rồi chuyển tới màn đang chứa nó và mở sẵn drawer.
//   - Mình là shipper của lần giao: còn cần giao → "Đang giao"; đã kết thúc → "Lịch sử giao".
//   - Người khác (chủ shop, người phụ trách đơn): màn Giao hàng, tab theo dõi.
// Đường dẫn quyết định theo trạng thái lúc bấm, nên thông báo cũ của đơn đã giao xong tự dẫn vào lịch sử.

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { shipmentApi } from "@/lib/api/shipment";
import { getCachedUser } from "@/lib/auth";
import { isFinished } from "../components/shipment-ui";

export default function ShipmentRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    shipmentApi.getById(id).then(
      (shipment) => {
        if (cancelled) return;
        const mine = shipment.driver?.id !== undefined && shipment.driver.id === getCachedUser()?.id;
        const target = mine
          ? `/shipper?${isFinished(shipment.status) ? "tab=history&" : ""}open=${id}`
          : `/shipments?tab=shipments&open=${id}`;
        router.replace(target);
      },
      () => {
        if (!cancelled) setFailed(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  if (failed) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
        <p className="text-muted-foreground">Không tìm thấy lần giao này hoặc bạn không có quyền xem.</p>
        <Button asChild variant="outline">
          <Link href="/shipper">Về Đơn giao của tôi</Link>
        </Button>
      </div>
    );
  }
  return <p className="px-4 py-16 text-center text-muted-foreground">Đang mở lần giao...</p>;
}
