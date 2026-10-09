"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Banknote, Check, FileText, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { SalesBranchSelect } from "@/app/(protected)/check-out/components/sales-branch-select";
import type { SalesBranch } from "@/app/(protected)/check-out/_hooks/use-sales-branch";
import { ProductSearch } from "@/app/(protected)/check-out/components/product-search";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/app/(protected)/exchange/shared/form-fields";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { customerApi } from "@/lib/api/customer";
import { orderReturnApi } from "@/lib/api/order-return";
import { getApiErrorBody } from "@/lib/api/error-codes";
import { orderJourneyApi } from "@/lib/api/order-journey";
import { staffApi } from "@/lib/api/staff";
import { getCachedUser } from "@/lib/auth";
import {
  ORDER_PRIORITIES,
  ORDER_PRIORITY_LABELS,
  type CreateOrderJourneyPayload,
  type OrderPriority,
} from "@/types/order-flow";
import { computeTotals, formatVND, type DepositType } from "../shared/order-totals";
import { CustomerPicker, type CustomerChoice } from "./customer-picker";
import type { OrderLineDraft } from "./order-lines-editor";
import { OrderCartLines } from "./order-cart-lines";

type FulfillmentChoice = "HOME_DELIVERY" | "STORE_PICKUP";
type DepositMethod = "CASH" | "BANK_TRANSFER";

interface AssigneeOption {
  id: string;
  name: string;
}

const toNumber = (raw: string) => Math.max(0, Number(raw) || 0);

