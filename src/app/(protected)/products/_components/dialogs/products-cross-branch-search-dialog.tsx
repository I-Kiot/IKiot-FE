"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CascadeSelect } from "@/components/ui/cascade-select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useProducts } from "../../_context/products-provider";
import { productApi } from "@/lib/api/product";
import type { Product, ProductItem, ProductStatus } from "@/types/product";
import {
  formatVND,
  safeImageSrc,
  STATUS_MAP,
} from "../../_constants/product.constants";
import { ProductsItemDetailSheet } from "./products-item-detail-sheet";

type SearchResult = { product: Product; item: ProductItem };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProductsCrossBranchSearchDialog({ open, onOpenChange }: Props) {
  const {
    branchOptions,
    warehouseOptions,
    ensureLocationOptionsLoaded,
    categories,
    suppliers,
    ensureSuppliersLoaded,
  } = useProducts();

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [supplierFilter, setSupplierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewing, setViewing] = useState<SearchResult | null>(null);

  const hasAnyFilter = !!(
    branchFilter ||
    categoryFilter ||
    supplierFilter ||
    statusFilter
  );

  // Branch/supplier options are only needed while this modal is open.
  useEffect(() => {
    if (!open) return;
    ensureLocationOptionsLoaded();
    ensureSuppliersLoaded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open) return;
    const reset = () => {
      setQ("");
      setDebouncedQ("");
      setBranchFilter("");
      setCategoryFilter(null);
      setSupplierFilter("");
      setStatusFilter("");
      setResults([]);
      setViewing(null);
    };
    reset();
  }, [open]);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(handler);
  }, [q]);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const trimmedQ = debouncedQ.trim();

    const run = async () => {
      if (trimmedQ.length < 2 && !hasAnyFilter) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await productApi.search(
          {
            q: trimmedQ.length >= 2 ? trimmedQ : undefined,
            categoryId: categoryFilter ?? undefined,
            supplierId: supplierFilter || undefined,
            status: (statusFilter || undefined) as ProductStatus | undefined,
            locationId: branchFilter || undefined,
            locationType: branchFilter ? "branch" : undefined,
            limit: 30,
          },
          controller.signal,
        );
        const flattened: SearchResult[] = res.data.flatMap((product) =>
          (product.items ?? []).map((item) => ({ product, item })),
        );
        setResults(flattened);
      } catch {
        if (!controller.signal.aborted) {
          toast.error("Tìm kiếm thất bại");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    run();
    return () => controller.abort();
  }, [
    open,
    debouncedQ,
    branchFilter,
    categoryFilter,
    supplierFilter,
    statusFilter,
    hasAnyFilter,
  ]);

  const categoryItems = categories.map((c) => ({
    id: c.id,
    label: c.name,
    parentId: !c.parentId
      ? null
      : typeof c.parentId === "string"
        ? c.parentId
        : (c.parentId as { id: string }).id,
  }));

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Tìm hàng hóa ở chi nhánh khác</DialogTitle>
            <DialogDescription>
              Tìm theo tên, mã hàng, SKU hoặc mã vạch trên toàn bộ chi nhánh và
              kho.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Nhập tên, mã hàng, SKU hoặc mã vạch (tối thiểu 2 ký tự)..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Select
                value={branchFilter || "all"}
                onValueChange={(v) => setBranchFilter(v === "all" ? "" : v)}
              >
                <SelectTrigger className="cursor-pointer w-40 h-9 text-sm">
                  <SelectValue placeholder="Chi nhánh" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả chi nhánh</SelectItem>
                  {branchOptions.map((b) => (
                    <SelectItem key={b.value} value={b.value}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <CascadeSelect
                items={categoryItems}
                value={categoryFilter}
                onValueChange={(v) => setCategoryFilter(v)}
                placeholder="Danh mục"
                className="w-40 h-9 text-sm cursor-pointer"
              />

              <Select
                value={supplierFilter || "all"}
                onValueChange={(v) => setSupplierFilter(v === "all" ? "" : v)}
              >
                <SelectTrigger className="cursor-pointer w-40 h-9 text-sm">
                  <SelectValue placeholder="Nhà cung cấp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả NCC</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.supplierName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={statusFilter || "all"}
                onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}
              >
                <SelectTrigger className="cursor-pointer w-36 h-9 text-sm">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="ACTIVE">Đang kinh doanh</SelectItem>
                  <SelectItem value="INACTIVE">Ngừng kinh doanh</SelectItem>
                  <SelectItem value="DISCONTINUED">Ngừng sản xuất</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <ScrollArea
            type="always"
            className="flex-1 min-h-0 -mx-6 px-6 border-t pt-3"
          >
            {loading ? (
              <div className="space-y-3 py-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                {debouncedQ.trim().length < 2 && !hasAnyFilter
                  ? "Nhập từ khóa (tối thiểu 2 ký tự) hoặc chọn bộ lọc để tìm kiếm."
                  : "Không tìm thấy hàng hóa phù hợp."}
              </div>
            ) : (
              <div className="space-y-2 py-2">
                {results.map(({ product, item }) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setViewing({ product, item })}
                    className="w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={safeImageSrc(
                        (
                          item.images?.find((i) => i.isThumbnail) ??
                          item.images?.[0]
                        )?.url,
                      )}
                      alt={product.name}
                      className="size-11 rounded-md object-contain border shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {product.name}
                        </span>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs shrink-0",
                            STATUS_MAP[product.status].className,
                          )}
                        >
                          {STATUS_MAP[product.status].label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="font-mono">{item.productCode}</span>
                        <span className="font-mono">{item.sku}</span>
                        {item.barcode && (
                          <span className="font-mono">{item.barcode}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-sm font-semibold text-primary tabular-nums">
                        {formatVND(item.retailPrice)}
                      </span>
                      <div className="flex flex-wrap justify-end gap-1 max-w-56">
                        {(item.stockDetails ?? []).length === 0 ? (
                          <span className="text-xs text-muted-foreground">
                            Chưa có tồn kho
                          </span>
                        ) : (
                          item.stockDetails!.map((sd, idx) => (
                            <span
                              key={idx}
                              className={cn(
                                "text-xs rounded px-1.5 py-0.5 tabular-nums",
                                sd.stock === 0
                                  ? "bg-destructive/10 text-destructive"
                                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                              )}
                            >
                              {branchOptions.find(
                                (b) => b.value === sd.locationId,
                              )?.label ??
                                warehouseOptions.find(
                                  (w) => w.value === sd.locationId,
                                )?.label ??
                                sd.locationId}
                              : {sd.stock}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {viewing && (
        <ProductsItemDetailSheet
          product={viewing.product}
          item={viewing.item}
          open={!!viewing}
          onOpenChange={(v) => {
            if (!v) setViewing(null);
          }}
        />
      )}
    </>
  );
}
