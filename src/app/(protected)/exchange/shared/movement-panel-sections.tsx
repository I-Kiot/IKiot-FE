"use client";

import {
  type Dispatch,
  type MouseEvent,
  type SetStateAction,
  useMemo,
} from "react";
import { CheckCircle, PackageCheck, Undo2, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuantityStepper } from "@/app/(protected)/exchange/shared/quantity-stepper";
import {
  FieldError,
  MoneyCell,
  MoneyInput,
  ProductPickerField,
  ProductSummary,
} from "@/app/(protected)/exchange/shared/form-fields";
import {
  formatMoneyVnd,
  type OpeningRowFieldErrors,
} from "@/app/(protected)/exchange/shared/movement-detail-validation";
import { resolveItemImportPrice } from "@/lib/api/stock-movement";
import type { OpeningDetailRow } from "@/app/(protected)/exchange/shared/use-stock-movement-detail";
import { MovementProductSearch } from "@/app/(protected)/exchange/shared/movement-product-search";
import { cn } from "@/lib/utils";
import type {
  StockMovement,
  StockMovementProductItemOption,
} from "@/types/stock-movement";

type Mode = "import" | "transfer";

export function MovementDetailsTable({
  mode,
  detail,
  canEditOpening,
  isReceived,
  isInTransit,
  showReceiveForm,
  showReceivedColumn,
  openingDetails,
  openingProducts,
  catalogProducts = [],
  openingRowErrors,
  updateOpeningRow,
  removeOpeningRow,
  pickOpeningProduct,
  ensureOpeningProduct,
  receivedQtys,
  setReceivedQtys,
  totalValue,
  totalQty,
  openingTotalQty,
}: {
  mode: Mode;
  detail: StockMovement;
  canEditOpening: boolean;
  isReceived: boolean;
  isInTransit: boolean;
  showReceiveForm: boolean;
  showReceivedColumn: boolean;
  openingDetails: OpeningDetailRow[];
  openingProducts: StockMovementProductItemOption[];
  /** Catalog tenant - vừa là list dropdown vừa để enrich hiển thị (IMPORT). */
  catalogProducts?: StockMovementProductItemOption[];
  openingRowErrors: OpeningRowFieldErrors[];
  updateOpeningRow: (idx: number, patch: Partial<OpeningDetailRow>) => void;
  removeOpeningRow: (idx: number) => void;
  pickOpeningProduct?: (item: StockMovementProductItemOption) => void;
  ensureOpeningProduct?: (item: StockMovementProductItemOption) => void;
  receivedQtys: Record<string, number>;
  setReceivedQtys: Dispatch<SetStateAction<Record<string, number>>>;
  totalValue: number;
  totalQty: number;
  openingTotalQty: number;
}) {
  const getQty = (id: string, original: number) =>
    receivedQtys[id] ?? original;

  const productById = useMemo(() => {
    const map = new Map<string, StockMovementProductItemOption>();
    for (const p of catalogProducts) map.set(p.id, p);
    for (const p of openingProducts) map.set(p.id, p);
    return map;
  }, [catalogProducts, openingProducts]);

  const usedIds = useMemo(() => {
    const set = new Set<string>();
    for (const d of openingDetails) if (d.productItemId) set.add(d.productItemId);
    return set;
  }, [openingDetails]);

  return (
    <>
      {canEditOpening && pickOpeningProduct ? (
        <MovementProductSearch
          className="mb-3"
          usedIds={usedIds}
          onPick={pickOpeningProduct}
          searchScope={mode === "import" ? "catalog" : "list"}
          poolProducts={openingProducts}
          metaMode={mode === "import" ? "price" : "stock"}
          placeholder={
            mode === "import"
              ? "Tìm hàng theo tên, mã, SKU..."
              : "Tìm hàng tại nơi gửi (có tồn)..."
          }
        />
      ) : null}

      {(() => {
        const qtyLabel = mode === "transfer" ? "SL yêu cầu" : "SL đặt";
        const showImportReceived = mode === "import" && showReceivedColumn;
        const showTransferReceived = mode === "transfer" && showReceivedColumn;
        const gridClass = cn(
          "grid min-w-[56rem] items-start gap-x-3 px-3",
          canEditOpening
            ? showImportReceived
              ? "grid-cols-[minmax(0,1.55fr)_6.75rem_7rem_9.25rem_8.75rem_minmax(8rem,0.9fr)_2.5rem]"
              : showTransferReceived
                ? "grid-cols-[minmax(0,1.55fr)_6.75rem_9.25rem_8.75rem_7rem_minmax(8rem,0.9fr)_2.5rem]"
                : "grid-cols-[minmax(0,1.55fr)_6.75rem_9.25rem_8.75rem_minmax(8rem,0.9fr)_2.5rem]"
            : showImportReceived
              ? "grid-cols-[minmax(0,1.55fr)_6.75rem_7rem_9.25rem_8.75rem_minmax(8rem,0.9fr)]"
              : showTransferReceived
                ? "grid-cols-[minmax(0,1.55fr)_6.75rem_9.25rem_8.75rem_7rem_minmax(8rem,0.9fr)]"
                : "grid-cols-[minmax(0,1.55fr)_6.75rem_9.25rem_8.75rem_minmax(8rem,0.9fr)]",
        );

        return (
          <div className="mb-4 overflow-x-auto rounded-md border">
            <div
              className={cn(
                gridClass,
                "border-b bg-muted/40 py-2.5 text-xs font-medium text-muted-foreground",
              )}
            >
              <div>Hàng hóa</div>
              <div className="text-right">{qtyLabel}</div>
              {showImportReceived ? (
                <div className="text-right">SL thực nhận</div>
              ) : null}
              <>
                  <div className="text-right">Giá nhập</div>
                  <div className="text-right">Thành tiền</div>
                </>
              {showTransferReceived ? (
                <div className="text-right">SL thực nhận</div>
              ) : null}
              <div>Ghi chú dòng</div>
              {canEditOpening ? <div /> : null}
            </div>

            {canEditOpening
              ? openingDetails.map((item, idx) => {
                  const fromDetail = detail.details.find(
                    (d) => d.productItemId === item.productItemId,
                  );
                  const selected = productById.get(item.productItemId);
                  const fallback =
                    !selected && item.productItemId
                      ? {
                          id: item.productItemId,
                          name: fromDetail?.productName || "Đang tải...",
                          sku: fromDetail?.sku || "",
                        }
                      : undefined;
                  const display = selected ?? fallback;
                  const rowErr = openingRowErrors[idx] ?? {};
                  const lineTotal = (item.importPrice ?? 0) * item.quantity;
                  const pickerProducts = openingProducts.filter(
                    (p) =>
                      p.id === item.productItemId || !usedIds.has(p.id),
                  );
                  const selectedProduct = productById.get(item.productItemId);
                  const stockMax =
                    mode === "transfer" &&
                    typeof selectedProduct?.stock === "number"
                      ? selectedProduct.stock
                      : undefined;

                  return (
                    <div
                      key={item.productItemId || "new-" + idx}
                      className={cn(
                        gridClass,
                        "border-b py-2.5 last:border-b-0",
                      )}
                    >
                      <div className="min-w-0 overflow-hidden">
                        <ProductPickerField
                          products={pickerProducts}
                          value={item.productItemId}
                          displayProduct={
                            display &&
                            !pickerProducts.some((p) => p.id === display.id)
                              ? display
                              : undefined
                          }
                          metaMode={mode === "import" ? "price" : "stock"}
                          placeholder="Chọn mặt hàng"
                          onValueChange={(value) => {
                            const product = productById.get(value);
                            if (product) ensureOpeningProduct?.(product);
                            const nextQty =
                              mode === "transfer" &&
                              typeof product?.stock === "number"
                                ? Math.min(
                                    Math.max(1, item.quantity || 1),
                                    Math.max(1, product.stock),
                                  )
                                : item.quantity;
                            updateOpeningRow(idx, {
                              productItemId: value,
                              quantity: nextQty,
                              importPrice: Math.min(
                                Math.max(0, resolveItemImportPrice(product)),
                                1_000_000_000_000,
                              ),
                            });
                          }}
                        />
                        <FieldError message={rowErr.productItemId} />
                      </div>
                      <div className="flex flex-col items-stretch">
                        <QuantityStepper
                          className="w-full max-w-none"
                          min={1}
                          max={stockMax}
                          value={item.quantity}
                          onChange={(next) =>
                            updateOpeningRow(idx, { quantity: next })
                          }
                        />
                        <FieldError message={rowErr.quantity} />
                      </div>
                      <>
                          <div>
                            <MoneyInput
                              className={cn(
                                "h-9 w-full px-2.5 text-right",
                                rowErr.importPrice && "border-destructive",
                              )}
                              value={item.importPrice}
                              onChange={(importPrice) =>
                                updateOpeningRow(idx, { importPrice })
                              }
                            />
                            <FieldError message={rowErr.importPrice} />
                          </div>
                          <div className="flex h-9 items-center justify-end">
                            <MoneyCell value={lineTotal} />
                          </div>
                        </>
                      <div>
                        <Input
                          className="h-9 w-full"
                          value={item.note ?? ""}
                          onChange={(e) =>
                            updateOpeningRow(idx, { note: e.target.value })
                          }
                          placeholder="Ghi chú dòng"
                        />
                      </div>
                      <div className="flex h-9 items-center justify-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeOpeningRow(idx)}
                          disabled={openingDetails.length <= 1}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              : detail.details.map((item) => (
                  <div
                    key={item.productItemId}
                    className={cn(gridClass, "border-b py-2.5 last:border-b-0")}
                  >
                    <div className="min-w-0 overflow-hidden">
                      <ProductSummary
                        name={item.productName}
                        sku={item.sku}
                        product={productById.get(item.productItemId)}
                        metaMode={mode === "import" ? "price" : "stock"}
                      />
                    </div>
                    <div className="flex h-9 items-center justify-end tabular-nums">
                      {item.quantity.toLocaleString("vi-VN")}
                    </div>
                    {mode === "import" && isReceived ? (
                      <div className="flex h-9 items-center justify-end tabular-nums">
                        {(item.receivedQuantity ?? 0).toLocaleString("vi-VN")}
                      </div>
                    ) : null}
                    {mode === "import" && showReceiveForm ? (
                      <div onClick={(e) => e.stopPropagation()}>
                        <QuantityStepper
                          className="w-full max-w-none"
                          min={0}
                          value={getQty(item.productItemId, item.quantity)}
                          onChange={(next) => {
                            setReceivedQtys((prev) => ({
                              ...prev,
                              [item.productItemId]: next,
                            }));
                          }}
                        />
                      </div>
                    ) : null}
                    <>
                        <div className="flex h-9 items-center justify-end">
                          <MoneyCell value={item.importPrice ?? 0} />
                        </div>
                        <div className="flex h-9 items-center justify-end font-medium">
                          <MoneyCell
                            value={(item.importPrice ?? 0) * item.quantity}
                          />
                        </div>
                      </>
                    {mode === "transfer" && isReceived ? (
                      <div className="flex h-9 items-center justify-end tabular-nums">
                        {(item.receivedQuantity ?? 0).toLocaleString("vi-VN")}
                      </div>
                    ) : null}
                    {mode === "transfer" && isInTransit && showReceiveForm ? (
                      <div onClick={(e) => e.stopPropagation()}>
                        <QuantityStepper
                          className="w-full max-w-none"
                          min={0}
                          value={getQty(item.productItemId, item.quantity)}
                          onChange={(next) => {
                            setReceivedQtys((prev) => ({
                              ...prev,
                              [item.productItemId]: next,
                            }));
                          }}
                        />
                      </div>
                    ) : null}
                    <div className="flex min-h-9 items-center break-words text-sm text-muted-foreground whitespace-normal">
                      {item.note || "Không có"}
                    </div>
                  </div>
                ))}

            {mode === "transfer" ? (
              <div
                className={cn(
                  gridClass,
                  "bg-muted/30 py-2.5 text-sm font-semibold",
                )}
              >
                <div>Tổng cộng</div>
                <div className="text-right tabular-nums">
                  {(canEditOpening ? openingTotalQty : totalQty).toLocaleString(
                    "vi-VN",
                  )}
                </div>
                {showReceivedColumn ? <div /> : null}
                <>
                    <div />
                    <div className="text-right">
                      <MoneyCell
                        value={
                          canEditOpening
                            ? openingDetails.reduce(
                                (s, i) =>
                                  s + (i.importPrice ?? 0) * i.quantity,
                                0,
                              )
                            : detail.details.reduce(
                                (s, i) =>
                                  s + (i.importPrice ?? 0) * i.quantity,
                                0,
                              )
                        }
                      />
                    </div>
                  </>
                <div />
                {canEditOpening ? <div /> : null}
              </div>
            ) : null}
          </div>
        );
      })()}

<div className="mb-4 flex justify-end px-1">
        <div className="min-w-0 max-w-full text-right">
          <p className="text-sm text-muted-foreground">Tổng giá trị đơn</p>
          <p
            className="max-w-full truncate text-xl font-bold tabular-nums"
            title={formatMoneyVnd(totalValue)}
          >
            {formatMoneyVnd(totalValue)}
          </p>
        </div>
      </div>
    </>
  );
}

export function MovementActionBar({
  mode,
  isPending,
  isInTransit,
  isReceived,
  canOpenDraft,
  canEditOpening,
  canShipClosed,
  canShipImportPending,
  canReceiveTransit,
  canReturnGoods,
  canCancel,
  showReceiveForm,
  setShowReceiveForm,
  isActionLoading,
  isSender,
  receiveTitle,
  onImportSaveDetails,
  onImportShip,
  onTransferOpen,
  onTransferSaveFromOpening,
  onTransferShipFromOpening,
  onTransferShip,
  onReceive,
  onReturnGoods,
  onCancel,
}: {
  mode: Mode;
  isPending: boolean;
  isInTransit: boolean;
  isReceived: boolean;
  canOpenDraft: boolean;
  canEditOpening: boolean;
  canShipClosed: boolean;
  canShipImportPending: boolean;
  canReceiveTransit: boolean;
  canReturnGoods: boolean;
  canCancel: boolean;
  showReceiveForm: boolean;
  setShowReceiveForm: (v: boolean) => void;
  isActionLoading: boolean;
  isSender: boolean;
  receiveTitle?: string;
  onImportSaveDetails: (e: MouseEvent) => void;
  onImportShip: (e: MouseEvent) => void;
  onTransferOpen: (e: MouseEvent) => void;
  onTransferSaveFromOpening: (e: MouseEvent) => void;
  onTransferShipFromOpening: (e: MouseEvent) => void;
  onTransferShip: (e: MouseEvent) => void;
  onReceive: (e: MouseEvent) => void;
  onReturnGoods: (e: MouseEvent) => void;
  onCancel: (e: MouseEvent) => void;
}) {
  return (
    <>
      {mode === "import" && isPending && canEditOpening && !showReceiveForm && (
        <div className="mb-3">
          <Button
            className="w-full cursor-pointer"
            onClick={onImportSaveDetails}
            disabled={isActionLoading}
          >
            Cập nhật phiếu
          </Button>
        </div>
      )}

      {/* PENDING: chỉ Giao hàng (+ Huỷ). Nhận hàng chỉ sau IN_TRANSIT. */}
      {mode === "import" && isPending && canShipImportPending && (
        <div className="mb-3 flex gap-3">
          <Button
            className="flex-1 cursor-pointer"
            onClick={onImportShip}
            disabled={isActionLoading}
          >
            <CheckCircle className="mr-2 size-4" />
            Giao hàng
          </Button>
          {canCancel && (
            <Button
              variant="outline"
              className="flex-1 cursor-pointer"
              onClick={onCancel}
              disabled={isActionLoading}
            >
              <XCircle className="mr-2 size-4" />
              Huỷ đơn
            </Button>
          )}
        </div>
      )}

      {canOpenDraft && (
        <div className="flex gap-3">
          <Button
            className="flex-1 cursor-pointer"
            onClick={onTransferOpen}
            disabled={isActionLoading}
          >
            <CheckCircle className="mr-2 size-4" />
            Mở phiếu
          </Button>
          {canCancel && (
            <Button
              variant="outline"
              className="flex-1 cursor-pointer"
              onClick={onCancel}
              disabled={isActionLoading}
            >
              <XCircle className="mr-2 size-4" />
              Huỷ
            </Button>
          )}
        </div>
      )}

      {mode === "transfer" && canEditOpening && (
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="flex-1 cursor-pointer"
            onClick={onTransferSaveFromOpening}
            disabled={isActionLoading}
          >
            {isSender ? "Lưu phiếu" : "Cập nhật phiếu"}
          </Button>
          {isSender && (
            <Button
              className="flex-1 cursor-pointer"
              onClick={onTransferShipFromOpening}
              disabled={isActionLoading}
            >
              <CheckCircle className="mr-2 size-4" />
              Chốt phiếu (đóng)
            </Button>
          )}
          {canCancel && (
            <Button
              variant="outline"
              className="flex-1 cursor-pointer"
              onClick={onCancel}
              disabled={isActionLoading}
            >
              <XCircle className="mr-2 size-4" />
              Huỷ
            </Button>
          )}
        </div>
      )}

      {canShipClosed && (
        <div className="flex gap-3">
          <Button
            className="flex-1 cursor-pointer"
            onClick={onTransferShip}
            disabled={isActionLoading}
          >
            <CheckCircle className="mr-2 size-4" />
            Xuất hàng
          </Button>
          {canCancel && (
            <Button
              variant="outline"
              className="flex-1 cursor-pointer"
              onClick={onCancel}
              disabled={isActionLoading}
            >
              <XCircle className="mr-2 size-4" />
              Huỷ
            </Button>
          )}
        </div>
      )}

      {/* IN_TRANSIT: người gửi (fromLocation) được hủy - hoàn tồn do BE. */}
      {isInTransit && canCancel && !canReceiveTransit && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 cursor-pointer"
            onClick={onCancel}
            disabled={isActionLoading}
          >
            <XCircle className="mr-2 size-4" />
            {mode === "import" ? "Huỷ đơn" : "Huỷ yêu cầu"}
          </Button>
        </div>
      )}

      {canReceiveTransit && !showReceiveForm && (
        <div className="flex gap-3">
          <Button
            className="flex-1 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setShowReceiveForm(true);
            }}
            disabled={isActionLoading}
          >
            <PackageCheck className="mr-2 size-4" />
            {mode === "import" ? "Nhận hàng" : "Xác nhận đã nhận"}
          </Button>
          {canReturnGoods && (
            <Button
              variant="outline"
              className="flex-1 cursor-pointer"
              onClick={onReturnGoods}
              disabled={isActionLoading}
            >
              <Undo2 className="mr-2 size-4" />
              Trả hàng
            </Button>
          )}
          {canCancel && (
            <Button
              variant="outline"
              className="flex-1 cursor-pointer"
              onClick={onCancel}
              disabled={isActionLoading}
            >
              <XCircle className="mr-2 size-4" />
              {mode === "import" ? "Huỷ đơn" : "Huỷ yêu cầu"}
            </Button>
          )}
        </div>
      )}

      {canReceiveTransit && showReceiveForm && (
        <div className="space-y-3 rounded-lg border p-4">
          <h4 className="text-sm font-semibold">
            {mode === "import"
              ? "Xác nhận nhận hàng"
              : (receiveTitle ?? "Xác nhận nhận hàng")}
          </h4>
          <div className="flex flex-wrap gap-2">
            <Button
              className="flex-1 cursor-pointer"
              onClick={onReceive}
              disabled={isActionLoading}
            >
              Xác nhận nhận hàng
            </Button>
            {canReturnGoods && (
              <Button
                variant="outline"
                className="flex-1 cursor-pointer"
                onClick={onReturnGoods}
                disabled={isActionLoading}
              >
                <Undo2 className="mr-2 size-4" />
                Trả hàng
              </Button>
            )}
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setShowReceiveForm(false);
              }}
            >
              Đóng
            </Button>
          </div>
        </div>
      )}

      {isReceived && canReturnGoods && !canReceiveTransit && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 cursor-pointer"
            onClick={onReturnGoods}
            disabled={isActionLoading}
          >
            <Undo2 className="mr-2 size-4" />
            Trả hàng
          </Button>
        </div>
      )}
    </>
  );
}
