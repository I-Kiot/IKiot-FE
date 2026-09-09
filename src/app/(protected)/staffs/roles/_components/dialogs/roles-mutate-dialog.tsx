// [Dialog – Mutate Role]
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
import type { Role } from '@/types/role'
import { useRoles } from '../../_context/roles-provider'
import {
  permissionKey,
  roleFormSchema,
  type RoleFormValues,
} from '../../_types/role.types'
import { PermissionPicker } from '../permission-picker'

const EMPTY_VALUES: RoleFormValues = {
  name: '',
  description: undefined,
  permissionKeys: [],
}

type RolesMutateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Role
}

export function RolesMutateDialog({
  open,
  onOpenChange,
  currentRow,
}: RolesMutateDialogProps) {
  const isEdit = !!currentRow
  const { handleAdd, handleEdit, catalog } = useRoles()

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: EMPTY_VALUES,
  })

  useEffect(() => {
    if (!open) return
    if (isEdit && currentRow) {
      form.reset({
        name: currentRow.name,
        description: currentRow.description ?? undefined,
        permissionKeys: currentRow.permissions.map((grant) =>
          permissionKey(grant.resource, grant.action),
        ),
      })
    } else {
      form.reset(EMPTY_VALUES)
    }
  }, [open, isEdit, currentRow, form])

  async function onSubmit(data: RoleFormValues) {
    const success =
      isEdit && currentRow
        ? await handleEdit(currentRow.id, data)
        : await handleAdd(data)
    if (success) onOpenChange(false)
  }

  const isSubmitting = form.formState.isSubmitting

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Sửa vai trò' : 'Thêm vai trò'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Thay đổi quyền sẽ áp dụng ngay ở request tiếp theo của những người đang giữ vai trò này - không cần họ đăng nhập lại.'
              : 'Đặt tên vai trò và chọn những gì người giữ nó được làm. Sau đó gán vai trò cho nhân viên ở màn hình danh sách nhân viên.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id="role-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Tên vai trò <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="VD: Thu ngân" {...field} />
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
                        rows={1}
                        placeholder="Vai trò này dùng cho ai"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="permissionKeys"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Quyền <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <PermissionPicker
                      groups={catalog}
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            form="role-form"
            className="cursor-pointer"
            disabled={isSubmitting}
          >
            {isEdit ? (
              <Pencil className="mr-2 size-4" />
            ) : (
              <Plus className="mr-2 size-4" />
            )}
            {isSubmitting ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo vai trò'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
