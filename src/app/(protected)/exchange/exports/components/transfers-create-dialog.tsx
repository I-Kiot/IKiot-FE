'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { stockMovementApi } from '@/lib/api/stock-movement'
import {
  filterLocationsByAuthScope,
  getEffectiveLocationScope,
} from '@/app/(protected)/exchange/shared/auth-scope'
import { getStockMovementErrorMessage } from '@/app/(protected)/exchange/shared/stock-movement-error'
import { useAuthStore } from '@/store/auth-store'
import { normalizeOptionalNote } from '@/app/(protected)/exchange/shared/qty'
import { QuantityStepper } from '@/app/(protected)/exchange/shared/quantity-stepper'
import { MoneyInput, ProductPickerField } from '@/app/(protected)/exchange/shared/form-fields'
import { MovementProductSearch } from '@/app/(protected)/exchange/shared/movement-product-search'
import {
  MAX_IMPORT_PRICE,
  formatMoneyVnd,
  refineDuplicateProducts,
} from '@/app/(protected)/exchange/shared/movement-detail-validation'
import type {
  StockMovementLocationOption,
  StockMovementProductItemOption,
} from '@/types/stock-movement'
import { useTransfers } from './transfers-provider'

/**
 * BR: chọn loại yêu cầu trước khi điền phiếu.
 *
 * `inbound` là chiều ngược lại của hai cái kia - chi nhánh đang xin hàng về chỗ mình chứ
 * không gửi đi, nên nơi nhận bị khoá vào chi nhánh của họ và nơi gửi mới là ô để chọn.
 * Backend cho phép cả hai đầu tạo phiếu chuyển (`create` chỉ đòi một trong hai đầu là chỗ
 * của người tạo), và bên gửi là bên nhận thông báo vì họ là bên phải soạn hàng.
 */
type BranchRequestKind = 'transfer' | 'return' | 'inbound'

type TransferFormValues = {
  fromLocationId: string
  toLocationId: string
  note?: string
  details: {
    productItemId: string
    quantity: number
    importPrice: number
    note?: string
  }[]
}

const EMPTY_DETAIL = { productItemId: '', quantity: 1, importPrice: 0, note: '' }
const EMPTY_DETAILS: TransferFormValues['details'] = []

const EMPTY_VALUES: TransferFormValues = {
  fromLocationId: '',
  toLocationId: '',
  note: '',
  details: [{ ...EMPTY_DETAIL }],
}

interface TransfersCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TransfersCreateDialog({ open, onOpenChange }: TransfersCreateDialogProps) {
  const { fetchTransfers, labels } = useTransfers()
  const [locations, setLocations] = useState<StockMovementLocationOption[]>([])
  const [products, setProducts] = useState<StockMovementProductItemOption[]>([])
  const [isOptionsLoading, setIsOptionsLoading] = useState(false)
  const [branchRequestKind, setBranchRequestKind] =
    useState<BranchRequestKind>('transfer')
  const locationKey = useAuthStore((s) => s.locationKey)
  const effectiveScope = useMemo(
    () => getEffectiveLocationScope(locationKey),
    [locationKey],
  )
  /** BM JWT hoặc tenant đang switch sang chi nhánh. */
  const isBranchActor =
    effectiveScope.locationType === 'branch' && !!effectiveScope.locationId
  const isWarehouseActor =
    effectiveScope.locationType === 'warehouse' && !!effectiveScope.locationId
  /** Chi nhánh xin hàng về: nơi nhận là chỗ mình, nơi gửi mới là ô chọn. */
  const isInboundRequest = isBranchActor && branchRequestKind === 'inbound'
  const isFromLocationLocked = !!effectiveScope.locationId && !isInboundRequest

