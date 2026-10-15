"use client";

import * as React from "react";
import { Pencil, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { allows } from "@/components/sidebar/constants/role-permissions";
import { getSessionRole } from "@/lib/auth";
import type { OrderDetail, OrderStatus } from "@/types/order-flow";
import { EditOrderDialog } from "./edit-order-dialog";
import { OrderHandlingDialog } from "./order-handling-dialog";

/** Where an order can still be edited (A-8): before its goods leave stock. */
const EDITABLE_STATUSES: readonly OrderStatus[] = [
  "CONFIRMED",
  "PACKED",
  "PICKED_UP",
];

type Open = "edit" | "handling" | null;

/** The order detail header's buttons: edit and hand-over (D-7). The journey's steps - confirming the shipper's cash (D-9) included - sit under the step bar (`OrderJourneyActions`). Each shows only where its route would accept it. */
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

      {/* Mounted only while open, so each opening starts from the order as it is now. */}
      {open === "edit" && (
        <EditOrderDialog
          order={order}
          open
          onOpenChange={close}
          onSaved={done}
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
