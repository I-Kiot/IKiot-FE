"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { SWITCHER_STATUS_OPTIONS } from "./constants/status"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

// Mirrors branchFormSchema: `CreateWarehouseDto` gained `phoneNumber` and `email` in the
// 2026-08-19 migration that gave warehouses the same contact details a branch has, and
// `phoneNumber` is **required** there (`@ArrayNotEmpty`). This form never collected it, so
// every "thêm kho hàng" was a 400 the moment the field existed server-side.
const warehouseFormSchema = z.object({
  name: z.string().min(1, {
    message: "Tên kho hàng là bắt buộc.",
  }),
  status: z.string().min(1, {
    message: "Trạng thái là bắt buộc.",
  }),
  address: z.string(),
  phoneNumber: z.string().min(10, {
    message: "Số điện thoại là bắt buộc và phải có ít nhất 10 số.",
  }),
  email: z
    .string()
    .email({ message: "Email không hợp lệ." })
    .optional()
    .or(z.literal("")),
})

export type WarehouseFormValues = z.infer<typeof warehouseFormSchema>

interface WarehouseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: WarehouseFormValues) => void
  defaultValues?: Partial<WarehouseFormValues>
  title?: string
}

export function WarehouseFormDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  title,
}: WarehouseFormDialogProps) {
  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseFormSchema),
    defaultValues: {
      name: "",
      status: "ACTIVE",
      address: "",
      phoneNumber: "",
      email: "",
      ...defaultValues,
    },
  })

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: "",
        status: "ACTIVE",
        address: "",
        phoneNumber: "",
        email: "",
        ...defaultValues,
      })
    }
  }, [open, defaultValues, form])

  function handleFormSubmit(data: WarehouseFormValues) {
    onSubmit(data)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title || "Thêm kho hàng mới"}</DialogTitle>
          <DialogDescription>
            Nhập các thông tin chi tiết để tạo một kho hàng mới. Nhấp Lưu khi bạn hoàn tất.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên kho hàng</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tên kho hàng (ví dụ: Kho trung tâm)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trạng thái</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="cursor-pointer w-full">
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SWITCHER_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Địa chỉ</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập địa chỉ kho hàng" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số điện thoại</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập số điện thoại (ví dụ: 0987654321)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Tùy chọn)</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Nhập địa chỉ email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit" className="cursor-pointer">
                Lưu kho hàng
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
