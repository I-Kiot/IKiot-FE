"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { branchApi } from "@/lib/api/branch";
import { customerApi } from "@/lib/api/customer";
import { orderReturnApi } from "@/lib/api/order-return";
import { getApiErrorBody } from "@/lib/api/error-codes";
import { orderJourneyApi } from "@/lib/api/order-journey";
import { staffApi } from "@/lib/api/staff";
import { getCachedUser } from "@/lib/auth";
import type { Branch } from "@/types/branch";
import {
  ORDER_PRIORITIES,
  ORDER_PRIORITY_LABELS,
  type CreateOrderJourneyPayload,
  type OrderPriority,
} from "@/types/order-flow";
import { computeTotals, formatVND, type DepositType } from "../shared/order-totals";
import { CustomerPicker, type CustomerChoice } from "./customer-picker";
import { OrderLinesEditor, type OrderLineDraft } from "./order-lines-editor";

type FulfillmentChoice = "HOME_DELIVERY" | "STORE_PICKUP";
type DepositMethod = "CASH" | "BANK_TRANSFER";

interface AssigneeOption {
  id: string;
  name: string;
}

const toNumber = (raw: string) => Math.max(0, Number(raw) || 0);

/** The branch the account is posted to, else the one picked in the sidebar switcher. */
function preferredBranchId(): string {
  const user = getCachedUser() as { branchId?: string } | null;
  if (user?.branchId) return user.branchId;
  if (typeof window !== "undefined") {
    const id = localStorage.getItem("activeSwitcherItemId");
    if (id && localStorage.getItem("activeSwitcherItemType") === "branch" && id !== "all-branches") {
      return id;
    }
  }
  return "";
}

