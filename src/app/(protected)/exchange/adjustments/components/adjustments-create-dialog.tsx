'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { QuantityStepper } from "@/app/(protected)/exchange/shared/quantity-stepper";
import { ProductPickerField } from "@/app/(protected)/exchange/shared/form-fields";
import { MovementProductSearch } from "@/app/(protected)/exchange/shared/movement-product-search";
import { getAdjustQtyChange } from "@/app/(protected)/exchange/shared/qty";
import { refineDuplicateProducts } from "@/app/(protected)/exchange/shared/movement-detail-validation";
import { stockMovementApi } from "@/lib/api/stock-movement";
import {
  filterLocationsByAuthScope,
  getEffectiveLocationScope,
} from "@/app/(protected)/exchange/shared/auth-scope";
import { getStockMovementErrorMessage } from "@/app/(protected)/exchange/shared/stock-movement-error";
import { normalizeOptionalNote } from "@/app/(protected)/exchange/shared/qty";
import { useAuthStore } from "@/store/auth-store";
import type {
  LocationType,
  StockMovementLocationOption,
  StockMovementProductItemOption,
} from '@/types/stock-movement'
import { useAdjustments } from './adjustments-provider'
import { EmptyOptionsNotice, EmptyOptionsLink } from '@/components/empty-options-notice'

const adjustDetailSchema = z.object({
  productItemId: z.string().min(1, 'Vui lòng chọn hàng hóa'),
  receivedQuantity: z
    .number({ error: 'Nhập số nguyên' })
    .int('Phải là số nguyên')
    .min(0, 'Tồn thực tế phải >= 0'),
  note: z.string().optional(),
})

const adjustFormSchema = z
  .object({
    locationId: z.string().min(1, 'Vui lòng chọn kho / chi nhánh'),
    locationType: z.enum(['warehouse', 'branch']),
    note: z.string().optional(),
    details: z.array(adjustDetailSchema).min(1, 'Cần ít nhất 1 mặt hàng'),
  })
  .superRefine((data, ctx) => refineDuplicateProducts(data.details, ctx))

type AdjustFormValues = z.infer<typeof adjustFormSchema>

const EMPTY: AdjustFormValues = {
  locationId: '',
  locationType: 'warehouse',
  note: '',
  details: [{ productItemId: '', receivedQuantity: 1, note: '' }],
}

