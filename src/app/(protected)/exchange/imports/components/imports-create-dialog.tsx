"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { getSessionBranchId } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  resolveItemImportPrice,
  stockMovementApi,
} from "@/lib/api/stock-movement";
import {
  filterLocationsByAuthScope,
  getEffectiveLocationScope,
} from "@/app/(protected)/exchange/shared/auth-scope";
import { getStockMovementErrorMessage } from "@/app/(protected)/exchange/shared/stock-movement-error";
import { normalizeOptionalNote } from "@/app/(protected)/exchange/shared/qty";
import { MovementProductSearch } from "@/app/(protected)/exchange/shared/movement-product-search";
import { useAuthStore } from "@/store/auth-store";
import {
  DetailLineCard,
  MoneyInput,
  ProductPickerField,
} from "@/app/(protected)/exchange/shared/form-fields";
import { QuantityStepper } from "@/app/(protected)/exchange/shared/quantity-stepper";
import {
  MAX_IMPORT_PRICE,
  formatMoneyVnd,
  refineDuplicateProducts,
} from "@/app/(protected)/exchange/shared/movement-detail-validation";
import type {
  StockMovementLocationOption,
  StockMovementProductItemOption,
  StockMovementSupplierOption,
} from "@/types/stock-movement";
import { useImports } from "./imports-provider";
import {
  EmptyOptionsNotice,
  EmptyOptionsLink,
} from "@/components/empty-options-notice";

const detailSchema = z.object({
  productItemId: z.string().min(1, "Vui lòng chọn hàng hóa"),
  quantity: z
    .number({ error: "Nhập số nguyên" })
    .int()
    .positive("Số lượng phải > 0"),
  importPrice: z
    .number({ error: "Nhập số tiền" })
    .positive("Giá nhập phải > 0")
    .max(MAX_IMPORT_PRICE, "Giá nhập tối đa 1000 tỷ"),
  note: z.string().optional(),
});

type DetailValues = z.infer<typeof detailSchema>;
type ImportFormValues = {
  fromSupplierId: string;
  toLocationId: string;
  note?: string;
  details: DetailValues[];
};

const EMPTY_DETAIL: DetailValues = {
  productItemId: "",
  quantity: 1,
  importPrice: 0,
  note: "",
};

const importFormSchema = z
  .object({
    fromSupplierId: z.string().min(1, "Vui lòng chọn nhà cung cấp"),
    toLocationId: z.string().min(1, "Vui lòng chọn kho nhận"),
    note: z.string().optional(),
    details: z.array(detailSchema).min(1, "Cần ít nhất 1 mặt hàng"),
  })
  .superRefine((data, ctx) => refineDuplicateProducts(data.details, ctx));

function clampImportPrice(item: StockMovementProductItemOption) {
  return Math.min(Math.max(0, resolveItemImportPrice(item)), MAX_IMPORT_PRICE);
}

function isPriceOverRetail(price?: number, retail?: number) {
  return (
    typeof retail === "number" &&
    retail > 0 &&
    typeof price === "number" &&
    price > retail
  );
}

