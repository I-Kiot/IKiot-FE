"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { stockMovementApi } from "@/lib/api/stock-movement";
import { getStockMovementErrorMessage } from "@/app/(protected)/exchange/shared/stock-movement-error";
import { formatMoneyVnd } from "@/app/(protected)/exchange/shared/movement-detail-validation";
import type { StockMovement } from "@/types/stock-movement";
import { formatDateTime } from "../shared/production-display";

type Props = {
  movementId: string;
  /** Lấy từ dòng "Các lần nhận hàng" đã mở: thời điểm nhận thật, không phải thời điểm tạo phiếu. */
  receivedAt: string | null;
  onClose: () => void;
};

type Loaded =
  | { kind: "ok"; movement: StockMovement }
  | { kind: "error"; message: string };

/**
 * Xem (chỉ đọc) phiếu nhập do một lần nhận hàng xưởng sinh ra: mặt hàng, số nhận, số lỗi, giá và thành tiền.
 * Phiếu này không nằm trong danh sách Nhập hàng (bảng đó chỉ có hàng từ nhà cung cấp), nên đây là chỗ duy nhất xem được giá từng đợt.
 */
export function ImportReceiptDialog({ movementId, receivedAt, onClose }: Props) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    let stale = false;
    stockMovementApi
      .getById(movementId)
      .then((movement) => {
        if (!stale) setLoaded({ kind: "ok", movement });
      })
      .catch((error) => {
        if (stale) return;
        setLoaded({
          kind: "error",
          message: getStockMovementErrorMessage(error, "Không tải được phiếu nhập"),
        });
      });
    return () => {
      stale = true;
    };
  }, [movementId]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Phiếu nhập hàng xưởng</DialogTitle>
          <DialogDescription>
            Nhận lúc {formatDateTime(receivedAt)}
            {loaded?.kind === "ok" && ` · về ${loaded.movement.toLocationName}`}
          </DialogDescription>
        </DialogHeader>

        {loaded === null && (
          <p className="py-8 text-center text-sm text-muted-foreground">Đang tải...</p>
        )}
        {loaded?.kind === "error" && (
          <p className="py-8 text-center text-sm text-destructive">{loaded.message}</p>
        )}
        {loaded?.kind === "ok" && (
          <>
            <div className="max-h-80 overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mặt hàng</TableHead>
                    <TableHead className="text-right">Số nhận</TableHead>
                    <TableHead className="text-right">Lỗi</TableHead>
                    <TableHead className="text-right">Giá nhập</TableHead>
                    <TableHead className="text-right">Thành tiền</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loaded.movement.details.map((line) => {
                    const good = line.receivedQuantity - line.defectQuantity;
                    return (
                      <TableRow key={line.productItemId}>
                        <TableCell>
                          <div className="font-medium">{line.productName}</div>
                          <div className="text-xs text-muted-foreground">{line.sku || "-"}</div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {line.receivedQuantity}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {line.defectQuantity}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMoneyVnd(line.importPrice)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMoneyVnd(good * line.importPrice)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
              <span className="text-sm text-muted-foreground">Tổng tiền (chỉ tính hàng đạt)</span>
              <span className="font-semibold tabular-nums">
                {formatMoneyVnd(loaded.movement.totalPrice)}
              </span>
            </div>
            {loaded.movement.note && (
              <p className="whitespace-pre-line text-sm text-muted-foreground">
                {loaded.movement.note}
              </p>
            )}
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
