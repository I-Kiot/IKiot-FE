"use client";

import * as React from "react";
import { Banknote, Pencil, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { allows } from "@/components/sidebar/constants/role-permissions";
import { getSessionRole } from "@/lib/auth";
import type { OrderDetail, OrderStatus } from "@/types/order-flow";
import { ConfirmRemittanceDialog } from "./confirm-remittance-dialog";
import { EditOrderDialog } from "./edit-order-dialog";
import { OrderHandlingDialog } from "./order-handling-dialog";

/** Where an order can still be edited (A-8): before its goods leave stock. */
const EDITABLE_STATUSES: readonly OrderStatus[] = ["CONFIRMED", "PACKED", "PICKED_UP"];

type Open = "edit" | "handling" | "remittance" | null;

/** The order detail's buttons: edit and hand-over (D-7), confirm the shipper's cash (D-9). Each shows only where its route would accept it. */
export function OrderActions({
  order,
  onChanged,
}: {
  order: OrderDetail;
  onChanged: (order: OrderDetail) => void;
}) {
  const role = getSessionRole();
  const [open, setOpen] = React.useState<Open>(null);

  const editable =
    order.fulfillmentType !== "TAKEAWAY" &&
    EDITABLE_STATUSES.includes(order.status) &&
    allows(role, "orders", "update");
  const awaitingCash =
    order.status === "RECEIVED" &&
    order.collection?.cashRemittanceStatus === "PENDING" &&
    allows(role, "orders", "confirm_cash");

  if (!editable && !awaitingCash) return null;

  const done = (updated: OrderDetail) => {
    setOpen(null);
    onChanged(updated);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {editable && (
        <>
          <Button variant="outline" onClick={() => setOpen("handling")} className="cursor-pointer">
            <UserCog className="size-4" />
            Phụ trách / ưu tiên
          </Button>
          <Button variant="outline" onClick={() => setOpen("edit")} className="cursor-pointer">
            <Pencil className="size-4" />
            Sửa đơn
          </Button>
        </>
      )}
      {awaitingCash && (
        <Button onClick={() => setOpen("remittance")} className="cursor-pointer">
          <Banknote className="size-4" />
          Xác nhận đã nhận tiền
        </Button>
      )}

      {/* Mounted only while open, so each opening starts from the order as it is now. */}
      {open === "edit" && (
        <EditOrderDialog order={order} open onOpenChange={() => setOpen(null)} onSaved={done} />
      )}
      {open === "handling" && (
        <OrderHandlingDialog order={order} open onOpenChange={() => setOpen(null)} onSaved={done} />
      )}
      {open === "remittance" && (
        <ConfirmRemittanceDialog
          order={order}
          open
          onOpenChange={() => setOpen(null)}
          onConfirmed={done}
        />
      )}
    </div>
  );
}