function ImportDetailLine({
  form,
  index,
  product,
  lineProducts,
  canRemove,
  onRemove,
  onPick,
}: {
  form: UseFormReturn<ImportFormValues>;
  index: number;
  product?: StockMovementProductItemOption;
  lineProducts: StockMovementProductItemOption[];
  canRemove: boolean;
  onRemove: () => void;
  onPick: (item: StockMovementProductItemOption) => void;
}) {
  const importPrice = useWatch({
    control: form.control,
    name: `details.${index}.importPrice`,
  });
  const priceOver = isPriceOverRetail(importPrice, product?.retailPrice);
  const displayOrphan =
    product && !lineProducts.some((p) => p.id === product.id)
      ? product
      : undefined;

  return (
    <DetailLineCard
      index={index}
      canRemove={canRemove}
      onRemove={onRemove}
      className={cn(priceOver && "border-destructive/60")}
    >
      <FormField
        control={form.control}
        name={`details.${index}.productItemId`}
        render={({ field }) => (
          <FormItem className="min-w-0 gap-1.5">
            <FormLabel className="text-xs leading-none">
              Hàng hóa <span className="text-destructive">*</span>
            </FormLabel>
            <ProductPickerField
              products={lineProducts}
              value={field.value}
              displayProduct={displayOrphan}
              metaMode="price"
              placeholder="Chọn hàng hóa"
              onValueChange={(id) => {
                const item = lineProducts.find((p) => p.id === id);
                if (item) onPick(item);
                else field.onChange(id);
              }}
            />
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-[8.5rem_minmax(12rem,1.25fr)_minmax(10rem,1fr)]">
        <FormField
          control={form.control}
          name={`details.${index}.quantity`}
          render={({ field }) => (
            <FormItem className="gap-1.5">
              <FormLabel className="text-xs leading-none">
                Số lượng <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <QuantityStepper
                  className="h-9 w-full min-w-0"
                  min={1}
                  value={Number.isFinite(field.value) ? field.value : 1}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`details.${index}.importPrice`}
          render={({ field }) => (
            <FormItem className="gap-1.5">
              <FormLabel className="text-xs leading-none">
                Giá nhập (đ) <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <MoneyInput value={field.value} onChange={field.onChange} />
              </FormControl>
              {priceOver && product?.retailPrice != null ? (
                <p className="text-xs text-destructive">
                  Không được cao hơn giá bán (
                  {formatMoneyVnd(product.retailPrice)})
                </p>
              ) : (
                <FormMessage />
              )}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`details.${index}.note`}
          render={({ field }) => (
            <FormItem className="gap-1.5">
              <FormLabel className="text-xs leading-none">Ghi chú dòng</FormLabel>
              <FormControl>
                <Input
                  placeholder="Tùy chọn"
                  className="h-9 w-full text-sm"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </DetailLineCard>
  );
}

export function ImportsCreateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { fetchImports } = useImports();
  const locationKey = useAuthStore((s) => s.locationKey);
  const effectiveScope = useMemo(
    () => getEffectiveLocationScope(locationKey),
    [locationKey],
  );
  const { locationId: lockedLocationId } = effectiveScope;

  const form = useForm<ImportFormValues>({
    resolver: zodResolver(importFormSchema),
    defaultValues: {
      fromSupplierId: "",
      toLocationId: "",
      note: "",
      details: [],
    },
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "details",
  });

  const details = useWatch({ control: form.control, name: "details" }) ?? [];

  const [suppliers, setSuppliers] = useState<StockMovementSupplierOption[]>([]);
  const [locations, setLocations] = useState<StockMovementLocationOption[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<
    StockMovementProductItemOption[]
  >([]);
  const [extraById, setExtraById] = useState(
    () => new Map<string, StockMovementProductItemOption>(),
  );
  const [isOptionsLoading, setIsOptionsLoading] = useState(false);

  const visibleLocations = useMemo(
    () => filterLocationsByAuthScope(locations, effectiveScope),
    [locations, effectiveScope],
  );

  const productById = useMemo(() => {
    const map = new Map(extraById);
    for (const p of catalogProducts) map.set(p.id, p);
    return map;
  }, [extraById, catalogProducts]);

  const usedIds = useMemo(() => {
    const set = new Set<string>();
    for (const d of details) if (d.productItemId) set.add(d.productItemId);
    return set;
  }, [details]);

  const total = useMemo(
    () =>
      details.reduce(
        (sum, d) => sum + (d.quantity || 0) * (d.importPrice || 0),
        0,
      ),
    [details],
  );

  const canSubmit = useMemo(() => {
    if (!details.length || isOptionsLoading) return false;
    for (const d of details) {
      if (!d.productItemId) return false;
      if (isPriceOverRetail(d.importPrice, productById.get(d.productItemId)?.retailPrice)) {
        return false;
      }
    }
    return true;
  }, [details, isOptionsLoading, productById]);

  const cacheProduct = useCallback((item: StockMovementProductItemOption) => {
    setExtraById((prev) => {
      if (prev.has(item.id)) return prev;
      const next = new Map(prev);
      next.set(item.id, item);
      return next;
    });
  }, []);

  const applyProduct = useCallback(
    (item: StockMovementProductItemOption, lineIndex?: number) => {
      const current = form.getValues("details") ?? [];
      const dup =
        lineIndex == null
          ? current.some((d) => d.productItemId === item.id)
          : current.some(
              (d, i) => i !== lineIndex && d.productItemId === item.id,
            );
      if (dup) {
        toast.message("Hàng hóa này đã có trong danh sách");
        return;
      }

      cacheProduct(item);
      const base: DetailValues = {
        productItemId: item.id,
        quantity: 1,
        importPrice: clampImportPrice(item),
        note: "",
      };

      const target =
        lineIndex ?? current.findIndex((d) => !d.productItemId);

      if (target >= 0) {
        const prev = current[target];
        update(target, {
          ...base,
          quantity: prev?.quantity || 1,
          note: prev?.note || "",
        });
      } else {
        append(base);
      }
      void form.trigger("details");
    },
    [append, cacheProduct, form, update],
  );

  useEffect(() => {
    if (!open) return;
    form.reset({
      fromSupplierId: "",
      toLocationId: lockedLocationId || "",
      note: "",
      details: [],
    });
    setExtraById(new Map());
  }, [open, form, lockedLocationId]);

  useEffect(() => {
    if (!open) return;
    setIsOptionsLoading(true);
    Promise.all([
      stockMovementApi.getSupplierOptions(),
      stockMovementApi.getLocationOptions(),
      stockMovementApi.getCatalogProductItems(),
    ])
      .then(([s, l, products]) => {
        setSuppliers(s);
        setLocations(l);
        setCatalogProducts(products);
      })
      .catch(() => toast.error("Không thể tải dữ liệu tạo đơn nhập hàng"))
      .finally(() => setIsOptionsLoading(false));
  }, [open]);

  async function onSubmit(data: ImportFormValues) {
    // Nhập hàng về kho. Backend cũng đã chặn từ 2026-09-07 (`assertCanActAt` cho đích của
    // phiếu IMPORT); trước đó luật này chỉ tồn tại ở đúng dòng JavaScript này.
    if (getSessionBranchId()) {
      toast.error("Chi nhánh không được tạo đơn nhập hàng");
      return;
    }
    for (const d of data.details) {
      const retail = productById.get(d.productItemId)?.retailPrice;
      if (isPriceOverRetail(d.importPrice, retail) && retail != null) {
        toast.error(
          `Giá nhập không được cao hơn giá bán (${formatMoneyVnd(retail)})`,
        );
        return;
      }
    }

    const toType =
      visibleLocations.find((l) => l.id === data.toLocationId)?.type ??
      "warehouse";

    try {
      await stockMovementApi.createImport({
        movementType: "IMPORT",
        fromSupplierId: data.fromSupplierId,
        toLocationId: data.toLocationId,
        toLocationType: toType,
        fromLocationId: data.toLocationId,
        fromLocationType: toType,
        note: normalizeOptionalNote(data.note),
        details: data.details.map((d) => ({
          productItemId: d.productItemId,
          quantity: d.quantity,
          importPrice: d.importPrice,
          note: normalizeOptionalNote(d.note),
        })),
      });
      toast.success("Tạo đơn nhập hàng thành công");
      onOpenChange(false);
      await fetchImports();
    } catch (error) {
      toast.error(
        getStockMovementErrorMessage(
          error,
          "Không thể tạo đơn, vui lòng thử lại",
        ),
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo đơn nhập hàng mới</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="fromSupplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Nhà cung cấp <span className="text-destructive">*</span>
                    </FormLabel>
                    {!isOptionsLoading && suppliers.length === 0 ? (
                      <EmptyOptionsNotice>
                        Cửa hàng chưa có nhà cung cấp nào. Hãy thêm nhà cung cấp ở{" "}
                        <EmptyOptionsLink href="/exchange/suppliers">
                          Giao dịch › Nhà cung cấp
                        </EmptyOptionsLink>{" "}
                        trước khi tạo đơn nhập hàng.
                      </EmptyOptionsNotice>
                    ) : (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full cursor-pointer">
                            <SelectValue
                              placeholder={
                                isOptionsLoading
                                  ? "Đang tải..."
                                  : "Chọn nhà cung cấp"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="toLocationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Kho nhận <span className="text-destructive">*</span>
                    </FormLabel>
                    {!isOptionsLoading && visibleLocations.length === 0 ? (
                      // Rỗng vì hai lý do khác hẳn nhau: cửa hàng chưa tạo kho/chi nhánh
                      // nào, hay có nhưng người này không được phân công chỗ nào.
                      <EmptyOptionsNotice>
                        {locations.length === 0 ? (
                          <>
                            Cửa hàng chưa có kho hay chi nhánh nào. Hãy tạo ở{" "}
                            <EmptyOptionsLink href="/settings">
                              Cài đặt › Chi nhánh / Kho tổng
                            </EmptyOptionsLink>{" "}
                            trước khi tạo đơn nhập hàng.
                          </>
                        ) : (
                          "Bạn chưa được phân công kho hay chi nhánh nào để nhận hàng."
                        )}
                      </EmptyOptionsNotice>
                    ) : (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!!lockedLocationId}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full cursor-pointer">
                            <SelectValue
                              placeholder={
                                isOptionsLoading ? "Đang tải..." : "Chọn kho nhận"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {visibleLocations.map((l) => (
                            <SelectItem key={l.id} value={l.id}>
                              {l.name} (
                              {l.type === "warehouse" ? "Kho" : "Chi nhánh"})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú đơn</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ghi chú cho cả phiếu nhập (tùy chọn)"
                      rows={2}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Tìm hàng</h3>
              <MovementProductSearch
                usedIds={usedIds}
                onPick={(item) => applyProduct(item)}
                searchScope="catalog"
                poolProducts={catalogProducts}
                metaMode="price"
                placeholder="Tìm theo tên, mã, SKU (toàn catalog)..."
              />

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <h3 className="text-sm font-semibold">
                  Hàng đã chọn ({fields.length})
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => append({ ...EMPTY_DETAIL })}
                >
                  <Plus className="mr-1 size-4" />
                  Thêm dòng trống
                </Button>
              </div>

              {fields.map((f, idx) => {
                const itemId = details[idx]?.productItemId ?? "";
                const product = itemId ? productById.get(itemId) : undefined;
                const lineProducts = catalogProducts.filter(
                  (p) => p.id === itemId || !usedIds.has(p.id),
                );
                return (
                  <ImportDetailLine
                    key={f.id}
                    form={form}
                    index={idx}
                    product={product}
                    lineProducts={lineProducts}
                    canRemove
                    onRemove={() => {
                      remove(idx);
                      if (!itemId) return;
                      setExtraById((prev) => {
                        if (!prev.has(itemId)) return prev;
                        const next = new Map(prev);
                        next.delete(itemId);
                        return next;
                      });
                    }}
                    onPick={(item) => applyProduct(item, idx)}
                  />
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Tổng giá trị đơn hàng
              </p>
              <p
                className="max-w-[60%] truncate text-lg font-bold tabular-nums"
                title={formatMoneyVnd(total)}
              >
                {formatMoneyVnd(total)}
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={() => onOpenChange(false)}
              >
                Huỷ
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting || !canSubmit}
                className="cursor-pointer"
              >
                <Plus className="mr-2 size-4" />
                {form.formState.isSubmitting
                  ? "Đang tạo..."
                  : "Tạo đơn nhập hàng"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
