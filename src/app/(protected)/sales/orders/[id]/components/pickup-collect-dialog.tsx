"use client";

import * as React from "react";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorBody } from "@/lib/api/error-codes";
import { orderJourneyApi } from "@/lib/api/order-journey";
import type { OrderDetail, PickupCollectMethod, PickupQrPayment } from "@/types/order-flow";
import { formatVND } from "../../shared/order-display";

/** Cứ chừng này mili giây lại hỏi xem tiền QR đã về chưa. */
const POLL_MS = 5000;

type Props = {
  order: OrderDetail;
  onClose: () => void;
  /** Đã thu xong (tiền mặt, hoặc tiền QR đã về): trang đọc lại đơn. */
  onCollected: (order: OrderDetail) => void;
};

/**
 * Thu số còn lại của đơn khách tới lấy tại quầy (`POST /orders/:id/pickup/collect`). Số tiền do server tính.
 * Tiền mặt ghi luôn; QR hiện mã cho khách quét rồi chờ tiền về, khách không chuyển thì đổi sang tiền mặt.
 */
export function PickupCollectDialog({ order, onClose, onCollected }: Props) {
  const [method, setMethod] = React.useState<PickupCollectMethod>("CASH");
  const [note, setNote] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [qr, setQr] = React.useState<PickupQrPayment | null>(null);

  const collect = async (chosen: PickupCollectMethod) => {
    setSaving(true);
    try {
      const result = await orderJourneyApi.pickupCollect(order.id, {
        method: chosen,
        note: note.trim() || undefined,
      });
      if (result.payment) {
        setQr(result.payment);
        return;
      }
      toast.success("Đã thu tiền mặt");
      onCollected(result.order);
    } catch (error) {
      toast.error(getApiErrorBody(error)?.message ?? "Không thu được tiền, vui lòng thử lại");
    } finally {
      setSaving(false);
    }
  };

  // Có mã QR thì hỏi định kỳ: tiền về (webhook SePay) là đơn đã thu đủ.
  const check = React.useCallback(async () => {
    try {
      const fresh = await orderJourneyApi.getById(order.id);
      if (fresh.paymentStatus === "PAID") {
        toast.success("Đã nhận chuyển khoản");
        onCollected(fresh);
      }
    } catch {
      // Lần hỏi sau sẽ thử lại.
    }
  }, [order.id, onCollected]);

  React.useEffect(() => {
    if (!qr) return;
    const timer = window.setInterval(() => void check(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [qr, check]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thu tiền còn lại</DialogTitle>
          <DialogDescription>
            Đơn {order.code}: thu nốt phần còn lại trước khi giao hàng cho khách. Số tiền do hệ thống tính từ các khoản
            đã thu.
          </DialogDescription>
        </DialogHeader>

        {qr ? (
          <div className="space-y-3 rounded-md border p-3">
            <p className="text-sm font-medium">Khách quét mã để chuyển {formatVND(qr.amount)}</p>
            {/* eslint-disable-next-line @next/next/no-img-element -- ảnh VietQR từ dịch vụ ngoài */}
            <img src={qr.qrUrl} alt="Mã QR chuyển khoản" className="mx-auto w-60 max-w-full" />
            <p className="text-center text-xs text-muted-foreground">Nội dung chuyển khoản: {qr.reference}</p>
            <p className="text-center text-xs text-muted-foreground">Đang chờ tiền về, tự cập nhật khi có.</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" className="cursor-pointer" onClick={() => void check()}>
                Kiểm tra tiền về
              </Button>
              <Button
                variant="outline"
                className="cursor-pointer"
                disabled={saving}
                onClick={() => {
                  setQr(null);
                  void collect("CASH");
                }}
              >
                Khách không chuyển - thu tiền mặt
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            <RadioGroup value={method} onValueChange={(value) => setMethod(value as PickupCollectMethod)}>
              <Label className="flex cursor-pointer items-center gap-2 font-normal">
                <RadioGroupItem value="CASH" />
                Tiền mặt tại quầy
              </Label>
              <Label className="flex cursor-pointer items-center gap-2 font-normal">
                <RadioGroupItem value="BANK_TRANSFER_QR" />
                Chuyển khoản QR
              </Label>
            </RadioGroup>
            <div className="grid gap-2">
              <Label>Ghi chú (không bắt buộc)</Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500} />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="cursor-pointer">
            {qr ? "Đóng" : "Huỷ"}
          </Button>
          {!qr && (
            <Button onClick={() => void collect(method)} disabled={saving} className="cursor-pointer">
              {saving ? "Đang xử lý..." : method === "CASH" ? "Đã thu tiền mặt" : "Hiện mã QR"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
