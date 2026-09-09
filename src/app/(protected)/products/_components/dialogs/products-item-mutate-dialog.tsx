'use client'

import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Plus, ShoppingBag, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { uploadImage } from '@/lib/api/upload'
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
        images: existingItem.images ?? [],
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file)
      form.setValue('images', [{ url, isThumbnail: true }])
      toast.success('Tải ảnh lên thành công')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Tải ảnh lên thất bại')
    } finally {
      setUploading(false)
    }
  }

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
      costPrice: parsePriceAmount(data.costPrice),
      retailPrice: parsePriceAmount(data.retailPrice),
      vat: data.vat ? Math.min(Number(data.vat), 100) : undefined,
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
            <div className="space-y-2">
              <FormLabel>Hình ảnh phiên bản</FormLabel>
              <div className="flex items-center gap-4">
                <div className="size-20 rounded-lg border bg-muted flex items-center justify-center overflow-hidden relative shrink-0">
                  {form.watch('images')?.[0]?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.watch('images')?.[0]?.url}
                      alt="Variant preview"
                      className="object-cover size-full"
                    />
                  ) : (
                    <ShoppingBag className="size-8 text-muted-foreground" />
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                      <span className="animate-spin size-4 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="cursor-pointer max-w-xs"
                    />
                    {form.watch('images')?.[0]?.url && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => form.setValue('images', [])}
                        disabled={uploading}
                        className="cursor-pointer text-destructive border-destructive/20 hover:bg-destructive/10"
                      >
                        Xóa ảnh
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Hỗ trợ định dạng JPG, PNG. Dung lượng tối đa 5MB.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="productCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Mã hàng <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="VD: HH-001" {...field} />
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
                    <FormLabel>
                      SKU <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="VD: SKU-HH001-001" {...field} />
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
              <Button type="submit" className="cursor-pointer">
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