/** D-2: a manual order (`POST /orders`, contract §2). It is born CONFIRMED - there is no draft - and stock never blocks it. */
export function CreateOrderForm() {
  const router = useRouter();
  // D-11: a buy-again order for the damaged goods of a return - prefilled, then linked to it on create.
  const replacementFor = useSearchParams().get("replacementFor");
  const [replacementOf, setReplacementOf] = React.useState<{ id: string; code: string } | null>(null);

  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [assignees, setAssignees] = React.useState<AssigneeOption[]>([]);
  const [optionsReady, setOptionsReady] = React.useState(false);

  const [customer, setCustomer] = React.useState<CustomerChoice>({ mode: "existing", customer: null });
  const [branchId, setBranchId] = React.useState("");
  const [assigneeId, setAssigneeId] = React.useState("");
  const [fulfillment, setFulfillment] = React.useState<FulfillmentChoice>("HOME_DELIVERY");
  const [priority, setPriority] = React.useState<OrderPriority>("NORMAL");
  const [requestedDate, setRequestedDate] = React.useState("");
  const [recipientName, setRecipientName] = React.useState("");
  const [recipientPhone, setRecipientPhone] = React.useState("");
  const [deliveryAddress, setDeliveryAddress] = React.useState("");
  const [lines, setLines] = React.useState<OrderLineDraft[]>([]);
  const [shippingFee, setShippingFee] = React.useState(0);
  const [orderDiscount, setOrderDiscount] = React.useState(0);
  const [depositType, setDepositType] = React.useState<DepositType>("NONE");
  const [depositValue, setDepositValue] = React.useState(0);
  const [depositMethod, setDepositMethod] = React.useState<DepositMethod>("CASH");
  const [note, setNote] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [attempted, setAttempted] = React.useState(false);

  React.useEffect(() => {
    let stale = false;
    const me = getCachedUser() as { id?: string; fullName?: string; firstName?: string; lastName?: string } | null;
    Promise.allSettled([branchApi.getList({ limit: 100 }), staffApi.getActiveForScheduleOptions()]).then(
      ([branchResult, staffResult]) => {
        if (stale) return;
        if (branchResult.status === "fulfilled") {
          const list = branchResult.value.data;
          setBranches(list);
          const wanted = preferredBranchId();
          setBranchId(
            (current) =>
              current || (list.find((b) => b.id === wanted)?.id ?? (list.length === 1 ? list[0].id : "")),
          );
        } else {
          toast.error("Không tải được danh sách chi nhánh");
        }
        const staff =
          staffResult.status === "fulfilled"
            ? staffResult.value.map((s) => ({ id: s.id, name: s.fullName || s.phoneNumber }))
            : [];
        // The account creating the order can be its person in charge too (a shop owner is not in the staff list).
        const mine: AssigneeOption[] =
          me?.id && !staff.some((s) => s.id === me.id)
            ? [{ id: me.id, name: `${me.fullName || [me.lastName, me.firstName].filter(Boolean).join(" ") || "Tôi"} (tôi)` }]
            : [];
        setAssignees([...mine, ...staff]);
        setOptionsReady(true);
      },
    );
    return () => {
      stale = true;
    };
  }, []);

  const branch = branches.find((b) => b.id === branchId) ?? null;
  // Stock is read where the goods ship from: the branch's default fulfilment warehouse, else the branch.
  const stockLocation = branch
    ? branch.defaultFulfillmentLocationId
      ? { id: branch.defaultFulfillmentLocationId, type: "WAREHOUSE" as const }
      : { id: branch.id, type: "BRANCH" as const }
    : null;

  const totals = computeTotals({
    lines,
    orderDiscount,
    shippingFee,
    depositType,
    depositValue,
  });

  const customerError =
    customer.mode === "existing"
      ? customer.customer
        ? undefined
        : "Chọn một khách hàng hoặc nhập khách mới."
      : customer.name.trim()
        ? undefined
        : "Tên khách hàng là bắt buộc.";
  const errors = {
    customer: customerError,
    branch: branchId ? undefined : "Chọn chi nhánh bán.",
    assignee: assigneeId ? undefined : "Chọn người phụ trách đơn.",
    lines: lines.length > 0 ? undefined : "Đơn hàng cần ít nhất một mặt hàng.",
    deposit: totals.depositError ?? undefined,
  };
  const valid = !errors.customer && !errors.branch && !errors.assignee && !errors.lines && !errors.deposit;

  // Picking a customer fills the delivery details they already have, once, without overwriting what was typed.
  // D-11: once the pick-lists are in, copy the customer, branch, person in charge, delivery and the
  // damaged lines of the return's order. Prices are re-read from the catalogue by the server unless
  // the user keeps the agreed ones shown here.
  React.useEffect(() => {
    if (!replacementFor || !optionsReady) return;
    let stale = false;
    (async () => {
      try {
        const orderReturn = await orderReturnApi.getById(replacementFor);
        const order = await orderJourneyApi.getById(orderReturn.order.id);
        const original = await customerApi.getById(order.customer.id).catch(() => null);
        if (stale) return;
        const byLine = new Map(order.items.map((line) => [line.id, line]));
        const damaged = orderReturn.items.filter((item) => item.condition === "DAMAGED");
        setReplacementOf({ id: orderReturn.id, code: orderReturn.code });
        if (original) setCustomer({ mode: "existing", customer: original });
        setBranchId(order.branch.id);
        if (order.assignee) {
          const person = { id: order.assignee.id, name: order.assignee.name };
          setAssignees((prev) => (prev.some((a) => a.id === person.id) ? prev : [person, ...prev]));
          setAssigneeId(person.id);
        }
        if (order.fulfillmentType === "HOME_DELIVERY" || order.fulfillmentType === "STORE_PICKUP") {
          setFulfillment(order.fulfillmentType);
        }
        setRecipientName(order.recipientName ?? "");
        setRecipientPhone(order.recipientPhone ?? "");
        setDeliveryAddress(order.deliveryAddress ?? "");
        setNote(`Mua lại hàng hỏng của đơn hoàn ${orderReturn.code}`);
        setLines(
          damaged.flatMap((item) => {
            const line = byLine.get(item.orderItemId);
            if (!line) return [];
            return [
              {
                key: `${line.productItemId}-replace-${item.id}`,
                productItemId: line.productItemId,
                name: line.productName ?? line.sku ?? "",
                sku: line.sku ?? "",
                retailPrice: line.listUnitPrice,
                stock: 0,
                quantity: item.quantity,
                unitPrice: line.unitPrice,
                discountAmount: 0,
              },
            ];
          }),
        );
      } catch (error) {
        if (!stale) toast.error(getApiErrorBody(error)?.message ?? "Không tải được đơn hoàn");
      }
    })();
    return () => {
      stale = true;
    };
  }, [replacementFor, optionsReady]);

  const handleCustomer = (next: CustomerChoice) => {
    setCustomer(next);
    if (next.mode === "existing" && next.customer) {
      setRecipientName((current) => current || next.customer!.name);
      setRecipientPhone((current) => current || next.customer!.phone || "");
      setDeliveryAddress((current) => current || next.customer!.address || "");
    }
  };

  async function submit() {
    setAttempted(true);
    if (!valid) return;
    const payload: CreateOrderJourneyPayload = {
      branchId,
      assigneeId,
      fulfillmentType: fulfillment,
      priority,
      items: lines.map((line) => ({
        productItemId: line.productItemId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        ...(line.discountAmount > 0 ? { discountAmount: line.discountAmount } : {}),
      })),
      ...(customer.mode === "existing"
        ? { customerId: customer.customer!.id }
        : {
            customer: {
              name: customer.name.trim(),
              ...(customer.phone.trim() ? { phone: customer.phone.trim() } : {}),
              ...(customer.address.trim() ? { address: customer.address.trim() } : {}),
            },
          }),
      ...(shippingFee > 0 ? { shippingFee } : {}),
      ...(orderDiscount > 0 ? { discountType: "ORDER" as const, discountValue: orderDiscount } : {}),
      ...(depositType !== "NONE" && depositValue > 0
        ? { deposit: { type: depositType, value: depositValue, method: depositMethod } }
        : {}),
      ...(fulfillment === "HOME_DELIVERY" && recipientName.trim() ? { recipientName: recipientName.trim() } : {}),
      ...(fulfillment === "HOME_DELIVERY" && recipientPhone.trim() ? { recipientPhone: recipientPhone.trim() } : {}),
      ...(fulfillment === "HOME_DELIVERY" && deliveryAddress.trim() ? { deliveryAddress: deliveryAddress.trim() } : {}),
      ...(requestedDate ? { requestedDeliveryDate: requestedDate } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
    };

    setSubmitting(true);
    try {
      const created = await orderJourneyApi.create(payload);
      toast.success(`Đã tạo đơn ${created.code ?? ""}`.trim());
      if (replacementOf) {
        // The order exists either way; a failed link is reported, not undone.
        await orderReturnApi
          .setReplacementOrder(replacementOf.id, created.id)
          .catch(() =>
            toast.warning(`Đơn đã tạo nhưng chưa gắn được vào đơn hoàn ${replacementOf.code}`),
          );
      }      router.push(`/sales/orders/${created.id}`);
    } catch (error) {
      toast.error(getApiErrorBody(error)?.message ?? "Không tạo được đơn hàng");
      setSubmitting(false);
    }
  }

  const show = (message: string | undefined) => (attempted ? message : undefined);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Khách hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerPicker value={customer} onChange={handleCustomer} error={show(errors.customer)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mặt hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderLinesEditor
              lines={lines}
              onChange={setLines}
              stockLocation={stockLocation}
              error={show(errors.lines)}
            />
            <p className="mt-3 text-xs text-muted-foreground">
              Tồn kho chỉ để tham khảo
              {stockLocation ? ` (tại kho xuất mặc định của chi nhánh)` : ""}: đơn vẫn tạo được khi hết hàng,
              hàng thiếu sẽ được đặt xưởng sau.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Giao hàng</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Hình thức</Label>
              <Select value={fulfillment} onValueChange={(v) => setFulfillment(v as FulfillmentChoice)}>
                <SelectTrigger className="w-full" aria-label="Hình thức giao hàng">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HOME_DELIVERY">Giao tận nơi</SelectItem>
                  <SelectItem value="STORE_PICKUP">Khách tới lấy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="requested-date">Thời gian khách hẹn giao</Label>
              <Input
                id="requested-date"
                type="date"
                value={requestedDate}
                onChange={(event) => setRequestedDate(event.target.value)}
              />
            </div>
            {fulfillment === "HOME_DELIVERY" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="recipient-name">Người nhận</Label>
                  <Input
                    id="recipient-name"
                    value={recipientName}
                    onChange={(event) => setRecipientName(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="recipient-phone">Số điện thoại người nhận</Label>
                  <Input
                    id="recipient-phone"
                    inputMode="tel"
                    value={recipientPhone}
                    onChange={(event) => setRecipientPhone(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="delivery-address">Địa chỉ giao hàng</Label>
                  <Input
                    id="delivery-address"
                    value={deliveryAddress}
                    onChange={(event) => setDeliveryAddress(event.target.value)}
                  />
                </div>
              </>
            )}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="order-note">Ghi chú</Label>
              <Textarea id="order-note" value={note} onChange={(event) => setNote(event.target.value)} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Phụ trách</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>
                Chi nhánh bán <span className="text-destructive">*</span>
              </Label>
              <Select value={branchId} onValueChange={setBranchId} disabled={!optionsReady}>
                <SelectTrigger className="w-full" aria-label="Chi nhánh bán">
                  <SelectValue placeholder="Chọn chi nhánh" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {show(errors.branch) && <p className="text-sm text-destructive">{errors.branch}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>
                Người phụ trách <span className="text-destructive">*</span>
              </Label>
              <Select value={assigneeId} onValueChange={setAssigneeId} disabled={!optionsReady}>
                <SelectTrigger className="w-full" aria-label="Người phụ trách">
                  <SelectValue placeholder="Chọn người phụ trách" />
                </SelectTrigger>
                <SelectContent>
                  {assignees.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {show(errors.assignee) && <p className="text-sm text-destructive">{errors.assignee}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Mức ưu tiên</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as OrderPriority)}>
                <SelectTrigger className="w-full" aria-label="Mức ưu tiên">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_PRIORITIES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {ORDER_PRIORITY_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thanh toán</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="shipping-fee">Phí giao hàng</Label>
                <Input
                  id="shipping-fee"
                  type="number"
                  min={0}
                  className="text-right"
                  value={shippingFee}
                  onChange={(event) => setShippingFee(toNumber(event.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="order-discount">Giảm giá cả đơn</Label>
                <Input
                  id="order-discount"
                  type="number"
                  min={0}
                  className="text-right"
                  value={orderDiscount}
                  onChange={(event) => setOrderDiscount(toNumber(event.target.value))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Tiền cọc</Label>
              <div className="grid grid-cols-[1fr_1fr] gap-3">
                <Select value={depositType} onValueChange={(v) => setDepositType(v as DepositType)}>
                  <SelectTrigger className="w-full" aria-label="Loại tiền cọc">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Không cọc</SelectItem>
                    <SelectItem value="AMOUNT">Theo số tiền</SelectItem>
                    <SelectItem value="PERCENT">Theo %</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={0}
                  className="text-right"
                  aria-label="Giá trị tiền cọc"
                  disabled={depositType === "NONE"}
                  value={depositType === "NONE" ? 0 : depositValue}
                  onChange={(event) => setDepositValue(toNumber(event.target.value))}
                />
              </div>
              {depositType !== "NONE" && (
                <Select value={depositMethod} onValueChange={(v) => setDepositMethod(v as DepositMethod)}>
                  <SelectTrigger className="w-full" aria-label="Hình thức thu cọc">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Tiền mặt</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Chuyển khoản</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {depositType !== "NONE" && !totals.depositError && depositValue > 0 && (
                <p className="text-sm text-muted-foreground">
                  Quy đổi: {formatVND(totals.depositAmount)} ({totals.depositPercent}% tổng đơn)
                </p>
              )}
              {totals.depositError && <p className="text-sm text-destructive">{totals.depositError}</p>}
            </div>

            <dl className="space-y-1.5 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tiền hàng</dt>
                <dd>{formatVND(totals.goods)}</dd>
              </div>
              {totals.orderDiscount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Giảm giá cả đơn</dt>
                  <dd>-{formatVND(totals.orderDiscount)}</dd>
                </div>
              )}
              {totals.shippingFee > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Phí giao hàng</dt>
                  <dd>{formatVND(totals.shippingFee)}</dd>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold">
                <dt>Tổng tiền</dt>
                <dd data-testid="grand-total">{formatVND(totals.grandTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Đã cọc</dt>
                <dd>{formatVND(totals.depositAmount)}</dd>
              </div>
              <div className="flex justify-between font-medium">
                <dt>Còn phải thu</dt>
                <dd data-testid="amount-due">{formatVND(totals.amountDue)}</dd>
              </div>
            </dl>
            <p className="text-xs text-muted-foreground">
              Số tạm tính; hệ thống tính lại khi tạo đơn.
            </p>

            <Button className="w-full" disabled={submitting} onClick={submit}>
              Tạo đơn
            </Button>
            {attempted && !valid && (
              <p className="text-center text-sm text-destructive">Còn thông tin chưa hợp lệ ở trên.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
