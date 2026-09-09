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

const branchFormSchema = z.object({
  name: z.string().min(1, {
    message: "Tên chi nhánh là bắt buộc.",
  }),
  status: z.string().min(1, {
    message: "Trạng thái là bắt buộc.",
  }),
  address: z.string().optional(),
  phoneNumber: z.string().min(10, {
    message: "Số điện thoại là bắt buộc và phải có ít nhất 10 số.",
  }),
  email: z.string().email({
    message: "Email không hợp lệ.",
  }).optional().or(z.literal("")),
})

export type BranchFormValues = z.infer<typeof branchFormSchema>

interface BranchFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: BranchFormValues) => void
  defaultValues?: Partial<BranchFormValues>
  title?: string
}

export function BranchFormDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  title,
}: BranchFormDialogProps) {
  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchFormSchema),
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

  function handleFormSubmit(data: BranchFormValues) {
    onSubmit(data)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title || "Thêm chi nhánh mới"}</DialogTitle>
          <DialogDescription>
            Nhập các thông tin chi tiết để tạo một chi nhánh mới. Nhấp Lưu khi bạn hoàn tất.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên chi nhánh</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tên chi nhánh (ví dụ: Chi nhánh Quận 1)" {...field} />
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
                    <Input placeholder="Nhập địa chỉ chi nhánh" {...field} />
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
                Lưu chi nhánh
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
