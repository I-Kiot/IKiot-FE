"use client";

import { useEffect, useRef, useState } from "react";
import { MoneyInput } from "@/app/(protected)/exchange/shared/form-fields";
import {
  AlertTriangle,
  Ban,
  Banknote,
  CheckCircle2,
  Copy,
  Loader2,
  QrCode,
  TimerOff,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket";
import { orderApi } from "@/lib/api/order";
import { getApiErrorBody } from "@/lib/api/error-codes";
import { useCountdown } from "@/hooks/use-countdown";
import { QrCountdown } from "@/components/qr-countdown";
import type { Order, OrderPaidEvent } from "@/types/order";

interface OrderQrDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  /** Null = server không cấp được mã: coi như hết hạn, không vẽ ảnh. */
  qrUrl: string | null;
  /** Hạn mã do server trả (`qrExpiresAt`). */
  expiresAt: string | null;
  paymentReference: string;
  grandTotal: number;
  onPaymentConfirmed: () => void;
  onPaidOffline: (info: { customerPay: number; change: number }) => void;
  /** Đơn đã hủy (tay hoặc do QR hết hạn): đóng dialog rồi lên lại đơn. */
  onRestart: () => void;
}

type QrStatus = "pending" | "paid" | "expired" | "cancelled";

/** Mã QR đang hiển thị: lúc đầu từ props, sau "Tạo QR phần còn lại" là mã mới do server trả. */
interface ActiveQr {
  url: string | null;
  expiresAt: string | null;
  reference: string;
  /** Số tiền mã yêu cầu. */
  amount: number;
}

/** Khách đã chuyển thiếu: số đã nhận và số còn phải thu (do server tính, từ socket `order:paid`). */
interface PartialInfo {
  received: number;
  due: number;
}

/** Hai mã lỗi báo đơn đã đổi trạng thái ở nơi khác (đã thu, hoặc đã bị hủy). */
const STALE_ORDER_CODES = ["ORDER_NOT_PENDING_SEPAY", "ORDER_PAYMENT_CONFLICT"];

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

/** Mã tham chiếu của khoản QR đang chờ mới nhất trong `order.payments` (rỗng nếu không có). */
function latestQrReference(order: Order): string {
  const pending = (order.payments ?? []).filter(
    (p) => p.status === "PENDING" && p.method === "SEPAY" && p.paymentReference,
  );
  const latest = pending[pending.length - 1];
  return latest?.paymentReference ?? order.paymentReference ?? "";
}

