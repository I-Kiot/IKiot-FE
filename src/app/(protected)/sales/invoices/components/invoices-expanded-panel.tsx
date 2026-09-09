"use client";

import { useEffect, useRef, useState } from "react";
import {
  CreditCard,
  FileText,
  Package2,
  ShieldCheck,
  User2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type Invoice, PAYMENT_METHOD_MAP } from "./invoices-columns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface InvoicesExpandedPanelProps {
  invoice: Invoice;
  isExpanded: boolean;
  isLastRow?: boolean;
}

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    value,
  );

export function InvoicesExpandedPanel({
  invoice,
  isExpanded,
  isLastRow,
}: InvoicesExpandedPanelProps) {
  const [loading, setLoading] = useState(false);
  const wasExpandedRef = useRef(false);

  useEffect(() => {
    if (isExpanded && !wasExpandedRef.current) {
      wasExpandedRef.current = true;
      setLoading(true);
      const timer = setTimeout(() => setLoading(false), 350);
      return () => clearTimeout(timer);
    }
    if (!isExpanded) {
      wasExpandedRef.current = false;
    }
  }, [isExpanded]);

  if (loading) {
    return (
      <div className={cn("bg-muted/30 px-6 py-6 space-y-4", !isLastRow && "border-b")}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-28 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-28 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Calculated values
  const totalQuantity = invoice.items.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  return (
    <div
      className={cn(
        "bg-muted/20 px-6 pb-6 pt-3 space-y-6 animate-in fade-in-0 duration-200",
        !isLastRow && "border-b",
      )}
    >
      <Tabs defaultValue="products" className="w-full">
        <TabsList>
          <TabsTrigger value="products">Danh sách sản phẩm</TabsTrigger>
          <TabsTrigger value="details">
            Thông tin khách hàng & Thanh toán
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4 outline-none">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Package2 className="size-4" />
            <span>Danh sách sản phẩm ({invoice.items.length})</span>
          </div>

          <div className="rounded-md border bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Tên hàng hóa</TableHead>
                  <TableHead className="text-right w-24">Số lượng</TableHead>
                  <TableHead className="text-right w-32">Đơn giá</TableHead>
                  <TableHead className="text-right w-28">Giảm giá</TableHead>
                  <TableHead className="text-right w-36">Thành tiền</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item, index) => {
                  const itemTotal =
                    item.quantity * item.unitPrice - item.discountAmount;
                  return (
                    <TableRow
                      key={item.productItemId}
                      className="hover:bg-muted/30"
                    >
                      <TableCell className="text-center font-medium text-muted-foreground text-xs">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {item.productName}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums text-sm">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground text-sm">
                        {formatVND(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-red-500 text-xs font-medium">
                        {item.discountAmount > 0
                          ? `-${formatVND(item.discountAmount)}`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold text-sm text-foreground">
                        {formatVND(itemTotal)}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {/* Total Quantity Row */}
                <TableRow className="bg-muted/20 font-medium hover:bg-muted/20">
                  <TableCell
                    colSpan={2}
                    className="text-left font-semibold text-sm"
                  >
                    Tổng tiền hàng
                  </TableCell>
                  <TableCell className="text-right font-bold tabular-nums text-sm">
                    {totalQuantity}
                  </TableCell>
                  <TableCell colSpan={2} />
                  <TableCell className="text-right font-bold tabular-nums text-primary text-sm">
                    {formatVND(invoice.discountValue && invoice.discountValue > 0 ? invoice.grandTotal + invoice.discountValue : invoice.grandTotal)}
                  </TableCell>
                </TableRow>
                {/* Discount Rows */}
                {invoice.discountType && invoice.discountValue && invoice.discountValue > 0 && (
                  <>
                    <TableRow className="bg-red-50/50 dark:bg-red-950/10 hover:bg-red-50/50 dark:hover:bg-red-950/10">
                      <TableCell
                        colSpan={5}
                        className="text-left text-sm font-medium text-red-600 dark:text-red-400"
                      >
                        Chiết khấu ({invoice.discountType === "PROMOTION" ? "Khuyến mãi" : "Giảm giá theo đơn"})
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums text-red-500 text-sm">
                        -{formatVND(invoice.discountValue)}
                      </TableCell>
                    </TableRow>
                    {invoice.discountType === "PROMOTION" && invoice.appliedPromotions && invoice.appliedPromotions.length > 0 && (
                      invoice.appliedPromotions.map((p, idx) => (
                        <TableRow key={p.id || idx} className="bg-red-50/30 dark:bg-red-950/5 hover:bg-red-50/30 dark:hover:bg-red-950/5">
                          <TableCell />
                          <TableCell
                            colSpan={4}
                            className="text-left text-xs text-muted-foreground pl-4"
                          >
                            • {p.promoName}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-red-400 text-xs">
                            -{formatVND(p.discountAmount)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    <TableRow className="bg-muted/30 font-medium hover:bg-muted/30">
                      <TableCell
                        colSpan={5}
                        className="text-left font-bold text-sm text-primary"
                      >
                        Khách cần trả
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums text-primary text-sm">
                        {formatVND(invoice.grandTotal)}
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Notes Card */}
          {invoice.note && (
            <div className="flex gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10 text-sm">
              <FileText className="size-4 mt-0.5 text-primary shrink-0" />
              <div className="space-y-1">
                <p className="font-semibold text-primary/90 text-xs uppercase tracking-wider">
                  Ghi chú đơn hàng
                </p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {invoice.note}
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="details"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start outline-none"
        >
          {/* Customer & Seller Details Card */}
          <Card className="shadow-sm">
            <CardContent className="p-4 space-y-4 text-xs">
              <div className="flex items-center gap-2 font-semibold text-sm text-foreground pb-1 border-b">
                <User2 className="size-4 text-muted-foreground" />
                <span>Thông tin khách hàng</span>
              </div>
              <div className="space-y-2 font-medium">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mã khách hàng:</span>
                  <span className="font-mono font-medium">
                    {invoice.customer.code}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tên khách hàng:</span>
                  <span className="font-semibold text-right">
                    {invoice.customer.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Số điện thoại:</span>
                  <span className="font-mono text-right">
                    {invoice.customer.phone}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Giới tính:</span>
                  <span>
                    {invoice.customer.gender === "MALE"
                      ? "Nam"
                      : invoice.customer.gender === "FEMALE"
                        ? "Nữ"
                        : "Khác"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 font-semibold text-sm text-foreground pt-2 pb-1 border-b">
                <ShieldCheck className="size-4 text-muted-foreground" />
                <span>Thông tin người bán</span>
              </div>
              <div className="space-y-2 font-medium">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Nhân viên bán hàng:
                  </span>
                  <span className="font-semibold">{invoice.seller.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Email nhân viên:
                  </span>
                  <span className="text-muted-foreground font-mono">
                    {invoice.seller.email || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chức năng:</span>
                  <span className="text-muted-foreground">
                    {invoice.seller.role}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary Card */}
          <Card className="shadow-sm border-primary/20 bg-primary/5">
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="flex items-center gap-2 font-semibold text-sm text-primary pb-1 border-b border-primary/10">
                <CreditCard className="size-4" />
                <span>Thông tin thanh toán</span>
              </div>
              <div className="space-y-2 font-medium">
                <div className="flex justify-between text-muted-foreground">
                  <span>Hình thức mua hàng:</span>
                  <span className="text-foreground text-right font-semibold">
                    {PAYMENT_METHOD_MAP[invoice.paymentMethod]}
                  </span>
                </div>
                {invoice.discountValue && invoice.discountValue > 0 ? (
                  <>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tổng tiền hàng (tạm tính):</span>
                      <span className="text-foreground font-semibold tabular-nums">
                        {formatVND(invoice.grandTotal + invoice.discountValue)}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Chiết khấu ({invoice.discountType === "PROMOTION" ? "Khuyến mãi" : "Giảm giá theo đơn"}):</span>
                      <span className="text-red-500 font-semibold tabular-nums">
                        -{formatVND(invoice.discountValue)}
                      </span>
                    </div>
                    {invoice.discountType === "PROMOTION" && invoice.appliedPromotions && invoice.appliedPromotions.length > 0 && (
                      <div className="pl-3 py-1 space-y-1 border-l-2 border-primary/20 text-[11px] text-muted-foreground bg-muted/40 rounded-r-md">
                        <div className="font-semibold text-primary/70">Khuyến mãi đã áp dụng:</div>
                        {invoice.appliedPromotions.map((p, idx) => (
                          <div key={p.id || idx} className="flex justify-between">
                            <span>• {p.promoName}</span>
                            <span className="tabular-nums">-{formatVND(p.discountAmount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : null}
                <div className="flex justify-between text-muted-foreground">
                  <span>Cần thanh toán:</span>
                  <span className="text-foreground font-bold tabular-nums">
                    {formatVND(invoice.grandTotal)}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Khách thanh toán:</span>
                  <span className="text-green-600 dark:text-green-400 font-bold tabular-nums">
                    {formatVND(invoice.customerPay)}
                  </span>
                </div>
                <Separator className="my-1 bg-primary/10" />
                <div className="flex justify-between font-bold text-sm">
                  <span className="text-primary font-bold">
                    Tiền thừa trả khách:
                  </span>
                  <span className="text-primary font-bold tabular-nums">
                    {formatVND(invoice.change)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
