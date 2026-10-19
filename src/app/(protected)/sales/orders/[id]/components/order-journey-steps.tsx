import { Ban, Check, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { isDeliveryFailed, type OrderDetail, type OrderStatus } from "@/types/order-flow";
import { formatDateTime } from "../../shared/order-display";

interface Step {
  status: OrderStatus | "DELIVERY_FAILED";
  label: string;
}

// Journey GĐ1 (docs/hanh-trinh-don-hang.md, "Tóm tắt trạng thái chính"). PENDING_CONFIRMATION
// only exists for marketplace orders; a manual order is born CONFIRMED.
const STEPS: Step[] = [
  { status: "PENDING_CONFIRMATION", label: "Chờ xác nhận" },
  { status: "CONFIRMED", label: "Xác nhận" },
  { status: "PACKED", label: "Đóng đơn" },
  { status: "PICKED_UP", label: "ĐVVC đã lấy hàng" },
  { status: "SHIPPING", label: "Đang vận chuyển" },
  { status: "RECEIVED", label: "Đã nhận hàng" },
  { status: "COMPLETED", label: "Hoàn thành" },
];

/** When each step happened, where the order records it. */
function stepTime(order: OrderDetail, status: Step["status"]): string | null {
  switch (status) {
    case "PENDING_CONFIRMATION":
      return order.createdAt;
    case "CONFIRMED":
      return (
        order.confirmedAt ??
        (order.channel === "MANUAL" ? order.createdAt : null)
      );
    case "SHIPPING":
      return order.shippedAt;
    case "RECEIVED":
      return order.collection?.collectedAt ?? null;
    case "COMPLETED":
      return order.collection?.remittanceConfirmedAt ?? null;
    default:
      return null;
  }
}

/** Where the order is in the journey: done steps ticked, the current one highlighted. */
export function OrderJourneySteps({ order }: { order: OrderDetail }) {
  if (order.status === "CANCELLED") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800/30 dark:bg-red-900/20 dark:text-red-400">
        <Ban className="size-5 shrink-0" />
        <span className="text-sm font-medium">Đơn đã bị huỷ.</span>
      </div>
    );
  }

  // The delivery failed: the order stays SHIPPING while the goods are still out (the shipper may retry),
  // then RETURNED once the shop confirms they are back. The last two steps give way to failed -> returned.
  const failed = isDeliveryFailed(order);
  // Whole order came back after a failed delivery: same track, now finished.
  const returnedAfterFailure =
    order.status === "RETURNED" && order.latestShipmentStatus === "RETURNED";
  const steps = (failed || returnedAfterFailure
    ? [
        ...STEPS.filter((step) => !["RECEIVED", "COMPLETED"].includes(step.status)),
        { status: "DELIVERY_FAILED", label: "Giao hàng không thành công" } satisfies Step,
        { status: "RETURNED", label: "Hoàn trả" } satisfies Step,
      ]
    : STEPS
  ).filter((step) => {
    if (step.status === "PENDING_CONFIRMATION")
      return order.channel !== "MANUAL";
    // QR, or nothing left to collect: SHIPPING goes straight to COMPLETED, no RECEIVED step.
    if (step.status === "RECEIVED") {
      const skipped =
        ["COMPLETED", "RETURNED"].includes(order.status) &&
        order.collection !== null &&
        order.collection.method !== "CASH";
      return !skipped;
    }
    return true;
  });

  // Each step is named for the status the order *reaches*, so status X means step X is done and
  // the step after it is the one in progress - a manual order born CONFIRMED is waiting to be
  // packed. A returned order went all the way first; its returns are listed further down. A
  // finished order (COMPLETED / RETURNED) has every step done - none is still "in progress".
  // A status with no step of its own (PENDING) highlights nothing.
  const finished = order.status === "COMPLETED" || order.status === "RETURNED";
  const reachedIndex = steps.findIndex((step) => step.status === order.status);
  let currentIndex: number;
  if (finished) {
    currentIndex = steps.length;
  } else if (reachedIndex === -1) {
    currentIndex = -1;
  } else {
    currentIndex = reachedIndex + 1;
  }
  if (failed) currentIndex = steps.findIndex((step) => step.status === "DELIVERY_FAILED");

  return (
    <div className="space-y-3">
      <ol className="grid gap-2 sm:grid-flow-col sm:auto-cols-fr">
        {steps.map((step, index) => {
          const done = currentIndex >= 0 && index < currentIndex;
          const current = index === currentIndex;
          // The current step hasn't happened yet, so only done steps carry a time.
          const time = done ? stepTime(order, step.status) : null;
          return (
            <li
              key={step.status}
              className="flex items-center gap-2 sm:flex-col sm:items-start"
            >
              <div className="flex w-full items-center gap-2">
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                    done && "border-primary bg-primary text-primary-foreground",
                    current &&
                      step.status !== "DELIVERY_FAILED" &&
                      "border-primary text-primary ring-4 ring-primary/15",
                    current &&
                      step.status === "DELIVERY_FAILED" &&
                      "border-red-500 bg-red-500 text-white ring-4 ring-red-500/15",
                    !done && !current && "text-muted-foreground",
                  )}
                >
                  {done ? (
                    <Check className="size-4" />
                  ) : current && step.status === "DELIVERY_FAILED" ? (
                    <X className="size-4" />
                  ) : (
                    index + 1
                  )}
                </span>
                {index < steps.length - 1 && (
                  <span
                    className={cn(
                      "hidden h-px flex-1 sm:block",
                      done ? "bg-primary" : "bg-border",
                    )}
                  />
                )}
              </div>
              <div className="flex flex-col">
                <span
                  className={cn(
                    "text-sm",
                    current
                      ? step.status === "DELIVERY_FAILED"
                        ? "font-semibold text-red-600 dark:text-red-400"
                        : "font-semibold text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
                {time && (
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(time)}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {order.status === "RETURNED" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RotateCcw className="size-4" />
          Toàn bộ hàng của đơn đã được hoàn về.
        </div>
      )}
    </div>
  );
}