export function OrderQrDialog({
  open,
  onOpenChange,
  orderId,
  qrUrl,
  expiresAt,
  paymentReference,
  grandTotal,
  onPaymentConfirmed,
  onPaidOffline,
  onRestart,
}: OrderQrDialogProps) {
  const [rawStatus, setStatus] = useState<QrStatus>("pending");
  const [cancelReason, setCancelReason] = useState<"manual" | "expired">("manual");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [isCashMode, setIsCashMode] = useState(false);
  const [customerPay, setCustomerPay] = useState(grandTotal);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qr, setQr] = useState<ActiveQr>({
    url: qrUrl,
    expiresAt,
    reference: paymentReference,
    amount: grandTotal,
  });
  // Khách chuyển thiếu: đơn vẫn chờ, thu ngân chọn QR cho phần còn lại hay tiền mặt. Null = chưa nhận đồng nào.
  const [partial, setPartial] = useState<PartialInfo | null>(null);
  // Đang ở màn "khách chuyển thiếu" (chưa chọn cách thu nốt).
  const [awaitingChoice, setAwaitingChoice] = useState(false);
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundMethod, setRefundMethod] = useState<"CASH" | "BANK_TRANSFER">("BANK_TRANSFER");
  // Server báo đơn đang giữ tiền (ORDER_REFUND_AMOUNT_REQUIRED) dù màn này chưa nhận sự kiện nào.
  const [refundRequired, setRefundRequired] = useState(false);
  const countdown = useCountdown(qr.expiresAt);

  /** Số còn phải thu bằng tiền mặt / QR: phần còn thiếu nếu đã nhận một phần, không thì cả đơn. */
  const dueAmount = partial?.due ?? grandTotal;
  /** Số shop đang giữ (đã nhận): có thì huỷ đơn phải chọn hoàn bao nhiêu. */
  const heldAmount = partial?.received ?? 0;
  const mustRefund = heldAmount > 0 || refundRequired;

  // Hết hạn theo đồng hồ (hoặc không có mã) thì hiện view hết hạn, dù chưa nhận event nào.
  const status: QrStatus =
    rawStatus === "pending" && !awaitingChoice && (!qr.url || countdown.expired)
      ? "expired"
      : rawStatus;

  // Đơn đã chốt bằng tiền mặt: bỏ qua sự kiện order:paid dội về từ chính request này,
  // nếu không receipt sẽ hiện sai phương thức thanh toán.
  const paidOfflineRef = useRef(false);

  useEffect(() => {
    if (!open || !orderId) return;

    setStatus("pending");
    setConfirmCancel(false);
    setIsCashMode(false);
    setCustomerPay(grandTotal);
    setIsSubmitting(false);
    setQr({ url: qrUrl, expiresAt, reference: paymentReference, amount: grandTotal });
    setPartial(null);
    setAwaitingChoice(false);
    setRefundAmount(0);
    setRefundMethod("BANK_TRANSFER");
    setRefundRequired(false);
    paidOfflineRef.current = false;

    const socket = getSocket();

    // Event order:paid đi tới room tenant:<id> kèm orderId trong payload. BẮT BUỘC lọc theo orderId: mọi máy POS trong shop đều nhận,
    // không lọc thì báo đã thu tiền khi khách khác vừa trả. Vẫn lắng nghe cả khi mã đã hết hạn (tiền về muộn vẫn được ghi nhận).
    const handlePaid = (payload?: OrderPaidEvent) => {
      if (payload?.orderId && payload.orderId !== orderId) return;
      if (paidOfflineRef.current) return;
      // Khách chuyển thiếu: đơn chưa hoàn thành, hiện số đã nhận + còn phải thu thay vì báo thành công.
      if (payload?.partial) {
        const due = Math.max(0, payload.due ?? 0);
        setPartial({ received: Math.max(0, grandTotal - due), due });
        setAwaitingChoice(true);
        setIsCashMode(false);
        setConfirmCancel(false);
        setStatus((prev) => (prev === "paid" || prev === "cancelled" ? prev : "pending"));
        return;
      }
      setStatus("paid");
      setTimeout(() => {
        onOpenChange(false);
        onPaymentConfirmed();
      }, 1500);
    };

    // Server hủy đơn QR quá hạn và trả hàng về kho. Lọc theo orderId như order:paid.
    const handleCancelled = (payload?: { orderId?: string; reason?: string }) => {
      if (payload?.orderId !== orderId) return;
      setCancelReason(payload.reason === "QR_EXPIRED" ? "expired" : "manual");
      setStatus((prev) => (prev === "paid" ? prev : "cancelled"));
    };

    socket.on("order:paid", handlePaid);
    socket.on("order:cancelled", handleCancelled);

    return () => {
      socket.off("order:paid", handlePaid);
      socket.off("order:cancelled", handleCancelled);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ đặt lại khi mở dialog / đổi đơn; props mã QR chỉ là giá trị khởi tạo
  }, [open, orderId, grandTotal]);

  const handleCopy = () => {
    navigator.clipboard.writeText(qr.reference);
    toast.success("Đã sao chép nội dung chuyển khoản");
  };

  const change = Math.max(0, customerPay - dueAmount);

  /** Đơn đã đổi trạng thái ở nơi khác: đọc lại để hiện đúng view. Trả true nếu đã xử lý. */
  const resyncOrder = async (err: unknown): Promise<boolean> => {
    const code = getApiErrorBody(err)?.code;
    if (!code || !STALE_ORDER_CODES.includes(code)) return false;
    try {
      const fresh = await orderApi.getById(orderId);
      if (fresh.status === "CANCELLED") {
        setCancelReason("manual");
        setStatus("cancelled");
        return true;
      }
      if (fresh.status === "COMPLETED") {
        setStatus("paid");
        setTimeout(() => {
          onOpenChange(false);
          onPaymentConfirmed();
        }, 1500);
        return true;
      }
    } catch {
      // Không đọc lại được: để báo lỗi chung.
    }
    return false;
  };

  const handleCancelOrder = async () => {
    if (heldAmount > 0 && refundAmount > heldAmount) {
      toast.error("Số tiền hoàn không được lớn hơn số tiền đã nhận");
      return;
    }
    setIsSubmitting(true);
    try {
      await orderApi.cancelPosSale(orderId, mustRefund ? { refundAmount, refundMethod } : {});
      toast.success(
        mustRefund && refundAmount > 0
          ? "Đã hủy đơn, hàng đã trả về kho. Nhớ hoàn tiền cho khách."
          : "Đã hủy đơn, hàng đã trả về kho",
      );
      setCancelReason("manual");
      setStatus("cancelled");
    } catch (err) {
      if (getApiErrorBody(err)?.code === "ORDER_REFUND_AMOUNT_REQUIRED") {
        // Đơn đang giữ tiền mà màn này chưa biết: hỏi số hoàn rồi cho hủy lại.
        setRefundRequired(true);
        toast.error(getApiErrorBody(err)?.message || "Đơn đã thu tiền - nhập số tiền hoàn cho khách");
        setIsSubmitting(false);
        return;
      }
      if (!(await resyncOrder(err))) {
        toast.error(getApiErrorBody(err)?.message || "Không hủy được đơn, vui lòng thử lại");
      }
    } finally {
      setIsSubmitting(false);
      setConfirmCancel(false);
    }
  };

  const handleConfirmCash = async () => {
    if (customerPay < dueAmount) {
      toast.error(
        partial
          ? "Số tiền khách đưa phải lớn hơn hoặc bằng số còn phải thu!"
          : "Số tiền khách trả phải lớn hơn hoặc bằng tổng hóa đơn!",
      );
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
      if (await resyncOrder(err)) return;
      const apiMessage = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      toast.error(
        apiMessage ||
          (err instanceof Error ? err.message : "") ||
          "Không ghi nhận được thanh toán tiền mặt",
      );
    }
  };

  /** "Tạo QR phần còn lại": mã mới cho đúng số còn phải thu (mã còn hạn đúng số tiền thì server trả lại nguyên mã). */
  const handleCreateRemainderQr = async () => {
    setIsSubmitting(true);
    try {
      const res = await orderApi.createPosQr(orderId);
      setQr({
        url: res.qrUrl,
        expiresAt: res.qrExpiresAt,
        reference: latestQrReference(res.order) || qr.reference,
        amount: res.amount,
      });
      // Số đã nhận = tổng đơn - số mã mới yêu cầu (mã yêu cầu đúng số còn phải thu).
      setPartial({ received: Math.max(0, grandTotal - res.amount), due: res.amount });
      setAwaitingChoice(false);
      setIsCashMode(false);
      setStatus("pending");
    } catch (err) {
      if (!(await resyncOrder(err))) {
        toast.error(getApiErrorBody(err)?.message || "Không tạo được mã QR, vui lòng thử lại");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCashMode = () => {
    setCustomerPay(dueAmount);
    setIsCashMode(true);
  };

  // Khách không quét được (hoặc mã hết hạn): trả tiền mặt tại quầy.
  const cashPanel = isCashMode && (
    <div className="space-y-3 p-3 rounded-lg border bg-muted/40">
      <div className="space-y-1.5">
        <Label htmlFor="offline-customer-pay" className="text-xs">
          Tiền khách đưa
        </Label>
        <MoneyInput
          id="offline-customer-pay"
          value={customerPay}
          onChange={setCustomerPay}
          className="tabular-nums"
          autoFocus
        />
      </div>
      {partial && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Còn phải thu</span>
          <span className="font-bold tabular-nums">{formatVND(dueAmount)}</span>
        </div>
      )}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Tiền thối lại</span>
        <span className="font-bold tabular-nums">{formatVND(change)}</span>
      </div>
      <Button
        type="button"
        className="w-full cursor-pointer"
        disabled={isSubmitting || customerPay < dueAmount}
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
  );

  const remainderQrButton = (
    <Button
      type="button"
      className="cursor-pointer"
      disabled={isSubmitting}
      onClick={handleCreateRemainderQr}
    >
      {isSubmitting ? (
        <Loader2 className="size-4 mr-2 animate-spin" />
      ) : (
        <QrCode className="size-4 mr-2" />
      )}
      Tạo QR phần còn lại
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && status === "cancelled") onOpenChange(false); }}>
      {/* Chờ QR / hết hạn mà chưa xử lý: không cho đóng bằng Esc hay bấm ra ngoài, để đơn không treo giữ hàng. */}
      <DialogContent
        className="sm:max-w-[420px]"
        showCloseButton={status === "cancelled"}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="size-5" />
            Thanh toán QR SePay
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {status === "pending" && awaitingChoice && partial && (
            <>
              <div className="flex flex-col items-center gap-2 py-2 text-center">
                <div className="size-14 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
                  <AlertTriangle className="size-8 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-lg font-bold">Khách chuyển thiếu</p>
              </div>
              <div className="space-y-1.5 rounded-lg border bg-muted/40 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tổng hóa đơn</span>
                  <span className="tabular-nums">{formatVND(grandTotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Khách đã chuyển</span>
                  <span className="font-semibold tabular-nums">{formatVND(partial.received)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Còn phải thu</span>
                  <span className="text-base font-extrabold text-primary tabular-nums">
                    {formatVND(partial.due)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {remainderQrButton}
                {!isCashMode && (
                  <Button type="button" variant="outline" className="cursor-pointer" onClick={openCashMode}>
                    <Banknote className="size-4 mr-2" />
                    Thu tiền mặt phần còn lại
                  </Button>
                )}
              </div>
              {cashPanel}
            </>
          )}

          {status === "pending" && !awaitingChoice && qr.url && (
            <>
              <div className="flex justify-center">
                <div className="rounded-xl border-2 border-border p-2 bg-white shadow-sm">
                  <img
                    src={qr.url}
                    alt="QR thanh toán"
                    className="w-56 h-56 object-contain"
                  />
                </div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-extrabold text-primary tabular-nums">
                  {formatVND(qr.amount)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Quét mã để thanh toán chính xác số tiền trên
                </p>
                {partial && (
                  <p className="text-sm text-muted-foreground">
                    Khách đã chuyển {formatVND(partial.received)}, còn phải thu {formatVND(partial.due)}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted border">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Nội dung chuyển khoản</p>
                  <p className="font-mono font-bold text-base tracking-wider truncate">
                    {qr.reference}
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

              <QrCountdown label={countdown.label} remainingMs={countdown.remainingMs} />

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                <span>Đang chờ xác nhận thanh toán...</span>
              </div>

              {cashPanel}
            </>
          )}

          {status === "expired" && (
            <>
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <div className="size-14 rounded-full bg-destructive/10 flex items-center justify-center">
                  <TimerOff className="size-8 text-destructive" />
                </div>
                <p className="text-lg font-bold text-destructive">Mã QR đã hết hạn</p>
                <p className="text-sm text-muted-foreground">
                  {partial
                    ? "Đơn đã nhận một phần tiền nên không tự hủy. Tạo mã QR mới cho số còn lại, hoặc thu tiền mặt."
                    : "Mã QR đã hết hạn. Đơn sẽ được hủy tự động và hàng trả về kho."}
                </p>
                <p className="text-sm text-muted-foreground">
                  Nếu khách vừa chuyển khoản, hệ thống vẫn ghi nhận khi tiền về.
                </p>
              </div>
              {partial && <div className="flex flex-col">{remainderQrButton}</div>}
              {cashPanel}
            </>
          )}

          {status === "cancelled" && (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <div className="size-14 rounded-full bg-muted flex items-center justify-center">
                <Ban className="size-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-bold">Đơn đã hủy</p>
              <p className="text-sm text-muted-foreground">
                {cancelReason === "expired"
                  ? "Đơn đã bị hủy do mã QR hết hạn, hàng đã trả về kho."
                  : "Đơn đã được hủy, hàng đã trả về kho."}
              </p>
            </div>
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

        {(status === "pending" || status === "expired") && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
            {confirmCancel ? (
              <div className="flex w-full flex-col gap-2">
                {mustRefund && (
                  <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
                    <p className="text-sm">
                      {heldAmount > 0
                        ? `Đơn đã nhận ${formatVND(heldAmount)}. Hoàn lại cho khách bao nhiêu? (0 = shop giữ lại)`
                        : "Đơn đã nhận tiền của khách. Hoàn lại cho khách bao nhiêu? (0 = shop giữ lại)"}
                    </p>
                    <MoneyInput
                      id="pos-refund-amount"
                      value={refundAmount}
                      onChange={setRefundAmount}
                      className="tabular-nums"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      {heldAmount > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="cursor-pointer"
                          onClick={() => setRefundAmount(heldAmount)}
                        >
                          Hoàn toàn bộ
                        </Button>
                      )}
                      <RadioGroup
                        className="flex gap-3"
                        value={refundMethod}
                        onValueChange={(v) => setRefundMethod(v as "CASH" | "BANK_TRANSFER")}
                      >
                        <Label className="flex cursor-pointer items-center gap-1.5 text-sm font-normal">
                          <RadioGroupItem value="BANK_TRANSFER" />
                          Chuyển khoản
                        </Label>
                        <Label className="flex cursor-pointer items-center gap-1.5 text-sm font-normal">
                          <RadioGroupItem value="CASH" />
                          Tiền mặt
                        </Label>
                      </RadioGroup>
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">Hủy đơn và trả hàng về kho?</span>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="cursor-pointer"
                    disabled={isSubmitting}
                    onClick={handleCancelOrder}
                  >
                    {isSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                    Hủy đơn
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="cursor-pointer"
                    disabled={isSubmitting}
                    onClick={() => setConfirmCancel(false)}
                  >
                    Giữ lại
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                className="text-muted-foreground cursor-pointer"
                disabled={isSubmitting}
                onClick={() => setConfirmCancel(true)}
              >
                <XCircle className="size-4 mr-2" />
                {status === "expired" ? "Hủy đơn ngay" : "Hủy đơn này"}
              </Button>
            )}
            {!isCashMode && !confirmCancel && !awaitingChoice && (
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={openCashMode}
              >
                <Banknote className="size-4 mr-2" />
                {status === "expired" ? "Thu tiền mặt" : "Chuyển sang tiền mặt"}
              </Button>
            )}
          </div>
        )}

        {status === "cancelled" && (
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
            <Button type="button" className="cursor-pointer" onClick={onRestart}>
              Lên lại đơn
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
