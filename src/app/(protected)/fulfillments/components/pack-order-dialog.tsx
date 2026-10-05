"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { orderJourneyApi } from "@/lib/api/order-journey";
import {
  getApiErrorBody,
  messageForCode,
  shortStockLinesOf,
  type ShortStockLine,
} from "@/lib/api/error-codes";
import type { PackableOrder } from "@/types/order-flow";

/** Mã lỗi nghĩa là "đơn đã bị người khác đóng / đổi trạng thái" - danh sách đang cũ, phải tải lại. */
const STALE_ORDER_CODES = new Set(["ORDER_STATUS_CONFLICT", "ORDER_STATUS_TRANSITION_INVALID"]);

interface PackOrderDialogProps {
  /** Đơn đang mở; `null` = dialog đóng. */
  order: PackableOrder | null;
  onClose: () => void;
  /** Danh sách đã cũ: đóng gói xong, hoặc đơn vừa đổi trạng thái ở nơi khác. */
  onNeedsReload: () => void;
}

/**
 * Dialog xác nhận đã đóng gói một đơn: xem các dòng hàng, ghi chú, gọi `POST /orders/:id/pack`.
 * Trang cha đặt `key={order.id}` nên mỗi đơn mở ra là một dialog mới, ghi chú / lỗi cũ không còn.
 */
export function PackOrderDialog({ order, onClose, onNeedsReload }: PackOrderDialogProps) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [shortLines, setShortLines] = useState<ShortStockLine[]>([]);

  const submit = () => {
    // Khoá nút trong lúc gọi: bấm đúp không gửi hai request.
    if (!order || submitting) return;
    setSubmitting(true);
    setShortLines([]);
    orderJourneyApi
      .pack(order.id, note.trim() || undefined)
      .then((result) => {
        toast.success(`Đã đóng gói đơn ${order.code} - ${result.packages.length} kiện`);
        onNeedsReload();
      })
      .catch((error: unknown) => {
        // Thiếu hàng: giữ dialog mở, liệt kê từng mặt hàng thiếu để người đóng gói đọc.
        const lines = shortStockLinesOf(error);
        if (lines.length > 0) {
          setShortLines(lines);
          return;
        }
        const code = getApiErrorBody(error)?.code;
        toast.error(messageForCode(code) ?? "Đóng gói thất bại, vui lòng thử lại");
        // Người khác vừa đóng (hoặc đơn đã đổi trạng thái): đóng dialog và tải lại danh sách.
        if (code && STALE_ORDER_CODES.has(code)) onNeedsReload();
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <Dialog open={order !== null} onOpenChange={(open) => !open && !submitting && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Đóng gói đơn {order?.code}</DialogTitle>
          <DialogDescription>
            {order?.customer.name} · {order?.branch.name}. Xác nhận sẽ khoá hàng trên kệ cho đơn này.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border">
          <ul className="divide-y text-sm">
            {order?.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 px-3 py-2">
                <span>
                  {item.productName ?? "(không tên)"}
                  {item.sku && <span className="text-muted-foreground"> · {item.sku}</span>}
                </span>
                <span className="font-medium">× {item.quantity}</span>
              </li>
            ))}
          </ul>
        </div>

        {shortLines.length > 0 && (
          <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
            <p className="font-medium">Hàng trên kệ không đủ để đóng gói:</p>
            <ul className="mt-1 list-disc pl-5">
              {shortLines.map((line) => (
                <li key={line.label}>
                  {line.label}: cần {line.needed}, trên kệ còn {line.onShelf}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={500}
          placeholder="Ghi chú khi đóng gói (vd. thùng 2 móp góc, đã chèn thêm xốp)"
        />

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Đang xử lý..." : "Xác nhận đã đóng gói"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