  const transferFormSchema = useMemo(
    () =>
      z
        .object({
          fromLocationId: z.string().min(1, labels.fromRequired),
          toLocationId: z.string().min(1, labels.toRequired),
          note: z.string().optional(),
          details: z
            .array(
              z.object({
                productItemId: z.string().min(1, 'Vui lòng chọn hàng hóa'),
                quantity: z
                  .number({ error: 'Nhập số nguyên' })
                  .int()
                  .positive('Số lượng phải > 0'),
                importPrice: z
                  .number({ error: 'Nhập số tiền' })
                  .positive('Giá phải > 0')
                  .max(MAX_IMPORT_PRICE, 'Giá tối đa 1000 tỷ'),
                note: z.string().optional(),
              }),
            )
            .min(1, 'Cần ít nhất 1 mặt hàng'),
        })
        .refine((d) => d.fromLocationId !== d.toLocationId, {
          message: labels.sameLocationError,
          path: ['toLocationId'],
        })
        .superRefine((data, ctx) => refineDuplicateProducts(data.details, ctx)),
    [labels],
  )

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: EMPTY_VALUES,
    mode: 'onTouched',
    reValidateMode: 'onChange',
  })

  const { fields, append, remove, update } = useFieldArray({ control: form.control, name: 'details' })
  const fromLocationId = useWatch({ control: form.control, name: 'fromLocationId' })
  const details = useWatch({ control: form.control, name: 'details' }) ?? EMPTY_DETAILS

  const usedIds = useMemo(() => {
    const set = new Set<string>()
    for (const d of details) if (d.productItemId) set.add(d.productItemId)
    return set
  }, [details])

  const applyProduct = (item: StockMovementProductItemOption) => {
    const current = form.getValues('details') ?? []
    if (current.some((d) => d.productItemId === item.id)) {
      toast.message('Hàng hóa này đã có trong danh sách')
      return
    }
    const importPrice = Math.min(
      Math.max(0, item.costPrice ?? 0),
      MAX_IMPORT_PRICE,
    )
    const qty = 1
    const base = {
      productItemId: item.id,
      quantity: qty,
      importPrice,
      note: '',
    }
    const emptyIdx = current.findIndex((d) => !d.productItemId)
    if (emptyIdx >= 0) {
      update(emptyIdx, base)
    } else {
      append(base)
    }
    void form.trigger('details')
  }

  const total = useMemo(
    () =>
      details.reduce(
        (sum, d) => sum + (d.quantity || 0) * (d.importPrice || 0),
        0,
      ),
    [details],
  )

  const dialogCopy = useMemo(() => {
    if (!isBranchActor) {
      return {
        title: labels.createDialogTitle,
        fromLabel: labels.fromLabel,
        fromPlaceholder: labels.fromPlaceholder,
        toLabel: labels.toLabel,
        toPlaceholder: labels.toPlaceholder,
        listTitle: 'Danh sách hàng hóa cần chuyển',
        submit: labels.submitButton,
      }
    }
    if (branchRequestKind === 'return') {
      return {
        title: 'Tạo yêu cầu trả hàng',
        fromLabel: labels.fromLabel,
        fromPlaceholder: labels.fromPlaceholder,
        toLabel: 'Nơi nhận',
        toPlaceholder: 'Chọn chi nhánh hoặc kho nhận',
        listTitle: 'Danh sách hàng hóa cần trả / chuyển',
        submit: 'Tạo yêu cầu trả hàng',
      }
    }
    if (branchRequestKind === 'inbound') {
      return {
        title: 'Tạo yêu cầu nhận hàng',
        fromLabel: 'Nơi gửi',
        fromPlaceholder: 'Chọn kho hoặc chi nhánh gửi',
        toLabel: 'Chi nhánh nhận',
        toPlaceholder: 'Chi nhánh của bạn',
        listTitle: 'Danh sách hàng hóa cần nhận',
        submit: 'Gửi yêu cầu nhận hàng',
      }
    }
    return {
      title: 'Tạo yêu cầu chuyển hàng',
      fromLabel: labels.fromLabel,
      fromPlaceholder: labels.fromPlaceholder,
      toLabel: 'Nơi nhận',
      toPlaceholder: 'Chọn chi nhánh nhận',
      listTitle: 'Danh sách hàng hóa cần chuyển',
      submit: 'Tạo yêu cầu chuyển hàng',
    }
  }, [isBranchActor, branchRequestKind, labels])

  useEffect(() => {
    if (!open) return
    form.reset(EMPTY_VALUES)
    setProducts([])
    setBranchRequestKind('transfer')
  }, [open, form])

  useEffect(() => {
    if (!open) return
    setIsOptionsLoading(true)
    stockMovementApi
      .getLocationOptions()
      .then(setLocations)
      .catch(() => toast.error(labels.loadLocationsError))
      .finally(() => setIsOptionsLoading(false))
  }, [open, labels.loadLocationsError])

  const visibleFromLocations = useMemo(() => {
    // Xin hàng về: nơi gửi là chỗ khác, nên không lọc theo scope của chính mình.
    if (isInboundRequest) {
      return locations.filter((l) => l.id !== effectiveScope.locationId)
    }
    return filterLocationsByAuthScope(locations, effectiveScope)
  }, [locations, effectiveScope, isInboundRequest])
  const fromLocation = visibleFromLocations.find((l) => l.id === fromLocationId)

  const visibleToLocations = useMemo(() => {
    if (isInboundRequest) {
      // Chỉ đúng một nơi nhận: chi nhánh của người tạo.
      return locations.filter((l) => l.id === effectiveScope.locationId)
    }
    if (!fromLocationId) return []
    if (isWarehouseActor) {
      return locations.filter((l) => l.type === 'branch' && l.id !== fromLocationId)
    }
    // BR chuyển hàng: chỉ CN khác. BR trả hàng: kho / CN khác (không gồm nơi gửi).
    if (isBranchActor) {
      if (branchRequestKind === 'transfer') {
        return locations.filter(
          (l) => l.type === 'branch' && l.id !== fromLocationId,
        )
      }
      return locations.filter((l) => l.id !== fromLocationId)
    }
    return locations.filter((l) => l.id !== fromLocationId)
  }, [
    locations,
    fromLocationId,
    isWarehouseActor,
    isBranchActor,
    isInboundRequest,
    effectiveScope.locationId,
    branchRequestKind,
  ])

  useEffect(() => {
    if (!open || !fromLocationId || !fromLocation) {
      setProducts([])
      return
    }
    stockMovementApi
      .getProductItemsAtSource(fromLocationId, fromLocation.type)
      .then(setProducts)
      .catch(() => toast.error(labels.loadProductsError))
  }, [open, fromLocationId, fromLocation, labels.loadProductsError])

  useEffect(() => {
    if (!open) return
    const currentTo = form.getValues('toLocationId')
    if (currentTo && !visibleToLocations.some((l) => l.id === currentTo)) {
      form.setValue('toLocationId', '')
    }
  }, [open, visibleToLocations, form])

  useEffect(() => {
    if (!open) return
    if (!effectiveScope.locationId) return
    if (isInboundRequest) {
      // Chiều ngược lại: chỗ mình là nơi nhận, nơi gửi để người dùng chọn.
      form.setValue('toLocationId', effectiveScope.locationId)
      form.setValue('fromLocationId', '')
      return
    }
    form.setValue('fromLocationId', effectiveScope.locationId)
    form.setValue('toLocationId', '')
  }, [open, effectiveScope.locationId, isInboundRequest, form])

  const onBranchRequestKindChange = (value: string) => {
    if (value !== 'transfer' && value !== 'return' && value !== 'inbound') return
    setBranchRequestKind(value)
    // Hai đầu đổi vai nhau nên xoá cả hai; effect ở trên gán lại đầu bị khoá.
    form.setValue('fromLocationId', '')
    form.setValue('toLocationId', '')
    form.setValue('details', [{ ...EMPTY_DETAIL }])
  }

  async function onSubmit(data: TransferFormValues) {
    const fromLoc = locations.find((l) => l.id === data.fromLocationId)
    const toLoc = locations.find((l) => l.id === data.toLocationId)
    if (isInboundRequest) {
      if (data.toLocationId !== effectiveScope.locationId) {
        toast.error('Chi nhánh chỉ được xin hàng về chi nhánh của bạn')
        return
      }
    } else if (
      effectiveScope.locationId &&
      data.fromLocationId !== effectiveScope.locationId
    ) {
      toast.error(
        isWarehouseActor
          ? 'Kho chỉ được xuất từ kho của bạn'
          : 'Chi nhánh chỉ được xuất từ chi nhánh của bạn',
      )
      return
    }

    if (
      isBranchActor &&
      branchRequestKind === 'transfer' &&
      toLoc?.type !== 'branch'
    ) {
      toast.error('Chuyển hàng chỉ được gửi tới chi nhánh khác')
      return
    }

    // BR→WH phải RETURN; còn lại EXPORT (kể cả BR→BR)
    const movementType =
      fromLoc?.type === 'branch' && toLoc?.type === 'warehouse'
        ? ('RETURN' as const)
        : ('EXPORT' as const)

    try {
      await stockMovementApi.createExport({
        movementType,
        fromLocationId: data.fromLocationId,
        fromLocationType: fromLoc?.type ?? 'warehouse',
        toLocationId: data.toLocationId,
        toLocationType: toLoc?.type ?? 'branch',
        note: normalizeOptionalNote(data.note),
        details: data.details.map((d) => ({
          productItemId: d.productItemId,
          quantity: d.quantity,
          importPrice: d.importPrice,
          note: normalizeOptionalNote(d.note),
        })),
      })
      toast.success(
        isInboundRequest
          ? 'Đã gửi yêu cầu nhận hàng, chờ nơi gửi chuẩn bị'
          : movementType === 'RETURN'
            ? 'Tạo yêu cầu trả hàng về kho thành công'
            : labels.successToast,
      )
      onOpenChange(false)
      await fetchTransfers()
    } catch (error) {
      toast.error(getStockMovementErrorMessage(error, 'Không thể tạo yêu cầu, vui lòng thử lại'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogCopy.title}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {isBranchActor && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Loại yêu cầu <span className="text-destructive">*</span>
                </p>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  value={branchRequestKind}
                  onValueChange={onBranchRequestKindChange}
                  className="grid w-full grid-cols-3 gap-2"
                >
                  <ToggleGroupItem
                    value="transfer"
                    className="h-10 cursor-pointer data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                    Yêu cầu chuyển hàng
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="return"
                    className="h-10 cursor-pointer data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                    Yêu cầu trả hàng
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="inbound"
                    className="h-10 cursor-pointer data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                    Yêu cầu nhận hàng
                  </ToggleGroupItem>
                </ToggleGroup>
                <p className="text-xs text-muted-foreground">
                  {branchRequestKind === 'inbound'
                    ? 'Xin hàng về chi nhánh của bạn - nơi gửi sẽ nhận thông báo và soạn hàng.'
                    : 'Chi nhánh của bạn là nơi gửi hàng đi.'}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="fromLocationId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{dialogCopy.fromLabel} <span className="text-destructive">*</span></FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isFromLocationLocked}
                  >
                    <FormControl>
                      <SelectTrigger className="cursor-pointer w-full"><SelectValue placeholder={dialogCopy.fromPlaceholder} /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {visibleFromLocations.map((l) => (
                        <SelectItem key={l.id} value={l.id}>{l.name} ({l.type === 'warehouse' ? 'Kho' : 'Chi nhánh'})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="toLocationId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{dialogCopy.toLabel} <span className="text-destructive">*</span></FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isInboundRequest}
                  >
                    <FormControl>
                      <SelectTrigger className="cursor-pointer w-full">
                        <SelectValue placeholder={dialogCopy.toPlaceholder} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {visibleToLocations.map((l) => (
                        <SelectItem key={l.id} value={l.id}>{l.name} ({l.type === 'warehouse' ? 'Kho' : 'Chi nhánh'})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {visibleToLocations.length === 0 && (
                    <p className="text-xs text-amber-600">
                      {isWarehouseActor
                        ? 'Chưa có chi nhánh đích để chuyển từ kho hiện tại.'
                        : isInboundRequest
                          ? 'Không xác định được chi nhánh của bạn để nhận hàng.'
                          : isBranchActor && branchRequestKind === 'transfer'
                            ? 'Chưa có chi nhánh khác để chuyển hàng.'
                            : 'Không có nơi nhận phù hợp.'}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="note" render={({ field }) => (
              <FormItem>
                  <FormLabel>
                    {isBranchActor && branchRequestKind === 'return'
                      ? 'Lý do trả hàng'
                      : 'Ghi chú đơn'}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        isBranchActor && branchRequestKind === 'return'
                          ? 'VD: Hàng lỗi, sai mẫu, thừa tồn...'
                          : labels.orderNotePlaceholder
                      }
                      rows={2}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
              </FormItem>
            )} />

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{dialogCopy.listTitle}</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => append({ ...EMPTY_DETAIL })}
                >
                  <Plus className="mr-1 size-4" />Thêm dòng
                </Button>
              </div>

              <MovementProductSearch
                usedIds={usedIds}
                onPick={applyProduct}
                searchScope="list"
                poolProducts={products}
                disabled={!fromLocationId}
                metaMode="stock"
                placeholder={
                  fromLocationId
                    ? 'Tìm hàng tại nơi gửi (có tồn)...'
                    : 'Chọn nơi gửi trước'
                }
              />

              {fromLocationId && products.length === 0 && (
                <p className="text-xs text-amber-600">{labels.noStockAtSource}</p>
              )}

              {fields.map((f, idx) => {
                const rowProductId = details[idx]?.productItemId
                const pickerProducts = products.filter(
                  (p) => p.id === rowProductId || !usedIds.has(p.id),
                )
                return (
                  <div key={f.id} className="space-y-3 rounded-lg border bg-muted/30 p-3">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <FormField
                          control={form.control}
                          name={`details.${idx}.productItemId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">
                                Hàng hóa <span className="text-destructive">*</span>
                              </FormLabel>
                              <ProductPickerField
                                products={pickerProducts}
                                value={field.value}
                                metaMode="stock"
                                onValueChange={(v) => {
                                  field.onChange(v)
                                  const p = products.find((x) => x.id === v)
                                  if (p?.costPrice) {
                                    form.setValue(
                                      `details.${idx}.importPrice`,
                                      Math.min(p.costPrice, MAX_IMPORT_PRICE),
                                      { shouldDirty: true, shouldValidate: true },
                                    )
                                  }
                                  if (typeof p?.stock === 'number' && p.stock > 0) {
                                    const currentQty = form.getValues(`details.${idx}.quantity`)
                                    form.setValue(
                                      `details.${idx}.quantity`,
                                      Math.min(Math.max(1, currentQty || 1), p.stock),
                                      { shouldDirty: true, shouldValidate: true },
                                    )
                                  }
                                  void form.trigger('details')
                                }}
                              />
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
                        aria-label="Xóa dòng"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <FormField
                        control={form.control}
                        name={`details.${idx}.quantity`}
                        render={({ field }) => {
                          const selected = products.find(
                            (p) => p.id === details[idx]?.productItemId,
                          )
                          const stockMax =
                            typeof selected?.stock === 'number'
                              ? selected.stock
                              : undefined
                          return (
                          <FormItem>
                            <FormLabel className="text-xs">
                              Số lượng <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <QuantityStepper
                                min={1}
                                max={stockMax}
                                value={Number.isFinite(field.value) ? field.value : 1}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                          )
                        }}
                      />

                      <FormField
                        control={form.control}
                        name={`details.${idx}.importPrice`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              Giá (đ) <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <MoneyInput value={field.value} onChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`details.${idx}.note`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Ghi chú dòng</FormLabel>
                            <FormControl>
                              <Input placeholder="Ghi chú mặt hàng (tùy chọn)" className="h-9 text-sm" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <p className="text-right text-xs text-muted-foreground">
                      Thành tiền:{' '}
                      <span className="font-medium text-foreground tabular-nums">
                        {formatMoneyVnd(
                          (details[idx]?.quantity || 0) * (details[idx]?.importPrice || 0),
                        )}
                      </span>
                    </p>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
              <span className="text-sm text-muted-foreground">Tổng giá trị đơn hàng</span>
              <span className="text-lg font-bold tabular-nums" title={formatMoneyVnd(total)}>
                {formatMoneyVnd(total)}
              </span>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="cursor-pointer">Hủy</Button>
              <Button type="submit" disabled={form.formState.isSubmitting || isOptionsLoading} className="cursor-pointer">
                <Plus className="mr-2 size-4" />
                {form.formState.isSubmitting ? 'Đang tạo...' : dialogCopy.submit}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
