"use client";

import * as React from "react";
import Link from "next/link";
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
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { allows } from "@/components/sidebar/constants/role-permissions";
import { getSessionRole } from "@/lib/auth";
import { productionRequestApi } from "@/lib/api/production-request";
import { getApiErrorBody } from "@/lib/api/error-codes";
import { personName, type ProductionRequest } from "@/types/order-flow";
import {
  formatDate,
  formatDateTime,
  requestProgress,
  requestStatusDisplay,
} from "../shared/production-display";
import { ProductionRequestFormDialog } from "./production-request-form-dialog";
import { ReceiveProductionDialog } from "./receive-production-dialog";

/** An action that asks first. `close` (finish a partly delivered request short) needs a reason. */
type Pending = "send" | "cancel" | "close" | "delete" | null;

const CONFIRM_COPY: Record<Exclude<Pending, null>, { title: string; body: string; cta: string }> = {
  send: {
    title: "Đánh dấu đã gửi xưởng?",
    body: "Sau khi gửi, yêu cầu không sửa được nữa và thông số các dòng hàng làm riêng bị khoá.",
    cta: "Đã gửi xưởng",
  },
  cancel: {
    title: "Huỷ yêu cầu sản xuất?",
    body: "Chỉ huỷ được khi chưa nhận hàng nào. Số đang đặt sẽ không còn tính vào danh sách cần sản xuất.",
    cta: "Huỷ yêu cầu",
  },
  close: {
    title: "Đóng yêu cầu khi chưa nhận đủ?",
    body: "Phần chưa giao sẽ không còn tính là đang đặt xưởng. Ghi lý do (vd. xưởng không làm tiếp).",
    cta: "Đóng yêu cầu",
  },
  delete: {
    title: "Xoá yêu cầu nháp?",
    body: "Yêu cầu nháp sẽ bị xoá hẳn.",
    cta: "Xoá",
  },
};

type Props = {
  request: ProductionRequest | null;
  onOpenChange: (open: boolean) => void;
  onChanged: (request: ProductionRequest) => void;
  onDeleted: (id: string) => void;
};

