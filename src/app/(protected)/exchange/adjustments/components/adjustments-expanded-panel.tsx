"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  CalendarDays,
  CheckCircle,
  Plus,
  Trash2,
  User,
  Warehouse,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MovementDetailHeader } from "@/app/(protected)/exchange/shared/movement-detail-header";
import { MovementOrderNote } from "@/app/(protected)/exchange/shared/movement-order-note";
import { CancelConfirmDialog } from "@/app/(protected)/exchange/shared/cancel-confirm-dialog";
import {
  InfoItem,
  ProductPickerField,
  ProductSummary,
} from "@/app/(protected)/exchange/shared/form-fields";
import { MovementProductSearch } from "@/app/(protected)/exchange/shared/movement-product-search";
import { QuantityStepper } from "@/app/(protected)/exchange/shared/quantity-stepper";
import { useStockMovementDetail } from "@/app/(protected)/exchange/shared/use-stock-movement-detail";
import { getAuthScope } from "@/app/(protected)/exchange/shared/auth-scope";
import { stockMovementApi } from "@/lib/api/stock-movement";
import {
  formatQtyChange,
  getAdjustQtyChange,
  sumAdjustQtyChange,
} from "@/app/(protected)/exchange/shared/qty";
import type {
  StockMovement,
  StockMovementProductItemOption,
} from "@/types/stock-movement";
import { cn } from "@/lib/utils";
import { useAdjustments } from "./adjustments-provider";

function QtyChangeCell({ value }: { value: number }) {
  return (
    <span
      className={cn(
        "tabular-nums font-semibold",
        value > 0
          ? "text-green-600 dark:text-green-400"
          : value < 0
            ? "text-red-600 dark:text-red-400"
            : "",
      )}
    >
      {formatQtyChange(value)}
    </span>
  );
}

type EditRow = {
  productItemId: string;
  quantity: number;
  receivedQuantity: number;
  note?: string;
};

