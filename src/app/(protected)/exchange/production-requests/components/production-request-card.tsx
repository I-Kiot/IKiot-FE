"use client";

import { useState } from "react";
import {
  CircleSlash,
  PackageCheck,
  Pencil,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatDateTime } from "@/lib/utils";
import { safeImageSrc } from "@/app/(protected)/products/_constants/product.constants";
import {
  PRODUCTION_REQUEST_STATUS_LABELS,
  personName,
  type ProductionRequest,
} from "@/types/order-flow";
import { useProduction } from "./production-provider";
import { STATUS_BADGE, formatDay } from "./production-format";

/** One production request with every action its status allows - shown inside a product row, so the whole lifecycle (send, receive, close short, cancel) happens from the one screen. A request can carry several SKUs; `focusProductItemId` highlights the row's own line. */
export function ProductionRequestCard({
  request,
  focusProductItemId,
}: {
  request: ProductionRequest;
  focusProductItemId?: string;
}) {
  const { can, setDialog, send, cancel, remove } = useProduction();
  const [busy, setBusy] = useState(false);
  const hasReceipts = request.items.some((line) => line.receivedQuantity > 0);
  const act = async (work: () => Promise<void>) => {
    setBusy(true);
    try {
      await work();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2 rounded-md border bg-background p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">{request.code}</span>
        <Badge variant={STATUS_BADGE[request.status]}>
          {PRODUCTION_REQUEST_STATUS_LABELS[request.status]}
          {request.closedShort ? " (đóng thiếu)" : ""}
        </Badge>
        <span>{request.supplier.supplierName}</span>
        <span className="text-muted-foreground">
          → {request.location.name} · hẹn xong{" "}
          {formatDay(request.expectedReadyDate)}
          {request.sentAt ? ` · gửi ${formatDateTime(request.sentAt)}` : ""}
        </span>
      </div>

      <div className="overflow-hidden rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Sản phẩm</th>
              <th className="px-3 py-2 text-right font-medium">Đã đặt</th>
              <th className="px-3 py-2 text-right font-medium">Đã nhận</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {request.items.map((line) => (
              <tr
                key={line.id}
                className={cn(
                  !!focusProductItemId &&
                    line.productItemId !== focusProductItemId &&
                    "text-muted-foreground",
                )}
              >
                <td className="px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={safeImageSrc(line.imageUrl)}
                      alt=""
                      className="size-9 shrink-0 rounded-md border bg-muted object-cover"
                      loading="lazy"
                    />
                    <div className="min-w-0">
                      <div className="truncate font-medium leading-snug">
                        {line.productName}
                        {line.orderItem?.isCustom ? (
                          <Badge variant="secondary" className="ml-2">
                            Làm riêng
                          </Badge>
                        ) : null}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {line.sku ? `SKU: ${line.sku}` : ""}
                        {line.orderItem?.orderCode
                          ? `${line.sku ? " · " : ""}đơn ${line.orderItem.orderCode}`
                          : ""}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {line.quantity}
                </td>
                <td
                  className={cn(
                    "px-3 py-2 text-right tabular-nums",
                    line.receivedQuantity >= line.quantity &&
                      "text-emerald-600",
                  )}
                >
                  {line.receivedQuantity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {request.note ? (
        <p className="whitespace-pre-line text-muted-foreground">
          Ghi chú: {request.note}
        </p>
      ) : null}
      {request.receipts.length > 0 ? (
        <p className="text-muted-foreground">
          Đã nhận {request.receipts.length} lần, gần nhất{" "}
          {formatDateTime(
            request.receipts[request.receipts.length - 1].receivedAt,
          )}{" "}
          bởi{" "}
          {personName(request.receipts[request.receipts.length - 1].receivedBy)}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        {request.status === "DRAFT" && can.delete ? (
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            disabled={busy}
            onClick={() => act(() => remove(request.id))}
          >
            <Trash2 /> Xoá nháp
          </Button>
        ) : null}
        {(request.status === "DRAFT" || request.status === "SENT") &&
        !hasReceipts &&
        can.update ? (
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            disabled={busy}
            onClick={() => act(() => cancel(request.id))}
          >
            <X /> Huỷ yêu cầu
          </Button>
        ) : null}
        {request.status === "PARTIALLY_RECEIVED" && can.update ? (
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            disabled={busy}
            onClick={() => setDialog({ kind: "closeShort", request })}
          >
            <CircleSlash /> Đóng, bỏ phần còn lại
          </Button>
        ) : null}
        {request.status === "DRAFT" && can.update ? (
          <>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              disabled={busy}
              onClick={() => setDialog({ kind: "edit", request })}
            >
              <Pencil /> Sửa
            </Button>
            <Button
              size="sm"
              className="cursor-pointer"
              disabled={busy}
              onClick={() => act(() => send(request.id))}
            >
              <Send /> Đã gửi xưởng
            </Button>
          </>
        ) : null}
        {(request.status === "SENT" ||
          request.status === "PARTIALLY_RECEIVED") &&
        can.receive ? (
          <Button
            size="sm"
            className="cursor-pointer"
            disabled={busy}
            onClick={() => setDialog({ kind: "receive", request })}
          >
            <PackageCheck /> Nhận hàng xưởng
          </Button>
        ) : null}
      </div>
    </div>
  );
}