/** B-6 · B-7: one production request - its lines, receipts and the next step allowed in its status. */
export function ProductionRequestDetailDialog({
  request,
  onOpenChange,
  onChanged,
  onDeleted,
}: Props) {
  const role = getSessionRole();
  const canUpdate = allows(role, "production_requests", "update");
  const canDelete = allows(role, "production_requests", "delete");
  const canReceive = allows(role, "production", "receive");

  const [pending, setPending] = React.useState<Pending>(null);
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [receiving, setReceiving] = React.useState(false);

  if (!request) return null;

  const status = requestStatusDisplay(request.status, request.closedShort);
  const progress = requestProgress(request);
  const hasReceipts = request.receipts.length > 0;
  const isDraft = request.status === "DRAFT";
  const isOpen = request.status === "SENT" || request.status === "PARTIALLY_RECEIVED";

  async function run(action: Exclude<Pending, null>) {
    if (!request) return;
    setBusy(true);
    try {
      if (action === "delete") {
        await productionRequestApi.remove(request.id);
        toast.success(`Đã xoá ${request.code}`);
        onDeleted(request.id);
      } else {
        const next = { send: "SENT", cancel: "CANCELLED", close: "COMPLETED" } as const;
        const updated = await productionRequestApi.updateStatus(request.id, {
          status: next[action],
          note: reason.trim() || undefined,
        });
        toast.success("Đã cập nhật yêu cầu sản xuất");
        onChanged(updated);
      }
      setPending(null);
      setReason("");
    } catch (error) {
      toast.error(getApiErrorBody(error)?.message ?? "Không thực hiện được");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Dialog open={!editing && !receiving && !pending} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {request.code}
              <Badge variant={status.variant}>{status.label}</Badge>
            </DialogTitle>
            <DialogDescription>
              {request.supplier.supplierName}
              {request.supplier.phoneNumber ? ` · ${request.supplier.phoneNumber}` : ""} → giao về{" "}
              {request.location.name}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            <div>
              <span className="text-muted-foreground">Hẹn xong: </span>
              {formatDate(request.expectedReadyDate)}
            </div>
            <div>
              <span className="text-muted-foreground">Đã nhận: </span>
              {progress.received}/{progress.ordered}
            </div>
            <div>
              <span className="text-muted-foreground">Người lập: </span>
              {personName(request.createdBy) || "-"} · {formatDateTime(request.createdAt)}
            </div>
            <div>
              <span className="text-muted-foreground">Gửi xưởng: </span>
              {formatDateTime(request.sentAt)}
            </div>
            {request.note && (
              <div className="whitespace-pre-line sm:col-span-2">
                <span className="text-muted-foreground">Ghi chú: </span>
                {request.note}
              </div>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mặt hàng</TableHead>
                  <TableHead>Cho đơn</TableHead>
                  <TableHead className="text-right">Đã nhận / đặt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {request.items.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>
                      <div className="font-medium">
                        {line.productName}
                        {line.orderItem?.isCustom && (
                          <Badge variant="outline" className="ml-2">
                            Làm riêng
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{line.sku ?? "-"}</div>
                    </TableCell>
                    <TableCell>
                      {line.orderItem ? (
                        <Link
                          href={`/sales/orders/${line.orderItem.orderId}`}
                          className="text-sm underline"
                        >
                          {line.orderItem.orderCode ?? "Xem đơn"}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">Hàng tồn</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {line.receivedQuantity}/{line.quantity}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {hasReceipts && (
            <div className="text-sm">
              <div className="mb-1 font-medium">Các lần nhận hàng</div>
              <ul className="space-y-1 text-muted-foreground">
                {request.receipts.map((receipt) => (
                  <li key={receipt.stockMovementId}>
                    {formatDateTime(receipt.receivedAt)} · {personName(receipt.receivedBy) || "-"} ·{" "}
                    <Link href="/exchange/imports" className="underline">
                      phiếu nhập
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <DialogFooter className="flex-wrap gap-2 sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {isDraft && canDelete && (
                <Button variant="ghost" onClick={() => setPending("delete")}>
                  Xoá
                </Button>
              )}
              {(isDraft || (request.status === "SENT" && !hasReceipts)) && canUpdate && (
                <Button variant="ghost" onClick={() => setPending("cancel")}>
                  Huỷ yêu cầu
                </Button>
              )}
              {request.status === "PARTIALLY_RECEIVED" && canUpdate && (
                <Button variant="ghost" onClick={() => setPending("close")}>
                  Đóng (nhận thiếu)
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {isDraft && canUpdate && (
                <>
                  <Button variant="outline" onClick={() => setEditing(true)}>
                    Sửa
                  </Button>
                  <Button onClick={() => setPending("send")}>Đã gửi xưởng</Button>
                </>
              )}
              {isOpen && canReceive && (
                <Button onClick={() => setReceiving(true)}>Nhận hàng</Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Dialog
        open={!!pending}
        onOpenChange={(next) => {
          if (!next && !busy) {
            setPending(null);
            setReason("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          {pending && (
            <>
              <DialogHeader>
                <DialogTitle>{CONFIRM_COPY[pending].title}</DialogTitle>
                <DialogDescription>{CONFIRM_COPY[pending].body}</DialogDescription>
              </DialogHeader>
              {(pending === "close" || pending === "cancel") && (
                <div className="grid gap-1">
                  <Label>Lý do{pending === "close" ? " *" : ""}</Label>
                  <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
                </div>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPending(null);
                    setReason("");
                  }}
                  disabled={busy}
                >
                  Thôi
                </Button>
                <Button
                  variant={pending === "delete" || pending === "cancel" ? "destructive" : "default"}
                  disabled={busy || (pending === "close" && !reason.trim())}
                  onClick={() => run(pending)}
                >
                  {CONFIRM_COPY[pending].cta}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {editing && (
        <ProductionRequestFormDialog
          open
          request={request}
          onOpenChange={setEditing}
          onSaved={(saved) => {
            setEditing(false);
            onChanged(saved);
          }}
        />
      )}
      {receiving && (
        <ReceiveProductionDialog
          open
          request={request}
          onOpenChange={setReceiving}
          onReceived={(updated) => {
            setReceiving(false);
            onChanged(updated);
          }}
        />
      )}
    </>
  );
}