export function AdjustmentsCreateDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { fetchAdjustments } = useAdjustments()

  const [locations, setLocations] = useState<StockMovementLocationOption[]>([])
  const [products, setProducts] = useState<StockMovementProductItemOption[]>([])
  const [isOptionsLoading, setIsOptionsLoading] = useState(false)

  const locationKey = useAuthStore((s) => s.locationKey)
  const effectiveScope = useMemo(
    () => getEffectiveLocationScope(locationKey),
    [locationKey],
  )
  const isLocationLocked = !!effectiveScope.locationId
  const isTenantOwner = effectiveScope.role === 'TENANT_OWNER'

  const form = useForm<AdjustFormValues>({
    resolver: zodResolver(adjustFormSchema),
    defaultValues: EMPTY,
    mode: 'onTouched',
    reValidateMode: 'onChange',
  })
  const { fields, append, remove, update } = useFieldArray({ control: form.control, name: 'details' })

  const visibleLocations = useMemo(
    () => filterLocationsByAuthScope(locations, effectiveScope),
    [locations, effectiveScope],
  )

  const locationId = form.watch('locationId')
  const locationType = form.watch('locationType') as LocationType
  const details = useWatch({ control: form.control, name: 'details' }) ?? []

  const usedIds = useMemo(() => {
    const set = new Set<string>()
    for (const d of details) if (d.productItemId) set.add(d.productItemId)
    return set
  }, [details])

  /** BR/WH: chỉ hàng đã có tồn tại location đang điều chỉnh; TO: full pool. */
  const searchableProducts = useMemo(
    () =>
      isTenantOwner
        ? products
        : products.filter((p) => p.atLocation || (p.stock ?? 0) > 0),
    [products, isTenantOwner],
  )

  const applyProduct = (item: StockMovementProductItemOption) => {
    const current = form.getValues('details') ?? []
    if (current.some((d) => d.productItemId === item.id)) {
      toast.message('Hàng hóa này đã có trong danh sách')
      return
    }
    const stock = Math.max(0, item.stock ?? 0)
    const base = {
      productItemId: item.id,
      receivedQuantity: stock,
      note: '',
    }
    const emptyIdx = current.findIndex((d) => !d.productItemId)
    if (emptyIdx >= 0) update(emptyIdx, base)
    else append(base)
    void form.trigger('details')
  }

  useEffect(() => {
    if (!open) return
    form.reset(EMPTY)
    setProducts([])
  }, [open, form])

  useEffect(() => {
    if (!open) return
    setIsOptionsLoading(true)
    stockMovementApi
      .getLocationOptions()
      .then(setLocations)
      .catch(() => toast.error('Không thể tải danh sách kho'))
      .finally(() => setIsOptionsLoading(false))
  }, [open])

  useEffect(() => {
    if (!open || locations.length === 0) return
    if (effectiveScope.locationId && effectiveScope.locationType) {
      form.setValue('locationId', effectiveScope.locationId)
      form.setValue('locationType', effectiveScope.locationType)
    }
  }, [
    open,
    locations,
    effectiveScope.locationId,
    effectiveScope.locationType,
    form,
  ])

  useEffect(() => {
    if (!open || !locationId) {
      setProducts([])
      return
    }
    stockMovementApi
      .getProductItemsForDestination(locationId, locationType)
      .then(setProducts)
      .catch(() => toast.error('Không thể tải danh sách hàng hóa'))
  }, [open, locationId, locationType])

  const handleLocationChange = (id: string) => {
    form.setValue('locationId', id)
    const loc = locations.find((l) => l.id === id)
    if (loc) form.setValue('locationType', loc.type)
    setProducts([])
  }

  async function onSubmit(data: AdjustFormValues) {
    const hasChange = data.details.some((d) => {
      const product = products.find((p) => p.id === d.productItemId)
      const snapshot = product?.stock ?? 0
      return getAdjustQtyChange(snapshot, d.receivedQuantity) !== 0
    })
    if (!hasChange) {
      toast.error('Tồn thực tế không thay đổi')
      return
    }

    try {
      await stockMovementApi.createAdjust({
        movementType: 'ADJUST',
        fromLocationId: data.locationId,
        fromLocationType: data.locationType,
        toLocationId: data.locationId,
        toLocationType: data.locationType,
        note: normalizeOptionalNote(data.note),
        details: data.details.map((d) => ({
          productItemId: d.productItemId,
          receivedQuantity: d.receivedQuantity,
          note: normalizeOptionalNote(d.note),
        })),
      })
      toast.success('Đã tạo phiếu kiểm kê')
      onOpenChange(false)
      await fetchAdjustments()
    } catch (error) {
      toast.error(getStockMovementErrorMessage(error, 'Không thể tạo phiếu điều chỉnh'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Điều chỉnh tồn kho</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="locationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Kho / Chi nhánh điều chỉnh <span className="text-destructive">*</span>
                  </FormLabel>
                  {!isOptionsLoading && visibleLocations.length === 0 ? (
                    <EmptyOptionsNotice>
                      {locations.length === 0 ? (
                        <>
                          Cửa hàng chưa có kho hay chi nhánh nào. Hãy tạo ở{' '}
                          <EmptyOptionsLink href="/settings">
                            Cài đặt › Chi nhánh / Kho tổng
                          </EmptyOptionsLink>{' '}
                          trước khi tạo phiếu điều chỉnh.
                        </>
                      ) : (
                        'Bạn chưa được phân công kho hay chi nhánh nào để điều chỉnh tồn.'
                      )}
                    </EmptyOptionsNotice>
                  ) : (
                    <Select
                      value={field.value}
                      onValueChange={handleLocationChange}
                      disabled={isLocationLocked || isOptionsLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="cursor-pointer w-full">
                          <SelectValue placeholder={isOptionsLoading ? 'Đang tải...' : 'Chọn kho / chi nhánh'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {visibleLocations.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.name}{' '}
                            <span className="text-muted-foreground">
                              ({l.type === 'warehouse' ? 'Kho' : 'Chi nhánh'})
                            </span>
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
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lý do điều chỉnh</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Lý do điều chỉnh (tùy chọn)"
                      rows={2}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Danh sách mặt hàng</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => append({ productItemId: '', receivedQuantity: 1, note: '' })}
                >
                  <Plus className="mr-1 size-4" />
                  Thêm dòng
                </Button>
              </div>

              <MovementProductSearch
                usedIds={usedIds}
                onPick={applyProduct}
                searchScope="list"
                poolProducts={searchableProducts}
                disabled={!locationId}
                metaMode="stock"
                placeholder={
                  locationId
                    ? 'Tìm hàng tại kho / chi nhánh đang điều chỉnh...'
                    : 'Chọn kho / chi nhánh trước'
                }
              />

              {fields.map((f, idx) => {
                const itemId = form.watch(`details.${idx}.productItemId`) ?? ''
                const selected = products.find((p) => p.id === itemId)
                const snapshot = selected?.stock ?? 0
                const actual = form.watch(`details.${idx}.receivedQuantity`) ?? 0
                const diff = getAdjustQtyChange(snapshot, actual)
                const lineProducts = searchableProducts.filter(
                  (p) => p.id === itemId || !usedIds.has(p.id),
                )

                return (
                  <div key={f.id} className="rounded-lg border bg-muted/30 p-3 space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <FormField
                          control={form.control}
                          name={`details.${idx}.productItemId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">
                                Hàng hóa <span className="text-destructive">*</span>
                              </FormLabel>
                              <ProductPickerField
                                products={lineProducts}
                                value={field.value}
                                displayProduct={
                                  selected &&
                                  !lineProducts.some((p) => p.id === selected.id)
                                    ? selected
                                    : undefined
                                }
                                metaMode="stock"
                                placeholder={isOptionsLoading ? 'Đang tải...' : 'Chọn hàng hóa'}
                                onValueChange={(value) => {
                                  field.onChange(value)
                                  const p = products.find((x) => x.id === value)
                                  const stock = p?.stock ?? 0
                                  form.setValue(
                                    `details.${idx}.receivedQuantity`,
                                    Math.max(0, stock),
                                  )
                                  void form.trigger('details')
                                }}
                              />
                              {selected && (
                                <p className="text-xs text-muted-foreground">
                                  Tồn hệ thống:{' '}
                                  <strong>{snapshot.toLocaleString('vi-VN')}</strong>
                                </p>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-6 h-8 w-8 shrink-0 text-destructive cursor-pointer"
                        onClick={() => remove(idx)}
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name={`details.${idx}.receivedQuantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              Tồn thực tế <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <QuantityStepper
                                min={0}
                                value={
                                  Number.isFinite(field.value) && field.value >= 0
                                    ? field.value
                                    : 0
                                }
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormItem>
                        <FormLabel className="text-xs">Chênh lệch</FormLabel>
                        <p
                          className={`h-9 flex items-center text-sm font-semibold tabular-nums ${
                            diff > 0
                              ? 'text-green-600 dark:text-green-400'
                              : diff < 0
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-muted-foreground'
                          }`}
                        >
                          {diff > 0 ? `+${diff}` : diff}
                        </p>
                      </FormItem>
                    </div>

                    <FormField
                      control={form.control}
                      name={`details.${idx}.note`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Ghi chú dòng</FormLabel>
                          <FormControl>
                            <Input placeholder="Tùy chọn" className="h-8 text-sm" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                )
              })}
              {form.formState.errors.details?.message && (
                <p className="text-sm text-destructive">{form.formState.errors.details.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="cursor-pointer"
              >
                Huỷ
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting || isOptionsLoading || !locationId}
                className="cursor-pointer"
              >
                <CheckCircle className="mr-2 size-4" />
                {form.formState.isSubmitting ? 'Đang tạo...' : 'Tạo phiếu kiểm kê'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
