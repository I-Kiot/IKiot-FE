'use client'

import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import type { ProductItem } from '@/types/product'
import { productApi } from '@/lib/api/product'
import { productItemFormSchema, type ProductItemFormValues } from '../../_types/product.types'
import { formatPriceAmount, parsePriceAmount } from '../../_constants/product.constants'
import { ProductItemImagesField, toItemImagePayload } from '../product-item-images-field'

const EMPTY_VALUES: ProductItemFormValues = {
  useParentNameForItem: true,
  itemProductName: '',
  productCode: '',
  sku: '',
  barcode: '',
  retailPrice: '',
  costPrice: '',
  vat: '',
  warrantyPeriod: '',
  description: '',
  images: [],
  productDetails: [],
}


type Props =
  | {
      mode: 'create'
      productId: string
      productName: string
      open: boolean
      onOpenChange: (open: boolean) => void
      onSuccess: (item: ProductItem) => void
    }
  | {
      mode: 'edit'
      item: ProductItem
      open: boolean
      onOpenChange: (open: boolean) => void
      onSuccess: (item: ProductItem) => void
    }

export function ProductsItemMutateDialog(props: Props) {
  const { open, onOpenChange, onSuccess } = props
  const isEdit = props.mode === 'edit'
  const existingItem = props.mode === 'edit' ? props.item : undefined
  // Còn ảnh đang tải lên thì khoá nút Lưu, tránh lưu thiếu ảnh.
  const [uploading, setUploading] = useState(false)

  const form = useForm<ProductItemFormValues>({
    resolver: zodResolver(productItemFormSchema),
    defaultValues: EMPTY_VALUES,
  })

  const { fields: detailFields, append: appendDetail, remove: removeDetail } = useFieldArray({
    control: form.control,
    name: 'productDetails',
  })

  useEffect(() => {
    if (!open) return
    if (isEdit && existingItem) {
      form.reset({
        productCode: existingItem.productCode,
        sku: existingItem.sku,
        barcode: existingItem.barcode ?? '',
        retailPrice: formatPriceAmount(existingItem.retailPrice),
        costPrice: formatPriceAmount(existingItem.costPrice),
        vat: existingItem.vat != null ? String(existingItem.vat) : '',
        warrantyPeriod: existingItem.warrantyPeriod ?? '',
        description: existingItem.description ?? '',
        images: toItemImagePayload(existingItem.images),
        productDetails: existingItem.productDetails?.map((d) => ({ name: d.name, value: d.value })) ?? [],
        // Not used in edit mode (only create needs the parent/custom choice),
        // but the schema requires a value.
        useParentNameForItem: true,
        itemProductName: existingItem.productName,
      })
    } else {
      form.reset(EMPTY_VALUES)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, existingItem, form])

  async function onSubmit(data: ProductItemFormValues) {
    if (props.mode === 'create' && !data.useParentNameForItem && !data.itemProductName?.trim()) {
      form.setError('itemProductName', { message: 'Tên phiên bản là bắt buộc' })
      return
    }
    if (isEdit && !data.itemProductName?.trim()) {
      form.setError('itemProductName', { message: 'Tên phiên bản là bắt buộc' })
      return
    }

    const { useParentNameForItem, itemProductName, ...rest } = data
    const payload = {
      ...rest,
      // Để trống: tạo mới thì BE tự sinh, sửa thì giữ nguyên mã hiện có.
      productCode: data.productCode?.trim() || undefined,
      sku: data.sku?.trim() || undefined,
      costPrice: parsePriceAmount(data.costPrice),
      retailPrice: parsePriceAmount(data.retailPrice),
      vat: data.vat ? Math.min(Number(data.vat), 100) : undefined,
      images: toItemImagePayload(data.images),
      productDetails: data.productDetails?.filter((d) => d.name.trim() && d.value.trim()),
    }
    try {
      let result: ProductItem
      if (props.mode === 'edit') {
        result = await productApi.updateItem(props.item.id, {
          ...payload,
          productName: itemProductName!.trim(),
        })
        toast.success('Cập nhật phiên bản thành công')
      } else {
        const productName = useParentNameForItem
          ? props.productName
          : (itemProductName?.trim() || props.productName)
        result = await productApi.createItem(props.productId, { ...payload, productName })
        toast.success('Thêm phiên bản thành công')
      }
      onSuccess(result)
      onOpenChange(false)
    } catch {
      toast.error(isEdit ? 'Cập nhật phiên bản thất bại' : 'Thêm phiên bản thất bại')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Chỉnh sửa phiên bản' : 'Thêm phiên bản mới'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Cập nhật thông tin phiên bản. Nhấn Lưu khi hoàn tất.'
              : 'Điền thông tin phiên bản mới. Nhấn Lưu khi hoàn tất.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* === Tên phiên bản: dùng tên hàng hóa hoặc đặt tên riêng === */}
            {!isEdit && (
              <>
                <FormField
                  control={form.control}
                  name="useParentNameForItem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên phiên bản</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(v === 'parent')}
                        value={field.value ? 'parent' : 'custom'}
                      >
                        <FormControl>
                          <SelectTrigger className="cursor-pointer w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="parent">Dùng tên hàng hóa</SelectItem>
                          <SelectItem value="custom">Đặt tên riêng cho phiên bản</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!form.watch('useParentNameForItem') && (
                  <FormField
                    control={form.control}
                    name="itemProductName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Tên riêng phiên bản <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập tên riêng cho phiên bản" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
            )}

            {isEdit && (
              <FormField
                control={form.control}
                name="itemProductName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Tên phiên bản <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập tên phiên bản" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* === Tải ảnh phiên bản === */}
            <ProductItemImagesField
              value={form.watch('images') ?? []}
              onChange={(images) => form.setValue('images', images, { shouldDirty: true })}
              getLatest={() => form.getValues('images') ?? []}
              onBusyChange={setUploading}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="productCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mã hàng</FormLabel>
                    <FormControl>
                      <Input placeholder="Để trống để tự sinh (SP000001...)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="Để trống để lấy theo mã hàng" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Giá vốn (đ) <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        placeholder="0"
                        className="tabular-nums"
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '')
                          field.onChange(digits ? formatPriceAmount(digits) : '')
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="retailPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Giá bán (đ) <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        placeholder="0"
                        className="tabular-nums"
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '')
                          field.onChange(digits ? formatPriceAmount(digits) : '')
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>VAT (%)</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        placeholder="0"
                        className="tabular-nums"
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '')
                          if (!digits) { field.onChange(''); return }
                          const capped = Math.min(Number(digits), 100)
                          field.onChange(String(capped))
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mã vạch</FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập mã vạch" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="warrantyPeriod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thời hạn bảo hành</FormLabel>
                    <FormControl>
                      <Input placeholder="VD: 12 tháng" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Nhập mô tả"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* === Thuộc tính sản phẩm === */}
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel>Thuộc tính</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer h-7 text-xs"
                  onClick={() => appendDetail({ name: '', value: '' })}
                >
                  <Plus className="mr-1 size-3.5" />
                  Thêm thuộc tính
                </Button>
              </div>
              {detailFields.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  VD: Màu sắc - Đỏ, Dung lượng - 512GB
                </p>
              )}
              <div className="space-y-2">
                {detailFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Input
                      placeholder="Tên thuộc tính (VD: Màu sắc)"
                      className="flex-1"
                      {...form.register(`productDetails.${index}.name`)}
                    />
                    <Input
                      placeholder="Giá trị (VD: Đỏ)"
                      className="flex-1"
                      {...form.register(`productDetails.${index}.value`)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 cursor-pointer text-muted-foreground hover:text-destructive"
                      onClick={() => removeDetail(index)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="cursor-pointer"
              >
                Hủy
              </Button>
              <Button type="submit" disabled={uploading} className="cursor-pointer">
                {isEdit ? (
                  <>
                    <Pencil className="mr-2 h-4 w-4" />
                    Lưu thay đổi
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm phiên bản
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
