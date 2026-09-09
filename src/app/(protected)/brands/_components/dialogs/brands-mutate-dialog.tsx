// [Dialog – Mutate Brand]
'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Plus } from 'lucide-react'
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
import type { Brand } from '@/types/brand'
import { brandFormSchema, type BrandFormValues } from '../../_types/brand.types'
import { useBrands } from '../../_context/brands-provider'

const EMPTY_VALUES: BrandFormValues = {
  name: '',
  description: undefined,
  logo: undefined,
}

type BrandsMutateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Brand
}

export function BrandsMutateDialog({ open, onOpenChange, currentRow }: BrandsMutateDialogProps) {
  const isEdit = !!currentRow
  const { handleAdd, handleEdit } = useBrands()

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: EMPTY_VALUES,
  })

  useEffect(() => {
    if (!open) return
    if (isEdit && currentRow) {
      form.reset({
        name: currentRow.name,
        description: currentRow.description ?? undefined,
        logo: currentRow.logo ?? undefined,
      })
    } else {
      form.reset(EMPTY_VALUES)
    }
  }, [open, isEdit, currentRow, form])

  async function onSubmit(data: BrandFormValues) {
    const success = isEdit && currentRow
      ? await handleEdit(currentRow.id, data)
      : await handleAdd(data)
    if (success) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Chỉnh sửa thương hiệu' : 'Thêm thương hiệu mới'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Cập nhật thông tin thương hiệu. Nhấn Lưu khi hoàn tất.'
              : 'Điền thông tin thương hiệu mới. Nhấn Lưu khi hoàn tất.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Tên thương hiệu <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tên thương hiệu" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Nhập mô tả thương hiệu"
                      className="resize-none"
                      rows={3}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    Thêm thương hiệu
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
