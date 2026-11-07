"use client";

import * as React from "react";
import { Ban, Pencil, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { allows } from "@/components/sidebar/constants/role-permissions";
import { getSessionRole } from "@/lib/auth";
import type { OrderDetail, OrderStatus } from "@/types/order-flow";
import { CancelOrderDialog } from "./cancel-order-dialog";
import { EditOrderDialog } from "./edit-order-dialog";
import { OrderHandlingDialog } from "./order-handling-dialog";

/** Đơn còn sửa và huỷ được (A-8, A-5): trước khi hàng rời kho. */
const EDITABLE_STATUSES: readonly OrderStatus[] = [
  "CONFIRMED",
  "PACKED",
  "PICKED_UP",
];

type Open = "edit" | "handling" | "cancel" | null;

/** Nút trên header chi tiết đơn: sửa, huỷ và bàn giao (D-7). Các bước hành trình nằm dưới thanh bước (`OrderJourneyActions`). Mỗi nút chỉ hiện khi route tương ứng chấp nhận. */
export function OrderActions({
  order,
  onChanged,
}: {
  order: OrderDetail;
  onChanged: (order: OrderDetail) => void;
}) {
  const role = getSessionRole();
  const editable =
    order.fulfillmentType !== "TAKEAWAY" &&
    EDITABLE_STATUSES.includes(order.status) &&
    allows(role, "orders", "update");
  const [open, setOpen] = React.useState<Open>(null);

  if (!editable) return null;

  const close = () => setOpen(null);
  const done = (updated: OrderDetail) => {
    close();
    onChanged(updated);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        onClick={() => setOpen("handling")}
        className="cursor-pointer"
      >
        <UserCog className="size-4" />
        Phụ trách / ưu tiên
      </Button>
      <Button
        variant="outline"
        onClick={() => setOpen("edit")}
        className="cursor-pointer"
      >
        <Pencil className="size-4" />
        Sửa đơn
      </Button>
      <Button
        variant="outline"
        onClick={() => setOpen("cancel")}
        className="cursor-pointer text-destructive hover:text-destructive"
      >
        <Ban className="size-4" />
        Huỷ đơn
      </Button>

      {/* Chỉ mount khi mở, để mỗi lần mở lấy đơn ở trạng thái hiện tại. */}
      {open === "edit" && (
        <EditOrderDialog
          order={order}
          open
          onOpenChange={close}
          onSaved={done}
        />
      )}
      {open === "cancel" && (
        <CancelOrderDialog
          order={order}
          open
          onOpenChange={close}
          onCancelled={done}
        />
      )}
      {open === "handling" && (
        <OrderHandlingDialog
          order={order}
          open
          onOpenChange={close}
          onSaved={done}
        />
      )}
    </div>
  );
}