export function AdjustmentsExpandedPanel({
  request,
  isExpanded,
  onClose,
}: {
  request: StockMovement;
  isExpanded: boolean;
  onClose?: () => void;
}) {
  const { detail, loading, refreshDetail } = useStockMovementDetail(
    request,
    isExpanded,
  );
  const { handleUpdateDetails, handleApprove, handleCancel } = useAdjustments();
  const authScope = getAuthScope();

  const [editRows, setEditRows] = useState<EditRow[]>([]);
  const [products, setProducts] = useState<StockMovementProductItemOption[]>(
    [],
  );
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const isPending = detail.status === "PENDING";
  const isCompleted = detail.status === "COMPLETED";
  const isCancelled = detail.status === "CANCELLED";

  const matchesFromLocation =
    (detail.fromLocationType === "warehouse" &&
      !!authScope.warehouseId &&
      detail.fromLocationId === authScope.warehouseId) ||
    (detail.fromLocationType === "branch" &&
      !!authScope.branchId &&
      detail.fromLocationId === authScope.branchId);
  const isTenantOwner = authScope.role === "TENANT_OWNER";
  const canActAsFrom = isTenantOwner || matchesFromLocation;
  const canEditPending = isPending && canActAsFrom;

  useEffect(() => {
    if (!isExpanded || !isPending) {
      setEditRows([]);
      return;
    }
    setEditRows(
      detail.details.map((d) => ({
        productItemId: d.productItemId,
        quantity: d.quantity,
        receivedQuantity: d.receivedQuantity,
        note: d.note,
      })),
    );
  }, [isExpanded, isPending, detail]);

  useEffect(() => {
    if (!isExpanded || !canEditPending || !detail.fromLocationId) return;
    stockMovementApi
      .getProductItemsAtSource(
        detail.fromLocationId,
        detail.fromLocationType ?? "warehouse",
      )
      .then(setProducts)
      .catch(() => setProducts([]));
  }, [
    isExpanded,
    canEditPending,
    detail.fromLocationId,
    detail.fromLocationType,
  ]);

  const displayDetails = canEditPending ? editRows : detail.details;
  const totalQtyChange = sumAdjustQtyChange(
    displayDetails.map((d) => ({
      quantity: d.quantity,
      receivedQuantity: d.receivedQuantity,
    })),
  );

  const run = async (fn: () => Promise<void>) => {
    setIsActionLoading(true);
    try {
      await fn();
      await refreshDetail();
    } finally {
      setIsActionLoading(false);
    }
  };

  const onSaveDetails = async () => {
    const rows = editRows.filter((r) => r.productItemId);
    if (rows.length === 0) {
      toast.error("Cần ít nhất 1 mặt hàng");
      return;
    }
    const ids = rows.map((r) => r.productItemId);
    if (new Set(ids).size !== ids.length) {
      toast.error("Không được chọn trùng hàng hóa");
      return;
    }
    if (rows.every((r) => getAdjustQtyChange(r.quantity, r.receivedQuantity) === 0)) {
      toast.error("Tồn thực tế không thay đổi");
      return;
    }
    await run(() =>
      handleUpdateDetails(
        detail.id,
        rows.map((r) => ({
          productItemId: r.productItemId,
          receivedQuantity: r.receivedQuantity,
          note: r.note?.trim() || undefined,
        })),
      ),
    );
  };

  const onApprove = async () => {
    const rows = editRows.filter((r) => r.productItemId);
    if (rows.length === 0) {
      toast.error("Cần ít nhất 1 mặt hàng");
      return;
    }
    const ids = rows.map((r) => r.productItemId);
    if (new Set(ids).size !== ids.length) {
      toast.error("Không được chọn trùng hàng hóa");
      return;
    }
    if (rows.every((r) => getAdjustQtyChange(r.quantity, r.receivedQuantity) === 0)) {
      toast.error("Không thể duyệt khi không có thay đổi tồn");
      return;
    }

    // Doc: sửa nháp rồi duyệt - lưu editRows trước để BE duyệt đúng dữ liệu mới nhất.
    await run(async () => {
      await handleUpdateDetails(
        detail.id,
        rows.map((r) => ({
          productItemId: r.productItemId,
          receivedQuantity: r.receivedQuantity,
          note: r.note?.trim() || undefined,
        })),
      );
      await handleApprove(detail.id);
    });
  };

  if (!isExpanded) return null;

  if (loading) {
    return (
      <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-md" />
      </div>
    );
  }

  const locLabel =
    detail.fromLocationType === "warehouse" ? "Kho" : "Chi nhánh";

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm animate-in fade-in-0 duration-200">
      <MovementDetailHeader
        movementId={detail.id}
        title={`Điều chỉnh tồn kho - ${detail.fromLocationName || "-"}`}
        subtitle={locLabel}
        status={detail.status}
        movementType={detail.movementType}
        onClose={onClose}
      />

      <div className="mb-4 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
        <InfoItem
          icon={<Warehouse className="size-4" />}
          label="Kho / Chi nhánh"
          value={`${detail.fromLocationName ?? "-"} (${locLabel})`}
        />
        <InfoItem
          icon={<User className="size-4" />}
          label="Người thực hiện"
          value={detail.requestedByName || "-"}
        />
        <InfoItem
          icon={<CalendarDays className="size-4" />}
          label="Ngày tạo"
          value={
            detail.createdAt
              ? format(new Date(detail.createdAt), "dd/MM/yyyy HH:mm", {
                  locale: vi,
                })
              : "-"
          }
        />
      </div>

      <MovementOrderNote note={detail.note} />

      {canEditPending ? (
        <MovementProductSearch
          className="mb-3"
          usedIds={
            new Set(editRows.map((r) => r.productItemId).filter(Boolean))
          }
          onPick={(item) => {
            setEditRows((prev) => {
              if (prev.some((r) => r.productItemId === item.id)) return prev;
              const emptyIdx = prev.findIndex((r) => !r.productItemId);
              const row = {
                productItemId: item.id,
                quantity: item.stock ?? 0,
                receivedQuantity:
                  typeof item.stock === "number" ? item.stock : 0,
                note: "",
              };
              if (emptyIdx >= 0) {
                return prev.map((r, i) => (i === emptyIdx ? row : r));
              }
              return [...prev, row];
            });
          }}
          searchScope="list"
          poolProducts={products}
          metaMode="stock"
          placeholder="Tìm hàng tại kho / chi nhánh đang điều chỉnh..."
        />
      ) : null}

      <div className="mb-4 rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hàng hóa</TableHead>
              <TableHead className="text-right w-28">Tồn HT</TableHead>
              <TableHead className="text-right w-32">Tồn thực tế</TableHead>
              <TableHead className="text-right w-28">Chênh lệch</TableHead>
              <TableHead>Ghi chú dòng</TableHead>
              {canEditPending && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {canEditPending
              ? editRows.map((row, idx) => {
                  const usedIds = new Set(
                    editRows
                      .map((r) => r.productItemId)
                      .filter(Boolean),
                  );
                  const pickerProducts = products.filter(
                    (p) =>
                      p.id === row.productItemId || !usedIds.has(p.id),
                  );
                  const diff = getAdjustQtyChange(
                    row.quantity,
                    row.receivedQuantity,
                  );
                  return (
                    <TableRow key={`${row.productItemId || "new"}-${idx}`}>
                      <TableCell className="max-w-0 min-w-[14rem] align-top whitespace-normal overflow-hidden">
                        <ProductPickerField
                          products={pickerProducts}
                          value={row.productItemId}
                          metaMode="stock"
                          placeholder="Chọn mặt hàng"
                          onValueChange={(value) => {
                            const p = products.find((x) => x.id === value);
                            setEditRows((prev) =>
                              prev.map((r, i) =>
                                i === idx
                                  ? {
                                      ...r,
                                      productItemId: value,
                                      quantity: p?.stock ?? r.quantity,
                                      receivedQuantity:
                                        typeof p?.stock === "number"
                                          ? p.stock
                                          : r.receivedQuantity,
                                    }
                                  : r,
                              ),
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell className="align-top text-right tabular-nums">
                        {row.quantity.toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell className="align-top whitespace-normal">
                        <QuantityStepper
                          className="ml-auto"
                          min={0}
                          value={row.receivedQuantity}
                          onChange={(next) =>
                            setEditRows((prev) =>
                              prev.map((r, i) =>
                                i === idx
                                  ? { ...r, receivedQuantity: next }
                                  : r,
                              ),
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <QtyChangeCell value={diff} />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="h-9"
                          value={row.note ?? ""}
                          placeholder="Ghi chú"
                          onChange={(e) =>
                            setEditRows((prev) =>
                              prev.map((r, i) =>
                                i === idx
                                  ? { ...r, note: e.target.value }
                                  : r,
                              ),
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          disabled={editRows.length <= 1}
                          onClick={() =>
                            setEditRows((prev) =>
                              prev.filter((_, i) => i !== idx),
                            )
                          }
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              : detail.details.map((item) => {
                  const diff = getAdjustQtyChange(
                    item.quantity,
                    item.receivedQuantity,
                  );
                  const product = products.find(
                    (p) => p.id === item.productItemId,
                  );
                  return (
                    <TableRow key={item.productItemId}>
                      <TableCell className="align-top min-w-[14rem]">
                        <ProductSummary
                          name={item.productName}
                          sku={item.sku}
                          product={product}
                          metaMode="stock"
                        />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {item.quantity.toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {item.receivedQuantity.toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-right">
                        <QtyChangeCell value={diff} />
                      </TableCell>
                      <TableCell className="max-w-[14rem] text-sm text-muted-foreground whitespace-pre-wrap break-words">
                        {item.note || "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
            <TableRow className="bg-muted/30">
              <TableCell
                className="font-semibold"
                colSpan={3}
              >
                Tổng thay đổi
              </TableCell>
              <TableCell className="text-right">
                <QtyChangeCell value={totalQtyChange} />
              </TableCell>
              <TableCell />
              {canEditPending && <TableCell />}
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {canEditPending && (
        <div className="mb-3 space-y-3">
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() =>
                setEditRows((prev) => [
                  ...prev,
                  {
                    productItemId: "",
                    quantity: 0,
                    receivedQuantity: 0,
                    note: "",
                  },
                ])
              }
            >
              <Plus className="mr-1 size-4" />
              Thêm mặt hàng
            </Button>
          </div>
          <Button
            className="w-full cursor-pointer"
            onClick={() => void onSaveDetails()}
            disabled={isActionLoading}
          >
            Lưu chi tiết kiểm kê
          </Button>
        </div>
      )}

      {canEditPending && (
        <div className="flex gap-3">
          <Button
            className="flex-1 cursor-pointer"
            onClick={() => void onApprove()}
            disabled={isActionLoading}
          >
            <CheckCircle className="mr-2 size-4" />
            Duyệt điều chỉnh
          </Button>
          <Button
            variant="outline"
            className="flex-1 cursor-pointer"
            onClick={() => setCancelConfirmOpen(true)}
            disabled={isActionLoading}
          >
            <XCircle className="mr-2 size-4" />
            Huỷ phiếu
          </Button>
        </div>
      )}

      <CancelConfirmDialog
        open={cancelConfirmOpen}
        onOpenChange={setCancelConfirmOpen}
        title="Xác nhận huỷ phiếu kiểm kê"
        description="Bạn có chắc muốn huỷ phiếu điều chỉnh này? Thao tác không thể hoàn tác."
        confirmLabel="Huỷ phiếu"
        isLoading={isActionLoading}
        onConfirm={async () => {
          await run(() => handleCancel(detail.id));
          setCancelConfirmOpen(false);
        }}
      />

      {isCompleted && (
        <p className="rounded-lg border bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-700 dark:text-green-400">
          Tồn kho đã được điều chỉnh thành công.
        </p>
      )}
      {isCancelled && (
        <p className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
          Phiếu điều chỉnh đã bị huỷ.
        </p>
      )}
      {isPending && canActAsFrom && (
        <p className="mt-3 text-xs text-muted-foreground">
          Phiếu đang chờ duyệt.
        </p>
      )}

      <Separator className="mt-4" />
    </div>
  );
}
