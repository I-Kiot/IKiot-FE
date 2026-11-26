"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { copyRows } from "@/lib/clipboard-table";
import { orderCopyRow } from "../shared/orders-copy";
import { useOrders } from "./orders-provider";

/** Cạnh nút "Tạo đơn": chép các đơn đang tích, mỗi đơn một dòng, chỉ giá trị - dán vào bảng Excel có sẵn cột. */
export function OrdersCopyButton() {
  const { selectedOrders } = useOrders();
  if (selectedOrders.length === 0) return null;

  async function copySelected() {
    if (await copyRows(selectedOrders.map(orderCopyRow))) {
      toast.success(`Đã sao chép ${selectedOrders.length} đơn`);
    } else {
      toast.error("Trình duyệt chặn sao chép. Hãy thử lại.");
    }
  }

  return (
    <Button
      variant="outline"
      className="cursor-pointer"
      onClick={copySelected}
      title="Mỗi đơn một dòng, dán vào Excel / Google Sheets"
    >
      <Copy className="size-4" />
      Sao chép {selectedOrders.length} đơn
    </Button>
  );
}
