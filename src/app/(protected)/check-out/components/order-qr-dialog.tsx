"use client";

import { useEffect, useRef, useState } from "react";
import { Banknote, CheckCircle2, Copy, Loader2, QrCode, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket";
import { orderApi } from "@/lib/api/order";

interface OrderQrDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  qrUrl: string;
  paymentReference: string;
  grandTotal: number;
  onPaymentConfirmed: () => void;
  onPaidOffline: (info: { customerPay: number; change: number }) => void;
}

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

export function OrderQrDialog({
  open,
  onOpenChange,
  orderId,
  qrUrl,
  paymentReference,
  grandTotal,
  onPaymentConfirmed,
  onPaidOffline,
}: OrderQrDialogProps) {
  const [status, setStatus] = useState<"pending" | "paid">("pending");
  const [isCashMode, setIsCashMode] = useState(false);
  const [customerPay, setCustomerPay] = useState(grandTotal);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Đơn đã chốt bằng tiền mặt: bỏ qua sự kiện order:paid dội về từ chính request này,
  // nếu không receipt sẽ hiện sai phương thức thanh toán.
  const paidOfflineRef = useRef(false);

  useEffect(() => {
    if (!open || !orderId) return;

    setStatus("pending");
    setIsCashMode(false);
    setCustomerPay(grandTotal);
    setIsSubmitting(false);
    paidOfflineRef.current = false;

    const socket = getSocket();

    // The old server broadcast to an `order:<id>` room the client joined itself; the
    // rewrite only puts sockets into rooms it chose, so this arrives on `tenant:<id>`
    // with the order id in the payload. Matching on it is not optional: every till in
    // the shop now receives every `order:paid`, so an unfiltered handler would close
    // this dialog - and report the sale as settled - the moment *another* cashier's
    // customer paid.
    const handlePaid = (payload?: { orderId?: string }) => {
      if (payload?.orderId && payload.orderId !== orderId) return;
      if (paidOfflineRef.current) return;
      setStatus("paid");
      setTimeout(() => {
        onOpenChange(false);
        onPaymentConfirmed();
      }, 1500);
    };

    socket.on("order:paid", handlePaid);

    return () => {
      socket.off("order:paid", handlePaid);
    };
  }, [open, orderId, grandTotal]);

  const handleCopy = () => {
    navigator.clipboard.writeText(paymentReference);
    toast.success("Đã sao chép nội dung chuyển khoản");
  };

  const change = Math.max(0, customerPay - grandTotal);

  const handleConfirmCash = async () => {
    if (customerPay < grandTotal) {
      toast.error("Số tiền khách trả phải lớn hơn hoặc bằng tổng hóa đơn!");
      return;
    }

    setIsSubmitting(true);
    paidOfflineRef.current = true;
    try {
      await orderApi.payOffline(orderId, { paymentMethod: "CASH", customerPay });
      setStatus("paid");
      toast.success("Đã ghi nhận thanh toán tiền mặt!");
      setTimeout(() => {
        onOpenChange(false);
        onPaidOffline({ customerPay, change });
      }, 1200);
    } catch (err) {
      paidOfflineRef.current = false;
      setIsSubmitting(false);
      const apiMessage = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      toast.error(
        apiMessage ||
          (err instanceof Error ? err.message : "") ||
          "Không ghi nhận được thanh toán tiền mặt",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && status !== "paid") onOpenChange(false); }}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="size-5" />
            Thanh toán QR SePay
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {status === "pending" && (
            <>
              {/* QR Image */}
              <div className="flex justify-center">
                <div className="rounded-xl border-2 border-border p-2 bg-white shadow-sm">
                  <img
                    src={qrUrl}
                    alt="QR thanh toán"
                    className="w-56 h-56 object-contain"
                  />
                </div>
              </div>

              {/* Amount */}
              <div className="text-center">
                <div className="text-3xl font-extrabold text-primary tabular-nums">
                  {formatVND(grandTotal)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Quét mã để thanh toán chính xác số tiền trên
                </p>
              </div>

              {/* Reference code */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted border">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Nội dung chuyển khoản</p>
                  <p className="font-mono font-bold text-base tracking-wider truncate">
                    {paymentReference}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  className="size-8 shrink-0 cursor-pointer"
                >
                  <Copy className="size-3.5" />
                </Button>
              </div>

              {/* Socket listening indicator */}
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                <span>Đang chờ xác nhận thanh toán...</span>
              </div>

              {/* Fallback: khách không quét được, trả tiền mặt tại quầy */}
              {isCashMode && (
                <div className="space-y-3 p-3 rounded-lg border bg-muted/40">
                  <div className="space-y-1.5">
                    <Label htmlFor="offline-customer-pay" className="text-xs">
                      Tiền khách đưa
                    </Label>
                    <Input
                      id="offline-customer-pay"
                      type="number"
                      min={grandTotal}
                      step={1000}
                      value={customerPay}
                      onChange={(e) => setCustomerPay(Number(e.target.value))}
                      className="tabular-nums"
                      autoFocus
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tiền thối lại</span>
                    <span className="font-bold tabular-nums">{formatVND(change)}</span>
                  </div>
                  <Button
                    type="button"
                    className="w-full cursor-pointer"
                    disabled={isSubmitting || customerPay < grandTotal}
                    onClick={handleConfirmCash}
                  >
                    {isSubmitting ? (
                      <Loader2 className="size-4 mr-2 animate-spin" />
                    ) : (
                      <Banknote className="size-4 mr-2" />
                    )}
                    Xác nhận đã nhận tiền mặt
                  </Button>
                </div>
              )}
            </>
          )}

          {status === "paid" && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="size-16 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                <CheckCircle2 className="size-10 text-emerald-600 dark:text-emerald-400 animate-bounce" />
              </div>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                Thanh toán thành công!
              </p>
              <p className="text-sm text-muted-foreground">Đang in hóa đơn...</p>
            </div>
          )}
        </div>

        {status === "pending" && (
          <div className="flex justify-between gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground cursor-pointer"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              <XCircle className="size-4 mr-2" />
              Hủy đơn này
            </Button>
            {!isCashMode && (
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={() => setIsCashMode(true)}
              >
                <Banknote className="size-4 mr-2" />
                Chuyển sang tiền mặt
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
