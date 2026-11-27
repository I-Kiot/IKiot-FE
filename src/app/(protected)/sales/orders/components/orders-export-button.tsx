"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PermissionButton } from "@/components/permission-button";
import { orderJourneyApi } from "@/lib/api/order-journey";
import { messageForCode } from "@/lib/api/error-codes";
import { blobErrorCode, saveBlob } from "@/lib/download-file";
import { useOrders } from "./orders-provider";

/** Xuất đơn ra Excel theo khuôn file mẫu nhập: đơn đang tích, không tích thì mọi đơn khớp bộ lọc. */
export function OrdersExportButton({ allowed }: { allowed: boolean }) {
  const { params, selectedOrders, total } = useOrders();
  const [exporting, setExporting] = useState(false);
  const count = selectedOrders.length;

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await orderJourneyApi.exportFile(
        params,
        selectedOrders.map((order) => order.id),
      );
      saveBlob(blob, `don-hang-${new Date().toLocaleDateString("sv-SE")}.xlsx`);
      toast.success(count > 0 ? `Đã xuất ${count} đơn` : `Đã xuất ${total} đơn theo bộ lọc`);
    } catch (error) {
      toast.error(messageForCode(await blobErrorCode(error)) ?? "Xuất file đơn hàng thất bại");
    } finally {
      setExporting(false);
    }
  }

  return (
    <PermissionButton
      allowed={allowed}
      permission="orders:read"
      variant="outline"
      disabled={exporting}
      onClick={handleExport}
      title="Cùng cột với file mẫu nhập đơn: sửa xong có thể nhập lại"
    >
      {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
      {count > 0 ? `Xuất ${count} đơn` : "Xuất file"}
    </PermissionButton>
  );
}
