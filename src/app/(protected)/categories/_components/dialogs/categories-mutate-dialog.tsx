// [Dialog – Mutate Category]
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
import type { Category } from '@/types/category'
import { categoryFormSchema, type CategoryFormValues } from '../../_types/category.types'
import { useCategories } from '../../_context/categories-provider'

const EMPTY_VALUES: CategoryFormValues = {
  name: '',
  description: undefined,
  parentId: null,
  imageUrl: undefined,
}

type CategoriesMutateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Category
  defaultParentId?: string | null
}

export function CategoriesMutateDialog({
  open,
  onOpenChange,
  currentRow,
  defaultParentId,
}: CategoriesMutateDialogProps) {
  const isEdit = !!currentRow
  const { handleAdd, handleEdit } = useCategories()

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: EMPTY_VALUES,
  })

  useEffect(() => {
    if (!open) return
    if (isEdit && currentRow) {
      form.reset({
        name: currentRow.name,
        description: currentRow.description ?? undefined,
        parentId: typeof currentRow.parentId === 'string'
          ? currentRow.parentId
          : (currentRow.parentId as any)?.id ?? null,
        imageUrl: currentRow.imageUrl ?? undefined,
      })
    } else {
      form.reset({ ...EMPTY_VALUES, parentId: defaultParentId ?? null })
    }
  }, [open, isEdit, currentRow, defaultParentId, form])

  async function onSubmit(data: CategoryFormValues) {
    const success = isEdit && currentRow
      ? await handleEdit(currentRow.id, data)
      : await handleAdd(data)
    if (success) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Chỉnh sửa danh mục' : defaultParentId ? 'Thêm danh mục con' : 'Thêm danh mục mới'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Cập nhật thông tin danh mục. Nhấn Lưu khi hoàn tất.'
              : 'Điền thông tin danh mục. Nhấn Lưu khi hoàn tất.'}
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
                    Tên danh mục <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tên danh mục" {...field} />
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
                      placeholder="Nhập mô tả danh mục"
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
                    Thêm danh mục
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
