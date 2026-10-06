"use client";

import * as React from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { orderJourneyApi } from "@/lib/api/order-journey";
import { orderReturnApi } from "@/lib/api/order-return";
import { getApiErrorBody } from "@/lib/api/error-codes";
import {
  ORDER_RETURN_REASON_LABELS,
  ORDER_STATUS_LABELS,
  type OrderDetail,
  type OrderListItem,
  type OrderLine,
  type OrderReturn,
  type OrderReturnReason,
} from "@/types/order-flow";

/** Orders whose goods already left stock - the only ones a return can bring back (contract §5). */
const RETURNABLE_STATUSES = ["SHIPPING", "RECEIVED", "COMPLETED"];
/** Lines that hold stock; a COMBO header and a SERVICE line never left the shelf. */
const STOCKED_LINES = ["PRODUCT", "COMBO_COMPONENT"];

/** What of a line can still come back. */
const remaining = (line: OrderLine) => line.quantity - line.returnedQuantity;

const returnableLines = (order: OrderDetail) =>
  order.items.filter(
    (line) =>
      // `OrderItemStatus` in order-flow.ts still lists the pre-2026-10-02 statuses; SHIPPED = stock deducted.
      (line.status as string) === "SHIPPED" && STOCKED_LINES.includes(line.lineType) && remaining(line) > 0,
  );

interface CreateReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (created: OrderReturn) => void;
}

/** `POST /order-returns`: pick the order, say how many of each shipped line come back and why. */
export function CreateReturnDialog({ open, onOpenChange, onCreated }: CreateReturnDialogProps) {
  const [search, setSearch] = React.useState("");
  const [order, setOrder] = React.useState<OrderDetail | null>(null);
  const [quantities, setQuantities] = React.useState<Record<string, number>>({});
  const [reason, setReason] = React.useState<OrderReturnReason>("CUSTOMER_RETURN");
  const [note, setNote] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // Debounced order search - the list endpoint matches code, customer name and phone. Results are
  // tagged with the term they answer, so a stale list is never shown and `searching` needs no state.
  const term = search.trim();
  const wanted = open && !order && term.length >= 2;
  const [found, setFound] = React.useState<{ term: string; items: OrderListItem[] } | null>(null);
  const results = wanted && found?.term === term ? found.items : [];
  const searching = wanted && found?.term !== term;

  React.useEffect(() => {
    if (!wanted) return;
    let stale = false;
    const timer = setTimeout(() => {
      orderJourneyApi
        .getList({ search: term, limit: 8 })
        .then((page) => {
          if (!stale) setFound({ term, items: page.data });
        })
        .catch(() => {
          if (!stale) setFound({ term, items: [] });
        });
    }, 300);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [wanted, term]);

  async function pick(item: OrderListItem) {
    try {
      const detail = await orderJourneyApi.getById(item.id);
      setOrder(detail);
      setQuantities({});
    } catch (error) {
      toast.error(getApiErrorBody(error)?.message ?? "Không tải được đơn hàng");
    }
  }

  const lines = order ? returnableLines(order) : [];
  const picked = lines.filter((line) => (quantities[line.id] ?? 0) > 0);

  async function submit() {
    if (!order || picked.length === 0) return;
    setSubmitting(true);
    try {
      const created = await orderReturnApi.create({
        orderId: order.id,
        reason,
        ...(note.trim() ? { note: note.trim() } : {}),
        items: picked.map((line) => ({
          orderItemId: line.id,
          quantity: quantities[line.id],
        })),
      });
      toast.success(`Đã tạo đơn hoàn ${created.code}`);
      onCreated(created);
    } catch (error) {
      toast.error(getApiErrorBody(error)?.message ?? "Không tạo được đơn hoàn");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tạo đơn hoàn hàng</DialogTitle>
          <DialogDescription>
            Chọn đơn đã xuất kho, nhập số lượng từng dòng khách trả về. Tồn kho chỉ thay đổi khi
            kiểm hàng.
          </DialogDescription>
        </DialogHeader>

        {!order ? (
          <div className="space-y-2">
            <Label htmlFor="return-order-search">Tìm đơn hàng</Label>
            <Input
              id="return-order-search"
              placeholder="Mã đơn, tên hoặc số điện thoại khách"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              autoFocus
            />
            {searching && <p className="text-sm text-muted-foreground">Đang tìm...</p>}
            <ul className="divide-y rounded-md border">
              {results.map((item) => {
                const returnable = RETURNABLE_STATUSES.includes(item.status);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      disabled={!returnable}
                      onClick={() => pick(item)}
                      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span>
                        <span className="font-medium">{item.code ?? item.id.slice(0, 8)}</span>
                        <span className="text-muted-foreground"> · {item.customer.name}</span>
                      </span>
                      <Badge variant={returnable ? "outline" : "secondary"}>
                        {ORDER_STATUS_LABELS[item.status] ?? item.status}
                      </Badge>
                    </button>
                  </li>
                );
              })}
              {results.length === 0 && search.trim().length >= 2 && !searching && (
                <li className="px-3 py-2 text-sm text-muted-foreground">Không tìm thấy đơn nào</li>
              )}
            </ul>
            <p className="text-xs text-muted-foreground">
              Chỉ đơn đang vận chuyển, đã nhận hoặc hoàn thành mới hoàn được. Đơn chưa xuất kho thì
              huỷ đơn.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <span>
                <span className="font-medium">{order.code ?? order.id.slice(0, 8)}</span>
                <span className="text-muted-foreground"> · {order.customer.name}</span>
              </span>
              <Button variant="ghost" size="sm" onClick={() => setOrder(null)}>
                Đổi đơn
              </Button>
            </div>

            {lines.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Đơn này không còn dòng hàng nào có thể hoàn.
              </p>
            ) : (
              <ul className="divide-y rounded-md border">
                {lines.map((line) => (
                  <li key={line.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="text-sm">
                      <div className="font-medium">{line.productName ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {line.sku ? `${line.sku} · ` : ""}đã giao {line.quantity}
                        {line.returnedQuantity > 0 ? `, đã hoàn ${line.returnedQuantity}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={remaining(line)}
                        className="w-20 text-right"
                        aria-label={`Số lượng hoàn của ${line.productName ?? line.sku ?? "dòng"}`}
                        value={quantities[line.id] ?? 0}
                        onChange={(event) => {
                          const value = Math.floor(Number(event.target.value) || 0);
                          setQuantities((prev) => ({
                            ...prev,
                            [line.id]: Math.min(Math.max(value, 0), remaining(line)),
                          }));
                        }}
                      />
                      <span className="text-xs text-muted-foreground">/ {remaining(line)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Lý do</Label>
                <Select value={reason} onValueChange={(v) => setReason(v as OrderReturnReason)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ORDER_RETURN_REASON_LABELS) as OrderReturnReason[]).map(
                      (value) => (
                        <SelectItem key={value} value={value}>
                          {ORDER_RETURN_REASON_LABELS[value]}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="return-note">Ghi chú (Tùy chọn)</Label>
                <Textarea
                  id="return-note"
                  value={note}
                  maxLength={500}
                  onChange={(event) => setNote(event.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button disabled={!order || picked.length === 0 || submitting} onClick={submit}>
            Tạo đơn hoàn
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