/** D-2: a manual order (`POST /orders`, contract §2). It is born CONFIRMED - there is no draft - and stock never blocks it. */
export function CreateOrderForm({ sales }: { sales: SalesBranch }) {
  const { branches, branchId, setBranchId } = sales;
  const router = useRouter();
  // D-11: a buy-again order for the damaged goods of a return - prefilled, then linked to it on create.
  const replacementFor = useSearchParams().get("replacementFor");
  const [replacementOf, setReplacementOf] = React.useState<{ id: string; code: string } | null>(null);

  const [assignees, setAssignees] = React.useState<AssigneeOption[]>([]);
  const [optionsReady, setOptionsReady] = React.useState(false);

  const [customer, setCustomer] = React.useState<CustomerChoice>({ mode: "existing", customer: null });
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
  const [direction, setDirection] = React.useState<"horizontal" | "vertical">("horizontal");
  const keySeq = React.useRef(0);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const apply = (e: MediaQueryListEvent | MediaQueryList) =>
      setDirection(e.matches ? "horizontal" : "vertical");
    apply(mediaQuery);
    mediaQuery.addEventListener("change", apply);
    return () => mediaQuery.removeEventListener("change", apply);
  }, []);

  React.useEffect(() => {
    let stale = false;
    const me = getCachedUser() as { id?: string; fullName?: string; firstName?: string; lastName?: string } | null;
    staffApi
      .getActiveForScheduleOptions()
      .catch(() => [])
      .then((staffList) => {
        if (stale) return;
        const staff = staffList.map((s) => ({ id: s.id, name: s.fullName || s.phoneNumber }));
        // The account creating the order can be its person in charge too (a shop owner is not in the staff list).
        const mine: AssigneeOption[] =
          me?.id && !staff.some((s) => s.id === me.id)
            ? [{ id: me.id, name: `${me.fullName || [me.lastName, me.firstName].filter(Boolean).join(" ") || "Tôi"} (tôi)` }]
            : [];
        setAssignees([...mine, ...staff]);
        setOptionsReady(true);
      });
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
    branch: branchId ? undefined : "Chọn nơi bán.",
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
  }, [replacementFor, optionsReady, setBranchId]);

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
        ...(line.customization ? { customization: line.customization } : {}),
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
      }
      router.push(`/sales/orders/${created.id}`);
    } catch (error) {
      toast.error(getApiErrorBody(error)?.message ?? "Không tạo được đơn hàng");
      setSubmitting(false);
    }
  }

  /** Same merge rule the old line editor had: the same SKU at the same price just adds one. */
  const addProduct = React.useCallback(
    (product: { id: string; name: string; sku: string; retailPrice: number; stock: number }) => {
      setLines((current) => {
        const existing = current.find(
          (line) =>
            line.productItemId === product.id &&
            line.unitPrice === product.retailPrice &&
            !line.customization,
        );
        if (existing) {
          return current.map((line) =>
            line.key === existing.key ? { ...line, quantity: line.quantity + 1 } : line,
          );
        }
        return [
          ...current,
          {
            key: `${product.id}-${++keySeq.current}`,
            productItemId: product.id,
            name: product.name.endsWith(` (${product.sku})`)
              ? product.name.slice(0, -(product.sku.length + 3))
              : product.name,
            sku: product.sku,
            retailPrice: product.retailPrice,
            stock: product.stock,
            quantity: 1,
            unitPrice: product.retailPrice,
            discountAmount: 0,
          },
        ];
      });
    },
    [],
  );

  const show = (message: string | undefined) => (attempted ? message : undefined);
  const totalQuantity = lines.reduce((acc, line) => acc + line.quantity, 0);
  const sectionLabel = "font-semibold text-base text-muted-foreground";

  return (
    <div className="h-full min-h-[40rem] w-full">
      <ResizablePanelGroup direction={direction} className="h-full gap-4">
        {/* Left: product search + the order's lines (same shape as the direct-sale cart) */}
        <ResizablePanel defaultSize={62} minSize={30}>
          <div className="h-full flex flex-col gap-4 min-h-0">
            <div className="flex flex-col gap-3 bg-card p-4 rounded-xl border shadow-sm shrink-0">
              {replacementOf && (
                <p className="text-sm text-muted-foreground">
                  Mua lại hàng hỏng của đơn hoàn <span className="font-semibold">{replacementOf.code}</span>
                </p>
              )}
              <ProductSearch
                onProductSelect={(product) => addProduct({ ...product, id: product.id })}
                location={stockLocation}
                allowOutOfStock
                hideQuickItems
              />
              <p className="text-xs text-muted-foreground">
                Tồn kho chỉ để tham khảo
                {stockLocation ? ` (tại kho xuất mặc định của chi nhánh)` : ""}: đơn vẫn tạo được khi hết
                hàng, hàng thiếu sẽ được đặt xưởng sau.
              </p>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <OrderCartLines lines={lines} onChange={setLines} error={show(errors.lines)} />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="hidden lg:flex" />

        {/* Right: customer, assignment, delivery, payment */}
        <ResizablePanel defaultSize={38} minSize={28}>
          <Card className="border shadow-md bg-card/60 backdrop-blur-md h-full flex flex-col min-h-0">
            <CardHeader className="pt-2 border-b shrink-0">
              <CardTitle className="text-xl font-bold flex items-center justify-between text-foreground">
                <span>Thông Tin Đơn Hàng</span>
                <span className="text-base bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                  SL: {totalQuantity} món
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 pb-4 flex-1 overflow-y-auto scrollbar-thin">
              <div className="space-y-1.5">
                <Label className={sectionLabel}>Khách hàng</Label>
                <CustomerPicker value={customer} onChange={handleCustomer} error={show(errors.customer)} />
              </div>

              <Separator className="my-2" />

              <div className="space-y-4">
                <SalesBranchSelect sales={sales} error={show(errors.branch)} />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className={sectionLabel}>
                      Người phụ trách <span className="text-destructive">*</span>
                    </Label>
                    <Select value={assigneeId} onValueChange={setAssigneeId} disabled={!optionsReady}>
                      <SelectTrigger className="w-full" aria-label="Người phụ trách">
                        <SelectValue placeholder="Chọn người" />
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
                    <Label className={sectionLabel}>Mức ưu tiên</Label>
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
                </div>
              </div>

              <Separator className="my-2" />

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className={sectionLabel}>Hình thức giao</Label>
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
                  <Label htmlFor="requested-date" className={sectionLabel}>
                    Thời gian khách hẹn giao
                  </Label>
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
                      <Label htmlFor="recipient-name" className={sectionLabel}>
                        Người nhận
                      </Label>
                      <Input
                        id="recipient-name"
                        value={recipientName}
                        onChange={(event) => setRecipientName(event.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="recipient-phone" className={sectionLabel}>
                        SĐT người nhận
                      </Label>
                      <Input
                        id="recipient-phone"
                        inputMode="tel"
                        value={recipientPhone}
                        onChange={(event) => setRecipientPhone(event.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="delivery-address" className={sectionLabel}>
                        Địa chỉ giao hàng
                      </Label>
                      <Input
                        id="delivery-address"
                        value={deliveryAddress}
                        onChange={(event) => setDeliveryAddress(event.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>

              <Separator className="my-2" />

              <div className="space-y-3 text-base">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="shipping-fee" className={sectionLabel}>
                      Phí giao hàng
                    </Label>
                    <MoneyInput id="shipping-fee" className="text-right" value={shippingFee} onChange={setShippingFee} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="order-discount" className={sectionLabel}>
                      Giảm giá cả đơn
                    </Label>
                    <MoneyInput
                      id="order-discount"
                      className="text-right"
                      value={orderDiscount}
                      onChange={setOrderDiscount}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className={sectionLabel}>Tiền cọc</Label>
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
                    {depositType === "AMOUNT" ? (
                      <MoneyInput
                        className="text-right"
                        aria-label="Giá trị tiền cọc"
                        value={depositValue}
                        onChange={setDepositValue}
                      />
                    ) : (
                      // Theo % là một con số 0-100, không phải tiền: không chèn dấu chấm ngăn cách.
                      <Input
                        type="number"
                        min={0}
                        className="text-right"
                        aria-label="Giá trị tiền cọc"
                        disabled={depositType === "NONE"}
                        value={depositType === "NONE" ? 0 : depositValue}
                        onChange={(event) => setDepositValue(toNumber(event.target.value))}
                      />
                    )}
                  </div>
                  {depositType !== "NONE" && (
                    <div className="grid grid-cols-2 gap-1.5">
                      {(
                        [
                          { method: "CASH", label: "Tiền mặt", Icon: Banknote },
                          { method: "BANK_TRANSFER", label: "Chuyển khoản", Icon: QrCode },
                        ] as const
                      ).map(({ method, label, Icon }) => {
                        const isSelected = depositMethod === method;
                        return (
                          <button
                            key={method}
                            type="button"
                            aria-label={`Hình thức thu cọc: ${label}`}
                            onClick={() => setDepositMethod(method)}
                            className={cn(
                              "flex items-center gap-2 p-3 rounded-lg border text-left cursor-pointer transition-all duration-200",
                              isSelected
                                ? "bg-primary/5 border-primary text-primary font-bold shadow-xs"
                                : "bg-background border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                            )}
                          >
                            <Icon className="size-4 shrink-0" />
                            <span className="text-sm">{label}</span>
                            {isSelected && <Check className="size-3.5 text-primary shrink-0 ml-auto" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {depositType !== "NONE" && !totals.depositError && depositValue > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Quy đổi: {formatVND(totals.depositAmount)} ({totals.depositPercent}% tổng đơn)
                    </p>
                  )}
                  {totals.depositError && <p className="text-sm text-destructive">{totals.depositError}</p>}
                </div>

                <Separator className="my-2" />

                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">Tiền hàng</span>
                    <span className="font-semibold tabular-nums">{formatVND(totals.goods)}</span>
                  </div>
                  {totals.orderDiscount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Giảm giá cả đơn</span>
                      <span className="font-semibold tabular-nums text-red-500">
                        -{formatVND(totals.orderDiscount)}
                      </span>
                    </div>
                  )}
                  {totals.shippingFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Phí giao hàng</span>
                      <span className="font-semibold tabular-nums">{formatVND(totals.shippingFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">Đã cọc</span>
                    <span className="font-semibold tabular-nums">{formatVND(totals.depositAmount)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-muted-foreground">Còn phải thu</span>
                    <span className="tabular-nums" data-testid="amount-due">
                      {formatVND(totals.amountDue)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-muted-foreground font-bold text-lg">Tổng tiền</span>
                  <span className="font-extrabold text-3xl text-primary tabular-nums" data-testid="grand-total">
                    {formatVND(totals.grandTotal)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Số tạm tính; hệ thống tính lại khi tạo đơn.</p>

                <div className="space-y-1.5">
                  <Label htmlFor="order-note" className={`${sectionLabel} flex items-center gap-1`}>
                    <FileText className="size-4" /> Ghi chú
                  </Label>
                  <Textarea id="order-note" value={note} onChange={(event) => setNote(event.target.value)} />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex-col gap-2 py-4 border-t bg-muted/20 shrink-0">
              <Button
                type="button"
                disabled={submitting}
                onClick={submit}
                className="w-full h-11 text-lg font-bold shadow-md cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Tạo đơn
              </Button>
              {attempted && !valid && (
                <p className="text-center text-sm text-destructive">Còn thông tin chưa hợp lệ ở trên.</p>
              )}
            </CardFooter>
          </Card>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
