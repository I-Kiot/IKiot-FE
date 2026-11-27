"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { copyRows } from "@/lib/clipboard-table";
import { orderJourneyApi } from "@/lib/api/order-journey";
import { useOrders } from "./orders-provider";

/** Chép các đơn đang tích theo cột file mẫu nhập đơn: mỗi dòng hàng một dòng, dán thẳng vào file mẫu. */
export function OrdersCopyButton() {
  const { selectedOrders } = useOrders();
  const [copying, setCopying] = useState(false);
  if (selectedOrders.length === 0) return null;

  async function copySelected() {
    // Tạo Promise ngay trong lần click: ClipboardItem phải được tạo trong chính sự kiện người dùng.
    const rows = orderJourneyApi.exportRows(selectedOrders.map((order) => order.id));
    setCopying(true);
    try {
      if (await copyRows(rows)) {
        toast.success(
          `Đã sao chép ${(await rows).length} dòng của ${selectedOrders.length} đơn theo mẫu nhập file`,
        );
      } else {
        toast.error('Trình duyệt chặn sao chép. Hãy thử lại hoặc dùng "Xuất file".');
      }
    } catch {
      toast.error("Không tải được dữ liệu đơn để sao chép");
    } finally {
      setCopying(false);
    }
  }

  return (
    <Button
      variant="outline"
      className="cursor-pointer"
      disabled={copying}
      onClick={copySelected}
      title="Mỗi dòng hàng một dòng, theo cột của file mẫu nhập đơn hàng"
    >
      <Copy className="size-4" />
      Sao chép {selectedOrders.length} đơn
    </Button>
  );
}
