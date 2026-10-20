"use client";

import * as React from "react";
import { PAST_DATE_MESSAGE, isPastDate, todayIso } from "@/lib/date-input";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Banknote, Check, FileText, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckoutTabs } from "@/app/(protected)/check-out/components/checkout-tabs";
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
import {
  computeTotals,
  formatVND,
  type DepositType,
} from "../shared/order-totals";
import { CustomerPicker, type PickedCustomer } from "./customer-picker";
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
function OrderDraftForm({
  sales,
  withReplacement = true,
  tabs,
}: {
  sales: SalesBranch;
  /** Tab strip rendered at the top of the product card, same place as in the direct-sale tab. */
  tabs?: React.ReactNode;
  /** Only one tab may consume `?replacementFor=`, or every extra tab would prefill the same return. */
  withReplacement?: boolean;
}) {
  const { branches, branchId, setBranchId } = sales;
  const router = useRouter();
  // D-11: a buy-again order for the damaged goods of a return - prefilled, then linked to it on create.
  const replacementParam = useSearchParams().get("replacementFor");
  const replacementFor = withReplacement ? replacementParam : null;
  const [replacementOf, setReplacementOf] = React.useState<{
    id: string;
    code: string;
  } | null>(null);

  const [assignees, setAssignees] = React.useState<AssigneeOption[]>([]);
  const [optionsReady, setOptionsReady] = React.useState(false);

  const [customer, setCustomer] = React.useState<PickedCustomer | null>(null);
  const [assigneeId, setAssigneeId] = React.useState("");
  const [fulfillment, setFulfillment] =
    React.useState<FulfillmentChoice>("HOME_DELIVERY");
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
  const [depositMethod, setDepositMethod] =
    React.useState<DepositMethod>("CASH");
  const [note, setNote] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [attempted, setAttempted] = React.useState(false);
  const keySeq = React.useRef(0);

  React.useEffect(() => {
    let stale = false;
    const me = getCachedUser() as {
      id?: string;
      fullName?: string;
      firstName?: string;
      lastName?: string;
    } | null;
    staffApi
      .getActiveForScheduleOptions()
      .catch(() => [])
      .then((staffList) => {
        if (stale) return;
        const staff = staffList.map((s) => ({
          id: s.id,
          name: s.fullName || s.phoneNumber,
        }));
        // The account creating the order can be its person in charge too (a shop owner is not in the staff list).
        const mine: AssigneeOption[] =
          me?.id && !staff.some((s) => s.id === me.id)
            ? [
                {
                  id: me.id,
                  name: `${me.fullName || [me.lastName, me.firstName].filter(Boolean).join(" ") || "Tôi"} (tôi)`,
                },
              ]
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

  const customerError = customer ? undefined : "Chọn một khách hàng hoặc thêm khách mới.";
  const errors = {
    customer: customerError,
    branch: branchId ? undefined : "Chọn nơi bán.",
    assignee: assigneeId ? undefined : "Chọn người phụ trách đơn.",
    lines: lines.length > 0 ? undefined : "Đơn hàng cần ít nhất một mặt hàng.",
    deposit: totals.depositError ?? undefined,
    requestedDate: isPastDate(requestedDate) ? PAST_DATE_MESSAGE : undefined,
  };
  const valid =
    !errors.customer &&
    !errors.branch &&
    !errors.assignee &&
    !errors.lines &&
    !errors.deposit &&
    !errors.requestedDate;

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
        const original = await customerApi
          .getById(order.customer.id)
          .catch(() => null);
        if (stale) return;
        const byLine = new Map(order.items.map((line) => [line.id, line]));
        const damaged = orderReturn.items.filter(
          (item) => item.condition === "DAMAGED",
        );
        setReplacementOf({ id: orderReturn.id, code: orderReturn.code });
        if (original) setCustomer(original);
        setBranchId(order.branch.id);
        if (order.assignee) {
          const person = { id: order.assignee.id, name: order.assignee.name };
          setAssignees((prev) =>
            prev.some((a) => a.id === person.id) ? prev : [person, ...prev],
          );
          setAssigneeId(person.id);
        }
        if (
          order.fulfillmentType === "HOME_DELIVERY" ||
          order.fulfillmentType === "STORE_PICKUP"
        ) {
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
        if (!stale)
          toast.error(
            getApiErrorBody(error)?.message ?? "Không tải được đơn hoàn",
          );
      }
    })();
    return () => {
      stale = true;
    };
  }, [replacementFor, optionsReady, setBranchId]);

  const handleCustomer = (next: PickedCustomer | null) => {
    setCustomer(next);
    if (next) {
      setRecipientName((current) => current || next.name);
      setRecipientPhone((current) => current || next.phone || "");
      setDeliveryAddress((current) => current || next.address || "");
    }
  };

  async function submit() {
    setAttempted(true);
    if (!valid || !customer) return;
    const payload: CreateOrderJourneyPayload = {
      branchId,
      assigneeId,
      fulfillmentType: fulfillment,
      priority,
      items: lines.map((line) => ({
        productItemId: line.productItemId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        ...(line.discountAmount > 0
          ? { discountAmount: line.discountAmount }
          : {}),
        ...(line.customization ? { customization: line.customization } : {}),
      })),
      customerId: customer.id,
      ...(shippingFee > 0 ? { shippingFee } : {}),
      ...(orderDiscount > 0
        ? { discountType: "ORDER" as const, discountValue: orderDiscount }
        : {}),
      ...(depositType !== "NONE" && depositValue > 0
        ? {
            deposit: {
              type: depositType,
              value: depositValue,
              method: depositMethod,
            },
          }
        : {}),
      ...(fulfillment === "HOME_DELIVERY" && recipientName.trim()
        ? { recipientName: recipientName.trim() }
        : {}),
      ...(fulfillment === "HOME_DELIVERY" && recipientPhone.trim()
        ? { recipientPhone: recipientPhone.trim() }
        : {}),
      ...(fulfillment === "HOME_DELIVERY" && deliveryAddress.trim()
        ? { deliveryAddress: deliveryAddress.trim() }
        : {}),
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
            toast.warning(
              `Đơn đã tạo nhưng chưa gắn được vào đơn hoàn ${replacementOf.code}`,
            ),
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
    (product: {
      id: string;
      name: string;
      sku: string;
      retailPrice: number;
      stock: number;
    }) => {
      setLines((current) => {
        const existing = current.find(
          (line) =>
            line.productItemId === product.id &&
            line.unitPrice === product.retailPrice &&
            !line.customization,
        );
        if (existing) {
          return current.map((line) =>
            line.key === existing.key
              ? { ...line, quantity: line.quantity + 1 }
              : line,
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

  const show = (message: string | undefined) =>
    attempted ? message : undefined;
  const totalQuantity = lines.reduce((acc, line) => acc + line.quantity, 0);
  const sectionLabel = "text-sm font-medium text-muted-foreground";

  return (
    // Bố cục trang thường, cuộn dọc (2026-10-16): trước đây là hai khung kéo giãn sao từ màn bán tại quầy, mở sidebar
    // là giỏ hàng và khung thông tin cùng bị ép. Giờ: sản phẩm rộng hết trang, thông tin chia thẻ, thanh "Tạo đơn" luôn
    // ở đáy màn hình.
    <div className="flex w-full flex-col gap-4 pb-24">
      <Card className="gap-3 py-4">
        <CardHeader className="px-4 pb-0">
          <CardTitle className="flex items-center justify-between text-base">
            <span>Sản phẩm</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-sm font-semibold text-primary">
              {lines.length} dòng · {totalQuantity} món
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 px-4">
          {tabs}
          {replacementOf && (
            <p className="text-sm text-muted-foreground">
              Mua lại hàng hỏng của đơn hoàn{" "}
              <span className="font-semibold">{replacementOf.code}</span>
            </p>
          )}
          <ProductSearch
            onProductSelect={(product) =>
              addProduct({ ...product, id: product.id })
            }
            location={stockLocation}
            allowOutOfStock
            hideQuickItems
          />
          <p className="text-xs text-muted-foreground">
            Tồn kho chỉ để tham khảo
            {stockLocation ? ` (tại kho xuất mặc định của chi nhánh)` : ""}: đơn
            vẫn tạo được khi hết hàng, hàng thiếu sẽ được đặt xưởng sau.
          </p>
          <OrderCartLines
            lines={lines}
            onChange={setLines}
            error={show(errors.lines)}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="gap-3 py-4">
          <CardHeader className="px-4 pb-0">
            <CardTitle className="text-base">
              Khách hàng &amp; phụ trách
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 px-4">
            <div className="space-y-1.5">
              <Label className={sectionLabel}>Khách hàng</Label>
              <CustomerPicker
                value={customer}
                onChange={handleCustomer}
                error={show(errors.customer)}
              />
            </div>
            <div className="space-y-4">
              <SalesBranchSelect sales={sales} error={show(errors.branch)} />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className={sectionLabel}>
                    Người phụ trách <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={assigneeId}
                    onValueChange={setAssigneeId}
                    disabled={!optionsReady}
                  >
                    <SelectTrigger
                      className="w-full"
                      aria-label="Người phụ trách"
                    >
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
                  {show(errors.assignee) && (
                    <p className="text-sm text-destructive">
                      {errors.assignee}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className={sectionLabel}>Mức ưu tiên</Label>
                  <Select
                    value={priority}
                    onValueChange={(v) => setPriority(v as OrderPriority)}
                  >
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
          </CardContent>
        </Card>
        <Card className="gap-3 py-4">
          <CardHeader className="px-4 pb-0">
            <CardTitle className="text-base">Giao hàng</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className={sectionLabel}>Hình thức giao</Label>
                <Select
                  value={fulfillment}
                  onValueChange={(v) => setFulfillment(v as FulfillmentChoice)}
                >
                  <SelectTrigger
                    className="w-full"
                    aria-label="Hình thức giao hàng"
                  >
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
                  min={todayIso()}
                  value={requestedDate}
                  onChange={(event) => setRequestedDate(event.target.value)}
                />
                {show(errors.requestedDate) && (
                  <p className="text-sm text-destructive">{errors.requestedDate}</p>
                )}
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
                      onChange={(event) =>
                        setRecipientPhone(event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="delivery-address" className={sectionLabel}>
                      Địa chỉ giao hàng
                    </Label>
                    <Input
                      id="delivery-address"
                      value={deliveryAddress}
                      onChange={(event) =>
                        setDeliveryAddress(event.target.value)
                      }
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="gap-3 py-4">
        <CardHeader className="px-4 pb-0">
          <CardTitle className="text-base">Thanh toán</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="shipping-fee" className={sectionLabel}>
                  Phí giao hàng
                </Label>
                <MoneyInput
                  id="shipping-fee"
                  className="text-right"
                  value={shippingFee}
                  onChange={setShippingFee}
                />
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
                <Select
                  value={depositType}
                  onValueChange={(v) => setDepositType(v as DepositType)}
                >
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
                  <div className="relative w-full">
                    <Input
                      type="number"
                      min={0}
                      className="pr-7 text-right [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      aria-label="Giá trị tiền cọc"
                      disabled={depositType === "NONE"}
                      value={depositType === "NONE" ? 0 : depositValue}
                      onChange={(event) =>
                        setDepositValue(toNumber(event.target.value))
                      }
                    />
                    <span
                      aria-hidden
                      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground"
                    >
                      %
                    </span>
                  </div>
                )}
              </div>
              {depositType !== "NONE" && (
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { method: "CASH", label: "Tiền mặt", Icon: Banknote },
                      {
                        method: "BANK_TRANSFER",
                        label: "Chuyển khoản",
                        Icon: QrCode,
                      },
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
                        {isSelected && (
                          <Check className="size-3.5 text-primary shrink-0 ml-auto" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              {depositType !== "NONE" &&
                !totals.depositError &&
                depositValue > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Quy đổi: {formatVND(totals.depositAmount)} (
                    {totals.depositPercent}% tổng đơn)
                  </p>
                )}
              {totals.depositError && (
                <p className="text-sm text-destructive">
                  {totals.depositError}
                </p>
              )}
            </div>

            <Separator className="my-2" />

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">
                  Tiền hàng
                </span>
                <span className="font-semibold tabular-nums">
                  {formatVND(totals.goods)}
                </span>
              </div>
              {totals.orderDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">
                    Giảm giá cả đơn
                  </span>
                  <span className="font-semibold tabular-nums text-red-500">
                    -{formatVND(totals.orderDiscount)}
                  </span>
                </div>
              )}
              {totals.shippingFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">
                    Phí giao hàng
                  </span>
                  <span className="font-semibold tabular-nums">
                    {formatVND(totals.shippingFee)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">
                  Đã cọc
                </span>
                <span className="font-semibold tabular-nums">
                  {formatVND(totals.depositAmount)}
                </span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-muted-foreground">Còn phải thu</span>
                <span className="tabular-nums" data-testid="amount-due">
                  {formatVND(totals.amountDue)}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-muted-foreground font-bold text-base">
                Tổng tiền
              </span>
              <span
                className="text-xl font-bold text-primary tabular-nums"
                data-testid="grand-total"
              >
                {formatVND(totals.grandTotal)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Số tạm tính; hệ thống tính lại khi tạo đơn.
            </p>

            <div className="space-y-1.5">
              <Label
                htmlFor="order-note"
                className={`${sectionLabel} flex items-center gap-1`}
              >
                <FileText className="size-4" /> Ghi chú
              </Label>
              <Textarea
                id="order-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Thanh đáy: luôn thấy tổng và nút tạo đơn, kể cả khi đang ở đầu trang chọn hàng. */}
      <div className="sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center justify-end gap-4 border-t bg-background/95 px-4 py-3 backdrop-blur lg:-mx-6 lg:px-6">
        {attempted && !valid && (
          <p className="mr-auto text-sm text-destructive">
            Còn thông tin chưa hợp lệ ở trên.
          </p>
        )}
        <div className="text-right text-sm">
          <div className="text-muted-foreground">
            {totalQuantity} món · Tổng đơn
          </div>
          <div className="text-base font-bold tabular-nums">
            {formatVND(totals.grandTotal)}
          </div>
        </div>
        <Button
          type="button"
          disabled={submitting}
          onClick={submit}
          className="h-10 min-w-36 cursor-pointer bg-emerald-600 text-base font-bold text-white shadow-md hover:bg-emerald-700"
        >
          Tạo đơn
        </Button>
      </div>
    </div>
  );
}

interface OrderTab {
  id: string;
  tabName: string;
}

/**
 * Several order drafts side by side, like the direct-sale invoices. Every tab keeps its own
 * `OrderDraftForm` mounted (hidden when inactive), so switching never loses what was typed.
 */
export function CreateOrderForm({ sales }: { sales: SalesBranch }) {
  const seq = React.useRef(1);
  const [tabs, setTabs] = React.useState<OrderTab[]>([{ id: "order-1", tabName: "Đơn 1" }]);
  const [activeId, setActiveId] = React.useState("order-1");

  const add = () => {
    seq.current += 1;
    const tab = { id: `order-${seq.current}`, tabName: `Đơn ${seq.current}` };
    setTabs((current) => [...current, tab]);
    setActiveId(tab.id);
  };

  const close = (id: string) => {
    if (tabs.length <= 1) return;
    const index = tabs.findIndex((tab) => tab.id === id);
    const remaining = tabs.filter((tab) => tab.id !== id);
    setTabs(remaining);
    if (activeId === id) setActiveId(remaining[Math.max(0, index - 1)].id);
  };

  const strip = (
    <CheckoutTabs
      tabs={tabs}
      activeTabId={activeId}
      onTabChange={setActiveId}
      onTabAdd={add}
      onTabClose={close}
      addTitle="Thêm đơn hàng mới"
    />
  );

  return (
    <div className="h-full min-h-[40rem]">
      {tabs.map((tab, index) => (
        <div key={tab.id} className={cn("h-full", tab.id !== activeId && "hidden")}>
          {/* Only the first tab consumes ?replacementFor=, or every extra tab would prefill the same return. */}
          <OrderDraftForm sales={sales} withReplacement={index === 0} tabs={strip} />
        </div>
      ))}
    </div>
  );
}
