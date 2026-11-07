"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { PermissionButton } from "@/components/permission-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { allows } from "@/components/sidebar/constants/role-permissions";
import { getSessionRole } from "@/lib/auth";
import { orderReturnApi } from "@/lib/api/order-return";
import { getApiErrorBody } from "@/lib/api/error-codes";
import {
  RETURN_CONDITION_LABELS,
  type OrderReturn,
  type ReturnCondition,
} from "@/types/order-flow";
import {
  formatDateTime,
  isOpenReturn,
  returnConditionDisplay,
  returnReasonLabel,
  returnStatusDisplay,
} from "../shared/return-display";

interface ReturnDetailDialogProps {
  orderReturn: OrderReturn | null;
  onOpenChange: (open: boolean) => void;
  /** Bản đơn trả mới nhất từ server sau một thao tác; danh sách thay dòng cũ bằng bản này. */
  onChanged: (updated: OrderReturn) => void;
  canInspect: boolean;
  canCancel: boolean;
}

/**
 * Một đơn trả: các dòng và bước kế tiếp. REQUESTED → "Đã nhận hàng" (receive); INSPECTING → chọn kết quả từng dòng
 * (GOOD về kệ, DAMAGED về kho hàng hỏng) rồi "Xác nhận kiểm hàng" (inspect). Tồn chỉ đổi khi kiểm hàng (contract §5).
 * Cha đặt key theo id và trạng thái đơn trả nên kết quả luôn bắt đầu trống cho mỗi đơn và mỗi bước.
 */
export function ReturnDetailDialog({
  orderReturn,
  onOpenChange,
  onChanged,
  canInspect,
  canCancel,
}: ReturnDetailDialogProps) {
  const [verdicts, setVerdicts] = React.useState<Record<string, ReturnCondition>>({});
  const [busy, setBusy] = React.useState(false);

  if (!orderReturn) return null;
  const status = returnStatusDisplay(orderReturn.status);
  const allJudged = orderReturn.items.every((item) => verdicts[item.orderItemId]);

  async function run(action: () => Promise<OrderReturn>, success: string) {
    setBusy(true);
    try {
      const updated = await action();
      toast.success(success);
      onChanged(updated);
    } catch (error) {
      toast.error(getApiErrorBody(error)?.message ?? "Không thực hiện được thao tác");
    } finally {
      setBusy(false);
    }
  }

  const current = orderReturn;
  // GĐ2 – 3B: damaged goods the customer wants to buy again become a new manual order (D-11).
  const hasDamaged = current.items.some((item) => item.condition === "DAMAGED");
  const role = getSessionRole();
  const canReorder =
    current.status === "COMPLETED" &&
    hasDamaged &&
    !current.replacementOrder;
  const mayReorder = allows(role, "orders", "create") && allows(role, "returns", "create");
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {current.code}
            <Badge variant={status.variant}>{status.label}</Badge>
          </DialogTitle>
          <DialogDescription>
            Đơn{" "}
            <Link href={`/sales/orders/${current.order.id}`} className="font-medium underline">
              {current.order.code ?? current.order.id.slice(0, 8)}
            </Link>{" "}
            · {current.order.customerName} · {returnReasonLabel(current.reason)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
          <span>Tạo lúc: {formatDateTime(current.createdAt)}</span>
          <span>Người tạo: {current.createdBy?.name ?? "—"}</span>
          <span>Nhận hàng: {formatDateTime(current.receivedAt)}</span>
          <span>Người nhận: {current.receivedBy?.name ?? "—"}</span>
          {current.inspectedAt && (
            <>
              <span>Kiểm lúc: {formatDateTime(current.inspectedAt)}</span>
              <span>Người kiểm: {current.inspectedBy?.name ?? "—"}</span>
            </>
          )}
          {current.note && <span className="col-span-2">Ghi chú: {current.note}</span>}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sản phẩm</TableHead>
              <TableHead className="w-16 text-right">SL</TableHead>
              <TableHead className="w-56">Tình trạng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {current.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="font-medium">{item.productName ?? "—"}</div>
                  {item.sku && <div className="text-xs text-muted-foreground">{item.sku}</div>}
                  {item.note && <div className="text-xs text-muted-foreground">{item.note}</div>}
                </TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell>
                  {current.status === "INSPECTING" && canInspect ? (
                    <RadioGroup
                      className="flex gap-4"
                      value={verdicts[item.orderItemId] ?? ""}
                      onValueChange={(value) =>
                        setVerdicts((prev) => ({
                          ...prev,
                          [item.orderItemId]: value as ReturnCondition,
                        }))
                      }
                    >
                      {(["GOOD", "DAMAGED"] as const).map((condition) => (
                        <div key={condition} className="flex items-center gap-2">
                          <RadioGroupItem
                            id={`${item.id}-${condition}`}
                            value={condition}
                          />
                          <Label htmlFor={`${item.id}-${condition}`}>
                            {RETURN_CONDITION_LABELS[condition]}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : item.condition ? (
                    <div className="flex flex-col gap-1">
                      <Badge variant={returnConditionDisplay(item.condition).variant}>
                        {returnConditionDisplay(item.condition).label}
                      </Badge>
                      {item.location && (
                        <span className="text-xs text-muted-foreground">
                          → {item.location.name}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Chưa kiểm</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {current.status === "INSPECTING" && canInspect && (
          <p className="text-xs text-muted-foreground">
            Hàng nguyên vẹn được cộng lại tồn kho ở kho đã xuất. Hàng hỏng được chuyển vào kho hàng
            hỏng của kho đó và không tính vào tồn bán được.
          </p>
        )}

        {current.replacementOrder && (
          <p className="text-sm">
            Đơn mua lại:{" "}
            <Link
              href={`/sales/orders/${current.replacementOrder.id}`}
              className="font-medium underline"
            >
              {current.replacementOrder.code ?? current.replacementOrder.id.slice(0, 8)}
            </Link>
          </p>
        )}

        <DialogFooter className="gap-2">
          {canReorder && (
            <PermissionButton allowed={mayReorder} permission="returns:create" variant="outline" asChild>
              <Link href={`/sales/orders/new?replacementFor=${current.id}`}>Tạo đơn mua lại</Link>
            </PermissionButton>
          )}
          {isOpenReturn(current.status) && (
            <PermissionButton
              allowed={canCancel}
              permission="returns:cancel"
              variant="outline"
              disabled={busy}
              onClick={() =>
                run(() => orderReturnApi.cancel(current.id), "Đã huỷ đơn hoàn")
              }
            >
              Huỷ đơn hoàn
            </PermissionButton>
          )}
          {current.status === "REQUESTED" && (
            <PermissionButton
              allowed={canInspect}
              permission="returns:inspect"
              disabled={busy}
              onClick={() =>
                run(() => orderReturnApi.receive(current.id), "Đã ghi nhận hàng hoàn về shop")
              }
            >
              Đã nhận hàng
            </PermissionButton>
          )}
          {current.status === "INSPECTING" && (
            <PermissionButton
              allowed={canInspect}
              permission="returns:inspect"
              disabled={busy || !allJudged}
              onClick={() =>
                run(
                  () =>
                    orderReturnApi.inspect(current.id, {
                      items: current.items.map((item) => ({
                        orderItemId: item.orderItemId,
                        condition: verdicts[item.orderItemId],
                      })),
                    }),
                  "Đã kiểm hàng và cập nhật tồn kho",
                )
              }
            >
              Xác nhận kiểm hàng
            </PermissionButton>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
