"use client";

import { useRef } from "react";
import { Printer, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    orderCode: string;
    createdAt: string;
    branchName: string;
    sellerName: string;
    customer: {
      name: string;
      phone?: string;
      customerCode?: string;
    } | null;
    items: Array<{
      productName: string;
      sku: string;
      quantity: number;
      unitPrice: number;
      discountAmount: number;
    }>;
    grandTotal: number;
    customerPay: number;
    change: number;
    paymentMethod: string;
    note?: string;
    discountType?: "ORDER" | "PROMOTION" | null;
    discountValue?: number;
    appliedPromotions?: Array<{
      promotionId: string;
      promoName: string;
      discountAmount: number;
      id?: string;
    }> | null;
  } | null;
}

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    value,
  );

export function ReceiptDialog({
  open,
  onOpenChange,
  order,
}: ReceiptDialogProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!order) return null;

  const handlePrint = () => {
    if (receiptRef.current) {
      const printContents = receiptRef.current.innerHTML;
      const originalContents = document.body.innerHTML;

      // Basic print styling wrapper
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>In Hóa Đơn - ${order.orderCode}</title>
              <style>
                body { font-family: 'Inter', sans-serif; padding: 20px; color: #000; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th, td { border-bottom: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
                th { background-color: #f2f2f2; }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                .header { margin-bottom: 20px; text-align: center; }
                .title { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
                .details { font-size: 12px; margin-bottom: 15px; line-height: 1.6; }
                .totals { margin-top: 20px; font-size: 12px; }
                .totals-row { display: flex; justify-content: space-between; padding: 4px 0; }
                .totals-bold { font-weight: bold; border-top: 1px solid #000; padding-top: 8px; margin-top: 8px; }
                .footer { margin-top: 30px; text-align: center; font-size: 11px; font-style: italic; }
              </style>
            </head>
            <body>
              ${printContents}
              <script>
                window.onload = function() {
                  window.print();
                  window.close();
                }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  const paymentMethodLabel: Record<string, string> = {
    CASH: "Tiền mặt",
    SEPAY: "QR SePay",
    BANK_TRANSFER: "Chuyển khoản",
    MOMO: "Ví MoMo",
    VNPAY: "Ví VNPay",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col p-6">
        <DialogHeader className="items-center text-center pb-2 border-b">
          <div className="size-12 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2">
            <CheckCircle2 className="size-8 animate-bounce" />
          </div>
          <DialogTitle className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            Thanh Toán Thành Công!
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Giao dịch đã được ghi nhận vào hệ thống
          </p>
        </DialogHeader>

        {/* Scrollable Receipt Content */}
        <div className="flex-1 overflow-y-auto py-4 px-2 my-2 border border-dashed rounded bg-slate-50/50 dark:bg-slate-900/30">
          <div
            ref={receiptRef}
            className="text-sm space-y-4 font-sans text-foreground"
          >
            {/* Header info */}
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold tracking-tight text-foreground uppercase">
                HÓA ĐƠN BÁN HÀNG
              </h2>
              <p className="text-xs text-muted-foreground font-mono">
                {order.orderCode}
              </p>
              <p className="text-xs text-muted-foreground">
                Ngày: {new Date(order.createdAt).toLocaleString("vi-VN")}
              </p>
            </div>

            <hr className="border-t border-dashed" />

            {/* Meta details */}
            <div className="grid grid-cols-2 gap-y-1 text-xs">
              <span className="text-muted-foreground">Chi nhánh:</span>
              <span className="text-right font-medium">{order.branchName}</span>

              <span className="text-muted-foreground">Thu ngân:</span>
              <span className="text-right font-medium">{order.sellerName}</span>

              <span className="text-muted-foreground">Khách hàng:</span>
              <span className="text-right font-medium text-primary">
                {order.customer?.name || "Khách vãng lai"}
              </span>

              {order.customer?.phone && (
                <>
                  <span className="text-muted-foreground">Điện thoại:</span>
                  <span className="text-right font-mono">
                    {order.customer.phone}
                  </span>
                </>
              )}
            </div>

            {/* Items Table */}
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-dashed text-muted-foreground">
                  <th className="py-2 text-left font-semibold">Tên sản phẩm</th>
                  <th className="py-2 text-center font-semibold w-12">SL</th>
                  <th className="py-2 text-right font-semibold w-24">
                    Đơn giá
                  </th>
                  <th className="py-2 text-right font-semibold w-24">
                    Thành tiền
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => {
                  const lineTotal =
                    item.quantity * item.unitPrice -
                    item.discountAmount * item.quantity;
                  return (
                    <tr
                      key={index}
                      className="border-b border-dashed border-muted/30"
                    >
                      <td className="py-2">
                        <div className="font-medium">{item.productName}</div>
                        {item.discountAmount > 0 && (
                          <div className="text-[10px] text-red-500">
                            Khuyến mãi: -{formatVND(item.discountAmount)} / cái
                          </div>
                        )}
                      </td>
                      <td className="py-2 text-center">{item.quantity}</td>
                      <td className="py-2 text-right tabular-nums">
                        {formatVND(item.unitPrice)}
                      </td>
                      <td className="py-2 text-right font-medium tabular-nums">
                        {formatVND(lineTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Checkout Totals */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tổng tiền hàng:</span>
                <span className="font-medium tabular-nums">
                  {formatVND(
                    order.items.reduce(
                      (acc, item) => acc + item.quantity * item.unitPrice,
                      0,
                    ),
                  )}
                </span>
              </div>

              {order.items.reduce(
                (acc, item) => acc + item.discountAmount * item.quantity,
                0,
              ) > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Giảm giá sản phẩm:</span>
                  <span className="tabular-nums">
                    -
                    {formatVND(
                      order.items.reduce(
                        (acc, item) =>
                          acc + item.discountAmount * item.quantity,
                        0,
                      ),
                    )}
                  </span>
                </div>
              )}

              {order.discountValue && order.discountValue > 0 ? (
                <>
                  <div className="flex justify-between text-red-500 font-medium">
                    <span>Chiết khấu ({order.discountType === "PROMOTION" ? "Khuyến mãi" : "Giảm đơn"}):</span>
                    <span className="tabular-nums">
                      -{formatVND(order.discountValue)}
                    </span>
                  </div>
                  {order.discountType === "PROMOTION" && order.appliedPromotions && order.appliedPromotions.length > 0 && (
                    <div className="pl-3 space-y-0.5 text-[11px] text-muted-foreground border-l border-primary/20">
                      {order.appliedPromotions.map((p, idx) => (
                        <div key={p.id || idx} className="flex justify-between">
                          <span>• {p.promoName}:</span>
                          <span className="tabular-nums">-{formatVND(p.discountAmount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : null}

              <div className="flex justify-between font-bold text-sm border-t border-dashed pt-2 mt-2">
                <span>Khách cần trả:</span>
                <span className="tabular-nums text-primary">
                  {formatVND(order.grandTotal)}
                </span>
              </div>

              <div className="flex justify-between pt-1">
                <span className="text-muted-foreground">
                  Khách thanh toán (
                  {paymentMethodLabel[order.paymentMethod] ||
                    order.paymentMethod}
                  ):
                </span>
                <span className="font-semibold text-foreground tabular-nums">
                  {formatVND(order.customerPay)}
                </span>
              </div>

              <div className="flex justify-between pt-1">
                <span className="text-muted-foreground">
                  Tiền thừa trả khách:
                </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatVND(order.change)}
                </span>
              </div>

              {order.note && (
                <div className="pt-2 border-t border-dashed mt-2">
                  <div className="text-muted-foreground text-[11px]">
                    Ghi chú:
                  </div>
                  <div className="italic text-xs text-foreground bg-muted p-1.5 rounded mt-1">
                    {order.note}
                  </div>
                </div>
              )}
            </div>

            <hr className="border-t border-dashed" />

            <div className="text-center text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Cảm ơn Quý khách, hẹn gặp lại!</p>
              <p className="text-[10px] font-mono">Powered by iKiot System</p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer flex-1 sm:flex-none mr-2"
            onClick={() => onOpenChange(false)}
          >
            Đóng
          </Button>
          <Button
            type="button"
            onClick={handlePrint}
            className="cursor-pointer flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Printer className="size-4 mr-2" />
            In hóa đơn (F8)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
