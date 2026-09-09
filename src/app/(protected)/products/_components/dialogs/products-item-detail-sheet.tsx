"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  formatVND,
  safeImageSrc,
  STATUS_MAP,
} from "../../_constants/product.constants";
import { useProducts } from "../../_context/products-provider";
import type { Product, ProductItem, StockDetail } from "@/types/product";
import { getCachedUser } from "@/lib/auth";
import {
  canUpdateProduct,
  canDeleteProduct,
  canRemoveInventoryLocation,
} from "@/components/sidebar/constants/role-permissions";

const formatDate = (iso?: string) => {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(
    new Date(iso),
  );
};

type Props = {
  product: Product;
  item: ProductItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onRemoveLocation?: (inventoryId: string) => void;
  isSubDialogOpen?: boolean;
};

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-sm text-muted-foreground shrink-0 w-36">
        {label}
      </span>
      <span className="text-sm font-medium text-right flex-1">{children}</span>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">
        {title}
      </p>
      <div className="rounded-lg border divide-y">{children}</div>
    </div>
  );
}

export function ProductsItemDetailSheet({
  product,
  item,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onRemoveLocation,
  isSubDialogOpen,
}: Props) {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [removingLocation, setRemovingLocation] = useState<StockDetail | null>(
    null,
  );
  const { branchOptions, warehouseOptions, ensureLocationOptionsLoaded } =
    useProducts();
  const role = getCachedUser()?.role;
  const canEdit = canUpdateProduct(role);
  const canDelete = canDeleteProduct(role);
  const canRemoveLocation = canRemoveInventoryLocation(role);

  useEffect(() => {
    if (!open) return;
    ensureLocationOptionsLoaded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!item) return null;

  const supplierNames =
    item.suppliers && item.suppliers.length > 0
      ? item.suppliers.map((s) => s.supplierName).join(", ")
      : "-";

  function resolveLocationName(
    locationType: string,
    locationId: string,
  ): string {
    const opts = locationType === "branch" ? branchOptions : warehouseOptions;
    return opts.find((o) => o.value === locationId)?.label ?? locationId;
  }

  const hasLocations = (item.stockDetails?.length ?? 0) > 0;

  const profit = item.retailPrice - item.costPrice;
  const profitPositive = profit >= 0;
  const thumbnail =
    item.images?.find((i) => i.isThumbnail) ??
    item.images?.[0] ??
    product.images?.find((i) => i.isThumbnail) ??
    product.images?.[0];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[36vw] sm:max-w-[36vw] p-0 flex flex-col overflow-hidden"
        onInteractOutside={(e) => {
          if (confirmDeleteOpen || isSubDialogOpen) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (confirmDeleteOpen || isSubDialogOpen) e.preventDefault();
        }}
      >
        <SheetHeader className="px-6 pt-2 pb-4 border-b shrink-0">
          <SheetTitle className="text-base">{product.name}</SheetTitle>
          <SheetDescription className="font-mono text-xs">
            {item.sku}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-5 space-y-5">
            <div className="grid grid-cols-[3fr_7fr] gap-4">
              <div className="relative rounded-xl overflow-hidden border shadow-sm">
                <Image
                  src={safeImageSrc(thumbnail?.url)}
                  alt={product.name}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">
                  Thông tin cơ bản
                </p>
                <div className="rounded-lg border divide-y flex-1">
                  <div className="px-3">
                    <InfoRow label="Mã hàng">
                      <span className="font-mono text-xs">
                        {item.productCode}
                      </span>
                    </InfoRow>
                  </div>
                  <div className="px-3">
                    <InfoRow label="SKU">
                      <span className="font-mono text-xs">{item.sku}</span>
                    </InfoRow>
                  </div>
                  <div className="px-3">
                    <InfoRow label="Mã vạch">
                      <span className="font-mono text-xs">
                        {item.barcode || "-"}
                      </span>
                    </InfoRow>
                  </div>
                  <div className="px-3">
                    <InfoRow label="Trạng thái">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          STATUS_MAP[product.status].className,
                        )}
                      >
                        {STATUS_MAP[product.status].label}
                      </Badge>
                    </InfoRow>
                  </div>
                  {item.warrantyPeriod && (
                    <div className="px-3">
                      <InfoRow label="Bảo hành">{item.warrantyPeriod}</InfoRow>
                    </div>
                  )}
                  <div className="px-3">
                    <InfoRow label="Nhà cung cấp">{supplierNames}</InfoRow>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {item.productName && (
              <Section title="Tên phiên bản">
                <div className="px-4 py-3">
                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {item.productName}
                  </p>
                </div>
              </Section>
            )}

            <Section title="Giá cả">
              <div className="px-4">
                <InfoRow label="Giá vốn">
                  <span className="tabular-nums">
                    {formatVND(item.costPrice)}
                  </span>
                </InfoRow>
              </div>
              <div className="px-4">
                <InfoRow label="Giá bán">
                  <span className="tabular-nums font-semibold text-primary">
                    {formatVND(item.retailPrice)}
                  </span>
                </InfoRow>
              </div>
              <div className="px-4">
                <InfoRow label="Lợi nhuận">
                  <span
                    className={cn(
                      "tabular-nums font-semibold",
                      profitPositive
                        ? "text-green-600 dark:text-green-400"
                        : "text-destructive",
                    )}
                  >
                    {formatVND(profit)}
                  </span>
                </InfoRow>
              </div>
              <div className="px-4">
                <InfoRow label="VAT">{item.vat ?? 0}%</InfoRow>
              </div>
            </Section>

            <Section title="Tồn kho">
              <div className="px-4">
                <InfoRow label="Tổng tồn kho">
                  <span
                    className={cn(
                      "font-semibold tabular-nums",
                      (item.stock ?? 0) === 0
                        ? "text-destructive"
                        : (item.stock ?? 0) < 10
                          ? "text-orange-500 dark:text-orange-400"
                          : "text-emerald-600 dark:text-emerald-400",
                    )}
                  >
                    {item.stock ?? 0}
                  </span>
                </InfoRow>
              </div>
              {/* Khi đang xem theo một chi nhánh/kho, "Tổng tồn kho" ở trên là tồn TẠI ĐÓ và
                  có thể là 0 vì nơi đó chưa nhập hàng về. Số toàn chuỗi trả lời câu khác:
                  cửa hàng có mặt hàng này không, để còn đề nghị chuyển kho. */}
              {item.stockAllLocations !== undefined &&
                item.stockAllLocations !== (item.stock ?? 0) && (
                  <div className="px-4">
                    <InfoRow label="Tồn toàn chuỗi">
                      <span className="font-semibold tabular-nums text-muted-foreground">
                        {item.stockAllLocations}
                      </span>
                    </InfoRow>
                  </div>
                )}
              {item.stockDetails && item.stockDetails.length > 0 && (
                <div className="px-4 py-2.5 space-y-1.5">
                  <span className="text-sm text-muted-foreground">
                    Chi tiết theo vị trí
                  </span>
                  <div className="flex flex-col gap-1.5 pt-1">
                    {item.stockDetails.map((sd, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-sm rounded-md bg-muted/40 px-3 py-1.5"
                      >
                        <span className="text-muted-foreground">
                          {resolveLocationName(sd.locationType, sd.locationId)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold tabular-nums">
                            {sd.stock}
                          </span>
                          {canRemoveLocation && sd.stock === 0 && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-6 cursor-pointer text-muted-foreground hover:text-destructive"
                              onClick={() => setRemovingLocation(sd)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            {item.description && (
              <Section title="Mô tả">
                <div className="px-4 py-3">
                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </Section>
            )}

            {item.productDetails && item.productDetails.length > 0 && (
              <Section title="Thuộc tính">
                {item.productDetails.map((d, idx) => (
                  <div key={idx} className="px-4">
                    <InfoRow label={d.name}>{d.value}</InfoRow>
                  </div>
                ))}
              </Section>
            )}

            <Section title="Thời gian">
              <div className="px-4">
                <InfoRow label="Ngày tạo">{formatDate(item.createdAt)}</InfoRow>
              </div>
              <div className="px-4">
                <InfoRow label="Cập nhật lần cuối">
                  {formatDate(item.updatedAt)}
                </InfoRow>
              </div>
            </Section>
          </div>
        </ScrollArea>

        <SheetFooter className="px-6 py-4 border-t shrink-0 grid grid-cols-[auto_0.5fr_auto] items-center">
          {canDelete ? (
            <Button
              variant="destructive"
              onClick={() => {
                if (hasLocations) {
                  toast.error(
                    "Chỉ có thể xóa phiên bản khi đã gỡ khỏi mọi vị trí",
                  );
                  return;
                }
                setConfirmDeleteOpen(true);
              }}
            >
              <Trash2 className=" size-4" />
              Xóa phiên bản
            </Button>
          ) : (
            <span />
          )}
          <div />
          {canEdit && (
            <Button variant="outline" onClick={onEdit}>
              <Pencil className=" size-4" />
              Chỉnh sửa
            </Button>
          )}
        </SheetFooter>

        {canDelete && (
          <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Xóa phiên bản</DialogTitle>
                <DialogDescription>
                  Bạn có chắc muốn xóa phiên bản{" "}
                  <strong className="text-foreground">{item.sku}</strong>? Hành
                  động này không thể hoàn tác.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setConfirmDeleteOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setConfirmDeleteOpen(false);
                    onDelete?.();
                  }}
                >
                  <Trash2 className=" size-4" />
                  Xóa phiên bản
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <Dialog
          open={!!removingLocation}
          onOpenChange={(v) => !v && setRemovingLocation(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Gỡ vị trí khỏi phiên bản</DialogTitle>
              <DialogDescription>
                Bạn có chắc muốn gỡ{" "}
                <strong className="text-foreground">
                  {removingLocation &&
                    resolveLocationName(
                      removingLocation.locationType,
                      removingLocation.locationId,
                    )}
                </strong>{" "}
                khỏi phiên bản này? Tồn kho tại vị trí này đang bằng 0.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setRemovingLocation(null)}
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (removingLocation) {
                    onRemoveLocation?.(removingLocation.inventoryId);
                  }
                  setRemovingLocation(null);
                }}
              >
                <Trash2 className=" size-4" />
                Gỡ vị trí
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
}
